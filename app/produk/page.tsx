'use client'
import { useEffect, useState } from 'react'
import { getProducts, saveProduct, deleteProduct, Product } from '@/lib/db'

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', cost: '', stock_qty: '' })

  async function load() { setProducts(await getProducts()) }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await saveProduct({
      id: crypto.randomUUID(),
      name: form.name,
      price: Number(form.price),
      cost: Number(form.cost || 0),
      stock_qty: Number(form.stock_qty || 0)
    })
    setForm({ name: '', price: '', cost: '', stock_qty: '' })
    setShowForm(false)
    load()
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Produk</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
          {showForm ? 'Tutup' : '+ Tambah Produk'}
        </button>
      </div>
      
      {showForm && (
        <form onSubmit={handleSave} className="bg-white p-3 rounded border grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="border p-2 rounded" placeholder="Nama" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input className="border p-2 rounded" type="number" placeholder="Harga Jual" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
          <input className="border p-2 rounded" type="number" placeholder="Stok Awal" value={form.stock_qty} onChange={e => setForm({ ...form, stock_qty: e.target.value })} />
          <button className="bg-green-600 text-white p-2 rounded">Simpan</button>
        </form>
      )}

      <table className="w-full bg-white border text-sm">
        <thead><tr className="bg-gray-100 text-left"><th className="p-2">Nama</th><th className="p-2 text-right">Harga</th><th className="p-2 text-right">Stok</th><th className="p-2"></th></tr></thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.name}</td>
              <td className="p-2 text-right">Rp {p.price.toLocaleString()}</td>
              <td className="p-2 text-right">{p.stock_qty}</td>
              <td className="p-2 text-right"><button onClick={() => { if(confirm('Hapus?')) { deleteProduct(p.id); load() } }} className="text-red-500 text-xs">hapus</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
