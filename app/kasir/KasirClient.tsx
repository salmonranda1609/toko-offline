
'use client'
import { useEffect, useState, useRef } from 'react'
import { db, Product, Sale } from '@/lib/db'
import html2canvas from 'html2canvas'

export default function KasirClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<{ product: Product, qty: number }[]>([])
  const [search, setSearch] = useState('')
  
  // State untuk struk
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  async function load() { setProducts(await db.products.toArray()) }
  useEffect(() => { load() }, [])

  function addToCart(p: Product) {
    setCart(prev => {
      const found = prev.find(c => c.product.id === p.id)
      if (found) return prev.map(c => c.product.id === p.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { product: p, qty: 1 }]
    })
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(c => {
      if (c.product.id === id) {
        const newQty = c.qty + delta
        return newQty > 0 ? { ...c, qty: newQty } : c
      }
      return c
    }))
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(c => c.product.id !== id))
  }

  const total = cart.reduce((s, c) => s + c.product.price * c.qty, 0)

  async function checkout(method: string) {
    if (!cart.length) return
    
    const newSale: Sale = {
      id: crypto.randomUUID(),
      total,
      method,
      created_at: new Date().toISOString(),
      items: cart.map(c => ({ product_id: c.product.id, name: c.product.name, qty: c.qty, price: c.product.price }))
    }

    await db.transaction('rw', db.products, db.sales, async () => {
      await db.sales.add(newSale)
      for (const item of cart) {
        const prod = await db.products.get(item.product.id)
        if (prod) {
          await db.products.update(item.product.id, { stock_qty: prod.stock_qty - item.qty })
        }
      }
    })

    setReceipt(newSale) // Tampilkan modal struk
    setCart([])
    load()
  }

  // Fungsi Unduh Struk
  async function downloadReceipt() {
    if (!receiptRef.current) return
    const canvas = await html2canvas(receiptRef.current)
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `struk-${new Date(receipt!.created_at).getTime()}.png`
    a.click()
  }

  // Fungsi Kirim WA
  function sendToWA() {
    if (!receipt) return
    let text = `*STRUK BELANJA*\nTanggal: ${new Date(receipt.created_at).toLocaleString('id-ID')}\n\n`
    receipt.items.forEach(item => {
      text += `${item.name} ${item.qty}x @${item.price} = ${item.qty * item.price}\n`
    })
    text += `\n*Total: Rp ${receipt.total.toLocaleString()}*\nMetode: ${receipt.method.toUpperCase()}`
    
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
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
        {cart.length === 0 && <p className="text-sm text-gray-500 mb-4">Belum ada item.</p>}
        
        {cart.map(c => (
          <div key={c.product.id} className="flex justify-between items-center py-2 border-b text-sm">
            <div className="flex-1">
              <p className="font-medium">{c.product.name}</p>
              <p className="text-gray-500 text-xs">Rp {c.product.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQty(c.product.id, -1)} className="bg-gray-200 w-6 h-6 rounded flex items-center justify-center font-bold">-</button>
              <span className="w-6 text-center">{c.qty}</span>
              <button onClick={() => updateQty(c.product.id, 1)} className="bg-gray-200 w-6 h-6 rounded flex items-center justify-center font-bold">+</button>
              <button onClick={() => removeFromCart(c.product.id)} className="text-red-500 text-xs ml-2">x</button>
            </div>
          </div>
        ))}
        
        <div className="font-bold mt-4 text-lg">Total: Rp {total.toLocaleString()}</div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {['cash', 'qris', 'transfer'].map(m => (
            <button key={m} onClick={() => checkout(m)} disabled={!cart.length} className="bg-blue-600 text-white p-2 rounded disabled:opacity-50 uppercase text-xs">
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* MODAL STRUK */}
      {receipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-4 shadow-xl">
            <div ref={receiptRef} className="bg-white p-4 border rounded text-sm font-mono text-gray-800">
              <div className="text-center mb-4">
                <h2 className="font-bold text-lg">Toko Kelontong</h2>
                <p className="text-xs">{new Date(receipt.created_at).toLocaleString('id-ID')}</p>
              </div>
              <div className="border-t border-b border-dashed py-2 mb-2 space-y-1">
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.name} {item.qty}x</span>
                    <span>{(item.qty * item.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>Rp {receipt.total.toLocaleString()}</span>
              </div>
              <div className="text-center text-xs mt-4">Terima Kasih!</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={downloadReceipt} className="bg-green-600 text-white py-2 rounded font-bold text-xs">Unduh Gambar</button>
              <button onClick={sendToWA} className="bg-green-500 text-white py-2 rounded font-bold text-xs">Kirim WA</button>
            </div>
            <button onClick={() => setReceipt(null)} className="w-full bg-gray-200 py-2 rounded font-bold text-sm">Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}