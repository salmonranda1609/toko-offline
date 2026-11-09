'use client'
import { useEffect, useState } from 'react'
import { db, Supplier } from '@/lib/db'

export default function PemasokPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [form, setForm] = useState({ name: '', contact: '' })
  
  // State Edit Pemasok
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)

  async function load() { setSuppliers(await db.suppliers.toArray()) }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await db.suppliers.add({ id: crypto.randomUUID(), name: form.name, contact: form.contact })
    setForm({ name: '', contact: '' })
    load()
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editSupplier) return
    await db.suppliers.update(editSupplier.id, { name: editSupplier.name, contact: editSupplier.contact })
    setEditSupplier(null)
    load()
  }

  async function handleDelete() {
    if (!editSupplier) return
    if (confirm('Hapus pemasok ini?')) {
      await db.suppliers.delete(editSupplier.id)
      setEditSupplier(null)
      load()
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Pemasok</h1>
      <form onSubmit={handleSave} className="bg-white p-3 rounded border grid grid-cols-1 md:grid-cols-3 gap-2">
        <input className="border p-2 rounded" placeholder="Nama Pemasok" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input className="border p-2 rounded" placeholder="No WA (0812...)" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
        <button className="bg-blue-600 text-white p-2 rounded font-semibold">Tambah</button>
      </form>

      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-100 text-left"><th className="p-3">Nama</th><th className="p-3">Kontak</th></tr></thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} onClick={() => setEditSupplier(s)} className="border-t hover:bg-blue-50 cursor-pointer">
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3">{s.contact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT PEMASOK */}
      {editSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdate} className="bg-white rounded-xl p-5 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-bold text-lg">Edit Pemasok</h2>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Nama Pemasok</label>
              <input className="border p-2 rounded w-full" value={editSupplier.name} onChange={e => setEditSupplier({ ...editSupplier, name: e.target.value })} required />
              
              <label className="text-sm text-gray-600">Nomor WhatsApp</label>
              <input className="border p-2 rounded w-full" value={editSupplier.contact} onChange={e => setEditSupplier({ ...editSupplier, contact: e.target.value })} />
            </div>
            
            <div className="flex gap-2 justify-between pt-4">
              <button type="button" onClick={handleDelete} className="text-red-500 font-bold text-sm">Hapus</button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditSupplier(null)} className="px-4 py-2 text-gray-600 border rounded-lg text-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">Simpan</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}