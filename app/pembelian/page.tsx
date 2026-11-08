'use client'
import { useEffect, useState } from 'react'
import { db, Supplier, Product, Purchase } from '@/lib/db'

export default function PembelianPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  
  // State Form Pesanan
  const [supplierId, setSupplierId] = useState('')
  const [productPick, setProductPick] = useState('')
  const [qty, setQty] = useState('1')
  const [draft, setDraft] = useState<{ product: Product, qty: number }[]>([])
  const [msg, setMsg] = useState('')

  // State Modal Terima Barang
  const [receiveData, setReceiveData] = useState<Purchase | null>(null)
  const [costInputs, setCostInputs] = useState<Record<string, string>>({})

  // State Modal Detail Riwayat Pembelian
  const [detailPurchase, setDetailPurchase] = useState<Purchase | null>(null)

  async function load() {
    setSuppliers(await db.suppliers.toArray())
    setProducts(await db.products.toArray())
    const allPurchases = await db.purchases.toArray()
    setPurchases(allPurchases.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
  }
  
  useEffect(() => { load() }, [])

  function addItem() {
    const prod = products.find(x => x.id === productPick)
    if (!prod || Number(qty) <= 0) return
    
    setDraft(prev => {
      const found = prev.find(d => d.product.id === prod.id)
      if (found) return prev.map(d => d.product.id === prod.id ? { ...d, qty: d.qty + Number(qty) } : d)
      return [...prev, { product: prod, qty: Number(qty) }]
    })
    
    setProductPick(''); 
    setQty('1')
  }

  async function submitOrder() {
    if (!supplierId || !draft.length) return setMsg('Pilih pemasok dan minimal 1 item.')
    
    await db.purchases.add({
      id: crypto.randomUUID(),
      supplier_id: supplierId,
      total: 0,
      status: 'sent',
      created_at: new Date().toISOString(),
      items: draft.map(d => ({ product_id: d.product.id, name: d.product.name, qty: d.qty, cost_per_pcs: 0 }))
    })

    const sup = suppliers.find(s => s.id === supplierId)
    if (sup?.contact) {
      const wa = sup.contact.replace(/\D/g, '').replace(/^0/, '62')
      let text = `Halo *${sup.name}*, saya mau pesan:\n`
      draft.forEach((d, i) => { text += `${i+1}. ${d.product.name} - ${d.qty} pcs\n` })
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, '_blank')
    }

    setDraft([]); 
    setSupplierId(''); 
    setMsg('Pesanan dibuat & WhatsApp dibuka!')
    load()
  }

  function openReceiveModal(p: Purchase, e: React.MouseEvent) {
    e.stopPropagation()
    setReceiveData(p)
    const initialCosts: Record<string, string> = {}
    p.items.forEach(item => { initialCosts[item.product_id] = '' })
    setCostInputs(initialCosts)
  }

  async function handleSaveReceive() {
    if (!receiveData) return

    let totalModalKeseluruhan = 0
    const hargaPerPcsMap: Record<string, number> = {}
    
    for (const item of receiveData.items) {
      const inputHargaPerPcs = Number(costInputs[item.product_id])
      if (isNaN(inputHargaPerPcs) || inputHargaPerPcs <= 0) {
        return alert(`Harap isi harga untuk ${item.name} dengan benar.`)
      }
      hargaPerPcsMap[item.product_id] = inputHargaPerPcs
      totalModalKeseluruhan += (inputHargaPerPcs * item.qty)
    }

    await db.transaction('rw', db.products, db.purchases, async () => {
      const updatedItems = receiveData.items.map(item => ({
        ...item,
        cost_per_pcs: hargaPerPcsMap[item.product_id]
      }))

      await db.purchases.update(receiveData.id, { 
        status: 'received', 
        total: totalModalKeseluruhan,
        items: updatedItems
      })
      
      for (const item of receiveData.items) {
        const prod = await db.products.get(item.product_id)
        if (prod) {
          await db.products.update(item.product_id, { 
            stock_qty: prod.stock_qty + item.qty,
            cost: hargaPerPcsMap[item.product_id]
          })
        }
      }
    })
    
    setReceiveData(null)
    load()
  }

  // --- LOGIKA GROUPING PER PEMASOK ---
  const groupedPurchases = suppliers.map(sup => {
    return {
      supplier: sup,
      history: purchases.filter(p => p.supplier_id === sup.id)
    }
  }).filter(group => group.history.length > 0) // Hanya tampilkan pemasok yang punya riwayat

  return (
    <div className="p-4 pb-24 space-y-4 relative">
      <h1 className="text-xl font-bold">Pembelian</h1>
      
      {/* FORM BUAT PESANAN */}
      <div className="bg-white p-3 border rounded-lg shadow-sm space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select className="border p-2 rounded bg-gray-50" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
            <option value="">-- Pilih Pemasok --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          
          <div className="flex gap-2">
            <select className="border p-2 rounded bg-gray-50 flex-1" value={productPick} onChange={e => setProductPick(e.target.value)}>
              <option value="">-- Pilih Produk --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" className="border p-2 rounded w-16 text-center" value={qty} onChange={e => setQty(e.target.value)} />
            <button onClick={addItem} className="bg-gray-800 text-white px-4 rounded font-bold">+</button>
          </div>
        </div>
        
        {draft.length > 0 && (
          <div className="bg-gray-50 p-2 rounded text-sm mb-2 border">
            {draft.map((d, i) => <div key={i}>{d.product.name} - {d.qty} pcs</div>)}
          </div>
        )}
        
        <button onClick={submitOrder} className="bg-blue-600 text-white px-4 py-2 rounded w-full font-semibold hover:bg-blue-700">
          Buat Pesanan & Kirim WA
        </button>
        {msg && <p className="text-blue-600 text-sm">{msg}</p>}
      </div>

      {/* RIWAYAT PEMBELIAN (DI-GROUPING) */}
      <div className="space-y-6 pt-2">
        <h2 className="font-semibold text-lg">Riwayat Pembelian (Per Pemasok)</h2>
        
        {groupedPurchases.length === 0 && (
          <p className="text-sm text-gray-500">Belum ada riwayat pembelian.</p>
        )}

        {groupedPurchases.map(({ supplier, history }) => (
          <div key={supplier.id} className="space-y-2">
            <h3 className="font-bold text-blue-800 bg-blue-50 inline-block px-3 py-1 rounded-lg border border-blue-100">
              🏭 {supplier.name}
            </h3>
            
            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-700 font-bold border-b">
                    <th className="p-3">Tanggal</th>
                    <th className="p-3 text-right">Total Modal</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(p => (
                    <tr 
                      key={p.id} 
                      onClick={() => setDetailPurchase(p)}
                      className="border-b last:border-0 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="p-3 text-right">
                        {p.total > 0 ? `Rp ${p.total.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          p.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {p.status === 'sent' && (
                          <button 
                            onClick={(e) => openReceiveModal(p, e)} 
                            className="text-green-600 font-bold text-xs hover:underline px-2 py-1 bg-green-50 rounded"
                          >
                            terima
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: INPUT HARGA MODAL (SAAT TERIMA BARANG) */}
      {receiveData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-4 shadow-xl">
            <div>
              <h2 className="font-bold text-lg text-gray-900">Penerimaan Barang</h2>
              <p className="text-sm text-gray-500 mt-1">Masukkan harga beli (modal) sesuai nota dari supplier.</p>
            </div>
            
            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {receiveData.items.map((item) => (
                <div key={item.product_id} className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-800">
                    {item.name} <span className="text-gray-500 font-normal">({item.qty} pcs)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Rp</span>
                    <input 
                      type="number" 
                      className="border border-gray-300 p-2.5 rounded-lg flex-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="Harga per pcs"
                      value={costInputs[item.product_id] || ''}
                      onChange={(e) => setCostInputs({ ...costInputs, [item.product_id]: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t mt-4">
              <button 
                onClick={() => setReceiveData(null)} 
                className="px-4 py-2.5 text-gray-600 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveReceive} 
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Simpan & Tambah Stok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL RINCIAN PEMBELIAN */}
      {detailPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-4 shadow-xl">
            <div className="border-b pb-3">
              <h2 className="font-bold text-lg text-gray-900">Detail Pembelian</h2>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(detailPurchase.created_at).toLocaleString('id-ID')} • 
                <span className={`ml-1 uppercase font-bold ${detailPurchase.status === 'received' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {detailPurchase.status}
                </span>
              </p>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {detailPurchase.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm border-b pb-2 last:border-0">
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.qty} pcs</p>
                  </div>
                  <div className="text-right">
                    {item.cost_per_pcs > 0 ? (
                      <>
                        <p className="font-medium">Rp {(item.cost_per_pcs * item.qty).toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">@ Rp {item.cost_per_pcs.toLocaleString()}/pcs</p>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Belum ada harga</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t mt-2">
              <span className="font-bold text-gray-600">Total Modal</span>
              <span className="font-bold text-lg text-blue-600">
                {detailPurchase.total > 0 ? `Rp ${detailPurchase.total.toLocaleString()}` : '-'}
              </span>
            </div>

            <button 
              onClick={() => setDetailPurchase(null)} 
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}