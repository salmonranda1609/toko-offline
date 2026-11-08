'use client'
import { useEffect, useState } from 'react'
import { getSuppliers, getProducts, getPurchases, savePurchase, receivePurchase, Supplier, Product, Purchase } from '@/lib/db'

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
    setSuppliers(await getSuppliers())
    setProducts(await getProducts())
    setPurchases(await getPurchases())
  }
  useEffect(() => { load() }, [])

  function addItem() {
    const prod = products.find(x => x.id === productPick)
    if (!prod || Number(qty) <= 0) return
    setDraft(prev => [...prev, { product: prod, qty: Number(qty) }])
    setProductPick(''); setQty('1')
  }

  async function submitOrder() {
    if (!supplierId || !draft.length) return setMsg('Pilih pemasok dan item.')
    
    await savePurchase({
      id: crypto.randomUUID(),
      supplier_id: supplierId,
      total: 0,
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

    setDraft([]); setSupplierId(''); setMsg('Pesanan dibuat!')
    load()
  }

  // Fungsi Terima Barang
  async function handleReceive(p: Purchase) {
    const input = prompt('Masukkan Harga Modal Total (Rp) untuk pesanan ini:')
    if (!input) return
    const totalCost = Number(input)
    const costData: Record<string, number> = {}
    let remaining = totalCost
    p.items.forEach((item, index) => {
      // Bagi rata sementara jika hanya input total, idealnya input per item
      const cost = index === p.items.length - 1 ? remaining : Math.floor(totalCost / p.items.length)
      costData[item.product_id] = cost
      remaining -= cost
    })
    await receivePurchase(p, costData)
    load()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Pembelian</h1>
      
      <div className="bg-white p-3 border rounded space-y-2">
        <div className="flex gap-2 flex-wrap">
          <select className="border p-2 rounded flex-1" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
            <option value="">-- Pemasok --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="border p-2 rounded flex-1" value={productPick} onChange={e => setProductPick(e.target.value)}>
            <option value="">-- Produk --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" className="border p-2 rounded w-20" value={qty} onChange={e => setQty(e.target.value)} />
          <button onClick={addItem} className="bg-gray-800 text-white px-3 rounded">+</button>
        </div>
        
        {draft.map((d, i) => <div key={i} className="text-sm">{d.product.name} - {d.qty} pcs</div>)}
        
        <button onClick={submitOrder} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Pesan & WA</button>
        {msg && <p className="text-blue-600 text-sm">{msg}</p>}
      </div>

      <table className="w-full bg-white border text-sm">
        <thead><tr className="bg-gray-100 text-left"><th className="p-2">Tanggal</th><th className="p-2">Status</th><th className="p-2">Total Modal</th><th className="p-2">Aksi</th></tr></thead>
        <tbody>
          {purchases.map(p => {
            const sup = suppliers.find(s => s.id === p.supplier_id)
            return (
              <tr key={p.id} className="border-t">
                <td className="p-2">{new Date(p.created_at).toLocaleDateString('id-ID')}</td>
                <td className="p-2">{sup?.name || 'Pemasok'} ({p.status})</td>
                <td className="p-2">{p.total ? 'Rp ' + p.total.toLocaleString() : '-'}</td>
                <td className="p-2">
                  {p.status === 'sent' && <button onClick={() => handleReceive(p)} className="text-green-600 font-bold text-xs">Terima</button>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
