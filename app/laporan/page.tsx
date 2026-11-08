'use client'
import { useEffect, useState } from 'react'
import { db, Supplier, Product, Purchase } from '@/lib/db'

export default function PembelianPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  
  const [supplierId, setSupplierId] = useState('')
  const [productPick, setProductPick] = useState('')
  const [qty, setQty] = useState('1')
  const [draft, setDraft] = useState<{ product: Product, qty: number }[]>([])
  const [msg, setMsg] = useState('')

  async function load() {
    setSuppliers(await db.suppliers.toArray())
    setProducts(await db.products.toArray())
    // Urutkan pembelian dari yang terbaru
    const allPurchases = await db.purchases.toArray()
    setPurchases(allPurchases.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
  }
  
  useEffect(() => { load() }, [])

  function addItem() {
    const prod = products.find(x => x.id === productPick)
    if (!prod || Number(qty) <= 0) return
    setDraft(prev => [...prev, { product: prod, qty: Number(qty) }])
    setProductPick(''); 
    setQty('1')
  }

  async function submitOrder() {
    if (!supplierId || !draft.length) return setMsg('Pilih pemasok dan minimal 1 item.')
    
    await db.purchases.add({
      id: crypto.randomUUID(),
      supplier_id: supplierId,
      total: 0, // Total modal diisi nanti saat barang diterima
      status: 'sent',
      created_at: new Date().toISOString(),
      items: draft.map(d => ({ product_id: d.product.id, qty: d.qty }))
    })

    // Buka WA (butuh internet)
    const sup = suppliers.find(s => s.id === supplierId)
    if (sup?.contact) {
      const wa = sup.contact.replace(/\D/g, '').replace(/^0/, '62')
      let text = `Halo *${sup.name}*, saya mau pesan:\n`
      draft.forEach((d, i) => { text += `${i+1}. ${d.product.name} - ${d.qty} pcs\n` })
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, '_blank')
    }

    setDraft([]); 
    setSupplierId(''); 
    setMsg('Pesanan dibuat & WA dibuka!')
    load()
  }

  async function handleReceive(p: Purchase) {
    const input = prompt('Masukkan Total Harga Modal (Rp) sesuai nota supplier:')
    if (!input) return
    const totalCost = Number(input)
    
    await db.transaction('rw', db.products, db.purchases, async () => {
      // 1. Update status pesanan
      await db.purchases.update(p.id, { status: 'received', total: totalCost })
      
      // 2. Tambah stok produk & update harga modal
      const costPerItem = Math.floor(totalCost / p.items.length)
      
      for (const item of p.items) {
        const prod = await db.products.get(item.product_id)
        if (prod) {
          await db.products.update(item.product_id, { 
            stock_qty: prod.stock_qty + item.qty,
            cost: costPerItem / item.qty 
          })
        }
      }
    })
    load()
  }

  return (
    <div className="p-4 space-y-4">
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
        
        {/* Keranjang Sementara */}
        {draft.length > 0 && (
          <div className="bg-gray-50 p-2 rounded text-sm mb-2">
            {draft.map((d, i) => <div key={i}>{d.product.name} - {d.qty} pcs</div>)}
          </div>
        )}
        
        <button onClick={submitOrder} className="bg-blue-600 text-white px-4 py-2 rounded w-full font-semibold">
          Buat Pesanan & Kirim WA
        </button>
        {msg && <p className="text-blue-600 text-sm">{msg}</p>}
      </div>

      {/* TABEL RIWAYAT PEMBELIAN */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-700 font-bold border-b">
              <th className="p-3">Pemasok</th>
              <th className="p-3 text-right">Total Modal</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Tanggal</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => {
              const sup = suppliers.find(s => s.id === p.supplier_id)
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3">{sup?.name || 'Pemasok Terhapus'}</td>
                  <td className="p-3 text-right">
                    {p.total > 0 ? `Rp ${p.total.toLocaleString()}` : '-'}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      p.status === 'received' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-3 text-center">
                    {p.status === 'sent' && (
                      <button 
                        onClick={() => handleReceive(p)} 
                        className="text-green-600 font-bold text-xs hover:underline"
                      >
                        terima
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {purchases.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">Belum ada riwayat pembelian.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}