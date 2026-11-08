'use client'
import { useEffect, useState } from 'react'
import { db, Product } from '@/lib/db'

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<{ product: Product, qty: number }[]>([])
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')

  async function load() { setProducts(await db.products.toArray()) }
  useEffect(() => { load() }, [])

  function addToCart(p: Product) {
    setCart(prev => {
      const found = prev.find(c => c.product.id === p.id)
      if (found) return prev.map(c => c.product.id === p.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { product: p, qty: 1 }]
    })
  }

  const total = cart.reduce((s, c) => s + c.product.price * c.qty, 0)

  async function checkout(method: string) {
    if (!cart.length) return
    
    // Gunakan Dexie Transaction agar aman
    await db.transaction('rw', db.products, db.sales, async () => {
      // 1. Simpan transaksi
      await db.sales.add({
        id: crypto.randomUUID(),
        total,
        method,
        created_at: new Date().toISOString(),
        items: cart.map(c => ({ product_id: c.product.id, name: c.product.name, qty: c.qty, price: c.product.price }))
      })
      
      // 2. Kurangi stok
      for (const item of cart) {
        const prod = await db.products.get(item.product.id)
        if (prod) {
          await db.products.update(item.product.id, { stock_qty: prod.stock_qty - item.qty })
        }
      }
    })

    setMsg('Transaksi Berhasil!')
    setCart([])
    load()
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <input className="border p-2 w-full mb-2 rounded" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
            <button key={p.id} onClick={() => addToCart(p)} className="border p-2 rounded text-left bg-white hover:bg-gray-50">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm">Rp {p.price.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Stok: {p.stock_qty}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="border p-4 rounded bg-white h-fit">
        <h2 className="font-bold mb-2">Keranjang</h2>
        {cart.map(c => (
          <div key={c.product.id} className="flex justify-between py-1 border-b text-sm">
            <span>{c.product.name} x{c.qty}</span>
            <span>Rp {(c.product.price * c.qty).toLocaleString()}</span>
          </div>
        ))}
        <div className="font-bold mt-4 text-lg">Total: Rp {total.toLocaleString()}</div>
        {msg && <p className="text-green-600 text-sm font-bold mt-2">{msg}</p>}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {['cash', 'qris', 'transfer'].map(m => (
            <button key={m} onClick={() => checkout(m)} disabled={!cart.length} className="bg-blue-600 text-white p-2 rounded disabled:opacity-50 uppercase text-xs">
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
