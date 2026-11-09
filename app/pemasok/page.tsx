'use client'
import { useEffect, useState } from 'react'
import { db, Supplier } from '@/lib/db'

export default function PemasokPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [form, setForm] = useState({ name: '', contact: '' })

  async function load() { setSuppliers(await db.suppliers.toArray()) }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await db.suppliers.add({ id: crypto.randomUUID(), name: form.name, contact: form.contact })
    setForm({ name: '', contact: '' })
    load()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Pemasok</h1>
      <form onSubmit={handleSave} className="bg-white p-3 rounded border grid grid-cols-1 md:grid-cols-3 gap-2">
        <input className="border p-2 rounded" placeholder="Nama Pemasok" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input className="border p-2 rounded" placeholder="No WA (0812...)" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
<<<<<<< HEAD
        <button className="bg-blue-600 text-white p-2 rounded">Tambah</button>
=======
        <button className="bg-blue-600 text-white p-2 rounded font-semibold">Tambah</button>
>>>>>>> 44a9bed (pesan penjelasan update)
      </form>

      <table className="w-full bg-white border text-sm">
        <thead><tr className="bg-gray-100 text-left"><th className="p-2">Nama</th><th className="p-2">Kontak</th><th className="p-2"></th></tr></thead>
        <tbody>
          {suppliers.map(s => (
            <tr key={s.id} className="border-t">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.contact}</td>
              <td className="p-2 text-right"><button onClick={async () => { if(confirm('Hapus?')) { await db.suppliers.delete(s.id); load() } }} className="text-red-500 text-xs">hapus</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
