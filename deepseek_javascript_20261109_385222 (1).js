#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const files = {}

files['package.json'] = JSON.stringify({
  name: 'toko-offline-final',
  version: '0.1.0',
  private: true,
  scripts: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
  },
  dependencies: {
    dexie: '^4.0.8',
    next: '^14.2.15',
    'next-pwa': '^5.6.0',
    react: '^18.3.1',
    'react-dom': '^18.3.1',
  },
  devDependencies: {
    '@types/node': '^20',
    '@types/react': '^18',
    '@types/react-dom': '^18',
    autoprefixer: '^10.4.20',
    postcss: '^8.4.47',
    tailwindcss: '^3.4.13',
    typescript: '^5',
  },
}, null, 2)

files['tsconfig.json'] = JSON.stringify({
  compilerOptions: {
    target: 'ES2017',
    lib: ['dom', 'dom.iterable', 'esnext'],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: 'esnext',
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: 'preserve',
    incremental: true,
    plugins: [{ name: 'next' }],
    paths: { '@/*': ['./*'] },
  },
  include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
  exclude: ['node_modules'],
}, null, 2)

files['next-env.d.ts'] = `/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n`

files['next.config.js'] = `/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})
module.exports = withPWA({ reactStrictMode: true })
`

files['tailwind.config.js'] = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
`

files['postcss.config.js'] = `module.exports = {\n  plugins: { tailwindcss: {}, autoprefixer: {} },\n}\n`

files['.gitignore'] = `node_modules\n.next\nout\npublic/sw.js\npublic/sw.js.map\npublic/workbox-*.js\npublic/workbox-*.js.map\n.DS_Store\n`

files['public/manifest.json'] = JSON.stringify({
  name: 'Toko Offline POS',
  short_name: 'TokoKu',
  start_url: '/kasir',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#2563eb',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2)
files['public/icons/.gitkeep'] = ''

// ==========================================
// DATABASE LOKAL (DEXIE)
// ==========================================
files['lib/db.ts'] = `import Dexie, { type EntityTable } from 'dexie'

export interface Product {
  id: string
  name: string
  price: number
  cost: number
  stock_qty: number
}

export interface Supplier {
  id: string
  name: string
  contact: string
}

export interface Sale {
  id: string
  total: number
  method: string
  created_at: string
  items: any[] 
}

export interface Purchase {
  id: string
  supplier_id: string
  total: number
  status: 'sent' | 'received'
  created_at: string
  items: any[]
}

const db = new Dexie('TokoKelontongDB') as Dexie & {
  products: EntityTable<Product, 'id'>
  suppliers: EntityTable<Supplier, 'id'>
  sales: EntityTable<Sale, 'id'>
  purchases: EntityTable<Purchase, 'id'>
}

db.version(1).stores({
  products: 'id, name',
  suppliers: 'id, name',
  sales: 'id, created_at',
  purchases: 'id, created_at, status'
})

export { db }

// --- FUNGSI BACKUP ---
export async function exportData() {
  if (typeof window === 'undefined') return
  const data = {
    products: await db.products.toArray(),
    suppliers: await db.suppliers.toArray(),
    sales: await db.sales.toArray(),
    purchases: await db.purchases.toArray()
  }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = \`backup-toko-\${new Date().toISOString().split('T')[0]}.json\`
  a.click()
}
`

// ==========================================
// KOMPONEN & LAYOUT
// ==========================================
files['app/globals.css'] = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nhtml, body { height: 100%; }\nbody { @apply bg-gray-50 text-gray-900; }\n\n@supports (padding-bottom: env(safe-area-inset-bottom)) {\n  .pb-safe {\n    padding-bottom: env(safe-area-inset-bottom);\n  }\n}`

files['app/layout.tsx'] = `import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = { title: 'Toko Offline POS', manifest: '/manifest.json' }
export const viewport: Viewport = { themeColor: '#2563eb', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-gray-50 pb-20">
        {children}
        <Nav />
      </body>
    </html>
  )
}
`

files['app/page.tsx'] = `import { redirect } from 'next/navigation'\nexport default function Home() { redirect('/kasir') }`

files['components/Nav.tsx'] = `'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/kasir', label: 'Kasir', icon: '🛒' },
  { href: '/produk', label: 'Produk', icon: '📦' },
  { href: '/pemasok', label: 'Pemasok', icon: '🏭' },
  { href: '/pembelian', label: 'Pembelian', icon: '📥' },
  { href: '/laporan', label: 'Laporan', icon: '📊' },
]

