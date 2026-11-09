'use client'
import { useEffect, useState } from 'react'
import { db, Product } from '@/lib/db'

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', cost: '', stock_qty: '' })
<<<<<<< HEAD
=======
  
  // State Edit Produk
  const [editProduct, setEditProduct] = useState<Product | null>(null)
>>>>>>> ffeabc0 (Commit pertama)

  async function load() { setProducts(await db.products.toArray()) }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await db.products.add({
      id: crypto.randomUUID(),
<<<<<<< HEAD
      name: form.name,
      price: Number(form.price),
      cost: Number(form.cost || 0),
      stock_qty: Number(form.stock_qty || 0)
=======
      name: form.name, price: Number(form.price),
      cost: Number(form.cost || 0), stock_qty: Number(form.stock_qty || 0)
>>>>>>> ffeabc0 (Commit pertama)
    })
    setForm({ name: '', price: '', cost: '', stock_qty: '' })
    setShowForm(false)
    load()
  }

<<<<<<< HEAD
  async function deleteItem(id: string) {
    if (!confirm('Hapus produk ini?')) return
    await db.products.delete(id)
    load()
  }

=======
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editProduct) return
    await db.products.update(editProduct.id, {
      name: editProduct.name, price: Number(editProduct.price),
      stock_qty: Number(editProduct.stock_qty)
    })
    setEditProduct(null)
    load()
  }

  async function handleDelete() {
    if (!editProduct) return
    if (confirm('Hapus produk ini?')) {
      await db.products.delete(editProduct.id)
      setEditProduct(null)
      load()
    }
  }

>>>>>>> ffeabc0 (Commit pertama)
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Produk</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
<<<<<<< HEAD
          {showForm ? 'Tutup' : '+ Tambah Produk'}
=======
          {showForm ? 'Tutup' : '+ Tambah'}
>>>>>>> ffeabc0 (Commit pertama)
        </button>
      </div>
      
      {showForm && (
        <form onSubmit={handleSave} className="bg-white p-3 rounded border grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="border p-2 rounded" placeholder="Nama" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input className="border p-2 rounded" type="number" placeholder="Harga Jual" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
          <input className="border p-2 rounded" type="number" placeholder="Stok Awal" value={form.stock_qty} onChange={e => setForm({ ...form, stock_qty: e.target.value })} />
<<<<<<< HEAD
<<<<<<< HEAD
          <button className="bg-green-600 text-white p-2 rounded">Simpan</button>
=======
          <button className="bg-green-600 text-white p-2 rounded font-semibold">Simpan</button>
>>>>>>> 44a9bed (pesan penjelasan update)
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
              <td className="p-2 text-right"><button onClick={() => deleteItem(p.id)} className="text-red-500 text-xs">hapus</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
=======
          <button className="bg-green-600 text-white p-2 rounded font-semibold">Simpan</button>
        </form>
      )}

      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-100 text-left"><th className="p-3">Nama</th><th className="p-3 text-right">Harga</th><th className="p-3 text-right">Stok</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} onClick={() => setEditProduct(p)} className="border-t hover:bg-blue-50 cursor-pointer">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-right">Rp {p.price.toLocaleString()}</td>
                <td className="p-3 text-right">{p.stock_qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT PRODUK */}
      {editProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdate} className="bg-white rounded-xl p-5 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-bold text-lg">Edit Produk</h2>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Nama Produk</label>
              <input className="border p-2 rounded w-full" value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} required />
              
              <label className="text-sm text-gray-600">Harga Jual</label>
              <input className="border p-2 rounded w-full" type="number" value={editProduct.price} onChange={e => setEditProduct({ ...editProduct, price: Number(e.target.value) })} required />
              
              <label className="text-sm text-gray-600">Stok</label>
              <input className="border p-2 rounded w-full" type="number" value={editProduct.stock_qty} onChange={e => setEditProduct({ ...editProduct, stock_qty: Number(e.target.value) })} required />
            </div>
            
            <div className="flex gap-2 justify-between pt-4">
              <button type="button" onClick={handleDelete} className="text-red-500 font-bold text-sm">Hapus</button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditProduct(null)} className="px-4 py-2 text-gray-600 border rounded-lg text-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">Simpan</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
>>>>>>> ffeabc0 (Commit pertama)