export function Nav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex justify-around items-center h-16 pb-safe">
      {links.map((l) => {
        const isActive = pathname === l.href
        return (
          <Link key={l.href} href={l.href} className={\`flex flex-col items-center justify-center w-full h-full space-y-1 \${isActive ? 'text-blue-600' : 'text-gray-500'}\`}>
            <span className="text-xl">{l.icon}</span>
            <span className="text-[10px] font-medium">{l.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
`

// ==========================================
// HALAMAN KASIR
// ==========================================
files['app/kasir/page.tsx'] = `'use client'
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
    
    await db.transaction('rw', db.products, db.sales, async () => {
      await db.sales.add({
        id: crypto.randomUUID(),
        total,
        method,
        created_at: new Date().toISOString(),
        items: cart.map(c => ({ product_id: c.product.id, name: c.product.name, qty: c.qty, price: c.product.price }))
      })
      
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
`

// ==========================================
// HALAMAN PRODUK
// ==========================================
files['app/produk/page.tsx'] = `'use client'
import { useEffect, useState } from 'react'
import { db, Product } from '@/lib/db'

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', cost: '', stock_qty: '' })

  async function load() { setProducts(await db.products.toArray()) }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await db.products.add({
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

  async function deleteItem(id: string) {
    if (!confirm('Hapus produk ini?')) return
    await db.products.delete(id)
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
          <button className="bg-green-600 text-white p-2 rounded font-semibold">Simpan</button>
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
`

// ==========================================
// HALAMAN PEMASOK
// ==========================================
files['app/pemasok/page.tsx'] = `'use client'
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
        <button className="bg-blue-600 text-white p-2 rounded font-semibold">Tambah</button>
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
`

// ==========================================
// HALAMAN PEMBELIAN (GROUPING & MODAL)
// ==========================================
files['app/pembelian/page.tsx'] = `'use client'
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

  const [receiveData, setReceiveData] = useState<Purchase | null>(null)
  const [costInputs, setCostInputs] = useState<Record<string, string>>({})
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
    setProductPick(''); setQty('1')
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
      const wa = sup.contact.replace(/\\D/g, '').replace(/^0/, '62')
      let text = \`Halo *\${sup.name}*, saya mau pesan:\\n\`
      draft.forEach((d, i) => { text += \`\${i+1}. \${d.product.name} - \${d.qty} pcs\\n\` })
      window.open(\`https://wa.me/\${wa}?text=\${encodeURIComponent(text)}\`, '_blank')
    }

    setDraft([]); setSupplierId(''); setMsg('Pesanan dibuat & WhatsApp dibuka!')
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
        return alert(\`Harap isi harga untuk \${item.name} dengan benar.\`)
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

  const groupedPurchases = suppliers.map(sup => {
    return {
      supplier: sup,
      history: purchases.filter(p => p.supplier_id === sup.id)
    }
  }).filter(group => group.history.length > 0)

  return (
    <div className="p-4 pb-24 space-y-4 relative">
      <h1 className="text-xl font-bold">Pembelian</h1>
      
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

      <div className="space-y-6 pt-2">
        <h2 className="font-semibold text-lg">Riwayat Pembelian (Per Pemasok)</h2>
        <p className="text-xs text-gray-500 -mt-3 mb-2">*Klik baris tabel untuk melihat rincian barang</p>
        
        {groupedPurchases.length === 0 && <p className="text-sm text-gray-500">Belum ada riwayat pembelian.</p>}

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
                    <tr key={p.id} onClick={() => setDetailPurchase(p)} className="border-b last:border-0 hover:bg-blue-50 cursor-pointer transition-colors">
                      <td className="p-3 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="p-3 text-right">{p.total > 0 ? \`Rp \${p.total.toLocaleString()}\` : '-'}</td>
                      <td className="p-3 text-center">
                        <span className={\`px-2 py-1 rounded text-xs font-semibold \${p.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}\`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {p.status === 'sent' && (
                          <button onClick={(e) => openReceiveModal(p, e)} className="text-green-600 font-bold text-xs hover:underline px-2 py-1 bg-green-50 rounded">
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
                    <input type="number" className="border border-gray-300 p-2.5 rounded-lg flex-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Harga per pcs" value={costInputs[item.product_id] || ''} onChange={(e) => setCostInputs({ ...costInputs, [item.product_id]: e.target.value })} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t mt-4">
              <button onClick={() => setReceiveData(null)} className="px-4 py-2.5 text-gray-600 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50">Batal</button>
              <button onClick={handleSaveReceive} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Simpan & Tambah Stok</button>
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
                {new Date(detailPurchase.created_at).toLocaleString('id-ID')} • <span className={\`ml-1 uppercase font-bold \${detailPurchase.status === 'received' ? 'text-green-600' : 'text-yellow-600'}\`}>{detailPurchase.status}</span>
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
              <span className="font-bold text-lg text-blue-600">{detailPurchase.total > 0 ? \`Rp \${detailPurchase.total.toLocaleString()}\` : '-'}</span>
            </div>
            <button onClick={() => setDetailPurchase(null)} className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200">Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}
`

// ==========================================
// HALAMAN LAPORAN & BACKUP
// ==========================================
files['app/laporan/page.tsx'] = `'use client'
import { useEffect, useState } from 'react'
import { db, exportData, Sale, Product } from '@/lib/db'

export default function LaporanPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [lowStock, setLowStock] = useState<Product[]>([])
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    const offset = today.getTimezoneOffset() * 60000
    return new Date(today.getTime() - offset).toISOString().split('T')[0]
  })

  const [totalRevenue, setTotalRevenue] = useState(0)
  const [trxCount, setTrxCount] = useState(0)
  const [paymentSummary, setPaymentSummary] = useState<Record<string, number>>({})

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  async function fetchData() {
    try {
      const prods = await db.products.toArray()
      setLowStock(prods.filter(p => p.stock_qty <= 5))

      const allSales = await db.sales.toArray()
      
      const filteredSales = allSales.filter(s => {
        const dateObj = new Date(s.created_at)
        const offset = dateObj.getTimezoneOffset() * 60000
        const localISOTime = new Date(dateObj.getTime() - offset).toISOString().split('T')[0]
        return localISOTime === selectedDate
      })
      
      filteredSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setSales(filteredSales)
      setTrxCount(filteredSales.length)
      
      let total = 0
      const summary: Record<string, number> = {}
      filteredSales.forEach(s => {
        total += s.total
        if (!summary[s.method]) summary[s.method] = 0
        summary[s.method] += s.total
      })

      setTotalRevenue(total)
      setPaymentSummary(summary)
    } catch (error) {
      console.error("Gagal memuat laporan:", error)
    }
  }

  useEffect(() => { fetchData() }, [selectedDate])

  async function handleClearTransactions() {
    if (!confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA riwayat penjualan dan pembelian? Tindakan ini tidak bisa dibatalkan.')) return
    await db.sales.clear()
    await db.purchases.clear()
    alert('Semua riwayat transaksi berhasil dihapus.')
    fetchData()
  }

  return (
    <div className="p-4 pb-24 space-y-4 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Laporan</h1>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border p-2 rounded text-sm bg-white" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border p-4 rounded shadow-sm">
          <p className="text-sm text-gray-500">Total Penjualan</p>
          <p className="text-2xl font-bold text-blue-600">Rp {totalRevenue.toLocaleString()}</p>
          <p className="text-xs mt-1 text-gray-600">Dari <strong className="text-gray-900">{trxCount}</strong> transaksi</p>
        </div>
        <div className="bg-white border p-4 rounded shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Rincian Metode Pembayaran</p>
          <div className="space-y-1">
            {Object.keys(paymentSummary).length === 0 ? (
              <p className="text-sm text-gray-400">Tidak ada transaksi.</p>
            ) : (
              Object.entries(paymentSummary).map(([method, amount]) => (
                <div key={method} className="flex justify-between text-sm">
                  <span className="uppercase font-semibold text-gray-700">{method}</span>
                  <span>Rp {amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <h2 className="font-semibold text-lg pt-2">Rincian Transaksi</h2>
      <p className="text-xs text-gray-500 -mt-3 mb-2">*Klik baris tabel untuk melihat detail barang</p>
      
      <div className="bg-white border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-700">
              <th className="p-3">Jam</th>
              <th className="p-3">Metode</th>
              <th className="p-3">Barang</th>
              <th className="p-3 text-right">Total (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} onClick={() => setSelectedSale(s)} className="border-t hover:bg-blue-50 cursor-pointer transition-colors">
                <td className="p-3">{new Date(s.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="p-3 uppercase text-xs font-bold text-blue-600">{s.method}</td>
                <td className="p-3 text-xs text-gray-500">{s.items && s.items.length > 0 ? \`\${s.items.reduce((sum, item) => sum + item.qty, 0)} item\` : '-'}</td>
                <td className="p-3 text-right font-medium">{s.total.toLocaleString()}</td>
              </tr>
            ))}
            {sales.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">Tidak ada transaksi pada tanggal ini.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="font-semibold text-lg pt-2">Produk Stok Menipis</h2>
      <div className="bg-white border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-700">
              <th className="p-3">Produk</th>
              <th className="p-3 text-right">Sisa Stok</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((p) => (
              <tr key={p.id} className="border-t hover:bg-red-50">
                <td className="p-3 font-medium text-red-600">{p.name}</td>
                <td className="p-3 text-right font-bold text-red-600">{p.stock_qty}</td>
              </tr>
            ))}
            {lowStock.length === 0 && <tr><td colSpan={2} className="p-4 text-center text-green-600 font-medium">Semua stok aman.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mt-6">
        <h2 className="font-bold text-yellow-800 mb-2">Amankan Data Anda</h2>
        <p className="text-sm text-yellow-700 mb-3">Lakukan backup rutin agar data tidak hilang jika HP rusak atau cache terhapus.</p>
        <button onClick={exportData} className="bg-yellow-600 text-white px-4 py-2 rounded font-bold w-full hover:bg-yellow-700">Download Backup Data (JSON)</button>
      </div>

      <div className="bg-red-50 border border-red-200 p-4 rounded mt-4">
        <h2 className="font-bold text-red-800 mb-2">Zona Berbahaya</h2>
        <p className="text-sm text-red-700 mb-3">Menghapus semua riwayat penjualan dan pembelian. Data produk dan pemasok tidak akan terhapus.</p>
        <button onClick={handleClearTransactions} className="bg-red-600 text-white px-4 py-2 rounded font-bold w-full hover:bg-red-700">Hapus Semua Transaksi</button>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-4 shadow-xl">
            <div className="border-b pb-3">
              <h2 className="font-bold text-lg text-gray-900">Detail Transaksi</h2>
              <p className="text-xs text-gray-500 mt-1">{new Date(selectedSale.created_at).toLocaleString('id-ID')} • <span className="uppercase font-bold text-blue-600">{selectedSale.method}</span></p>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {selectedSale.items && selectedSale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.qty} x Rp {item.price.toLocaleString()}</p>
                  </div>
                  <p className="font-medium">Rp {(item.qty * item.price).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 border-t mt-2">
              <span className="font-bold text-gray-600">Total</span>
              <span className="font-bold text-lg text-blue-600">Rp {selectedSale.total.toLocaleString()}</span>
            </div>
            <button onClick={() => setSelectedSale(null)} className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200">Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}
`

// ==========================================
// WRITER
// ==========================================
async function main() {
  let count = 0
  for (const [path, content] of Object.entries(files)) {
    const fullPath = join(process.cwd(), path)
    await mkdir(dirname(fullPath), { recursive: true })
    await writeFile(fullPath, content, 'utf8')
    console.log('  ✓', path)
    count++
  }
  console.log(`\n✅ ${count} file dibuat (Versi Final Offline).\n`)
  console.log('Langkah menjalankan:')
  console.log('  1. npm install')
  console.log('  2. npm run dev')
  console.log('  3. Buka http://localhost:3000/kasir\n')
}

main().catch((e) => { console.error('Gagal generate:', e); process.exit(1) })