#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const files = {}

files['package.json'] = JSON.stringify({
  name: 'toko-offline',
  version: '0.1.0',
  private: true,
  scripts: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
  },
  dependencies: {
    idb: '^8.0.0',
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

files['next-env.d.ts'] = `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`

files['next.config.js'] = `/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Aktif di production
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

files['postcss.config.js'] = `module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
`

files['.gitignore'] = `node_modules\n.next\nout\npublic/sw.js\npublic/sw.js.map\npublic/workbox-*.js\npublic/workbox-*.js.map\n.DS_Store\n`

files['public/manifest.json'] = JSON.stringify({
  name: 'Toko Offline POS',
  short_name: 'TokoOffline',
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
// DATABASE LOKAL (INDEXED DB)
// ==========================================
files['lib/db.ts'] = `import { openDB, DBSchema } from 'idb'

export type Product = { id: string; name: string; price: number; cost: number; stock_qty: number }
export type Supplier = { id: string; name: string; contact: string; address: string }
export type Sale = { id: string; total: number; method: string; created_at: string; items: any[] }
export type Purchase = { id: string; supplier_id: string; total: number; status: string; created_at: string; items: any[] }

interface TokoDB extends DBSchema {
  products: { key: string; value: Product }
  suppliers: { key: string; value: Supplier }
  sales: { key: string; value: Sale }
  purchases: { key: string; value: Purchase }
}

export const getDB = () => {
  if (typeof window === 'undefined') return null
  return openDB<TokoDB>('toko-offline', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('suppliers')) db.createObjectStore('suppliers', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('sales')) db.createObjectStore('sales', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('purchases')) db.createObjectStore('purchases', { keyPath: 'id' })
    },
  })
}

// --- FUNGSI PRODUK ---
export async function getProducts() {
  const db = await getDB(); if (!db) return []
  return db.getAll('products')
}
export async function saveProduct(p: Product) {
  const db = await getDB(); if (!db) return
  await db.put('products', p)
}
export async function deleteProduct(id: string) {
  const db = await getDB(); if (!db) return
  await db.delete('products', id)
}

// --- FUNGSI SUPPLIER ---
export async function getSuppliers() {
  const db = await getDB(); if (!db) return []
  return db.getAll('suppliers')
}
export async function saveSupplier(s: Supplier) {
  const db = await getDB(); if (!db) return
  await db.put('suppliers', s)
}
export async function deleteSupplier(id: string) {
  const db = await getDB(); if (!db) return
  await db.delete('suppliers', id)
}

// --- FUNGSI PENJUALAN (KASIR) ---
export async function saveSale(sale: Sale, newStock: Record<string, number>) {
  const db = await getDB(); if (!db) return
  const tx = db.transaction(['sales', 'products'], 'readwrite')
  await tx.objectStore('sales').put(sale)
  for (const [prodId, qty] of Object.entries(newStock)) {
    const prod = await tx.objectStore('products').get(prodId)
    if (prod) {
      prod.stock_qty -= qty
      await tx.objectStore('products').put(prod)
    }
  }
  await tx.done
}

// --- FUNGSI PEMBELIAN ---
export async function getPurchases() {
  const db = await getDB(); if (!db) return []
  return db.getAll('purchases')
}
export async function savePurchase(p: Purchase) {
  const db = await getDB(); if (!db) return
  await db.put('purchases', p)
}
export async function receivePurchase(purchase: Purchase, costData: Record<string, number>) {
  const db = await getDB(); if (!db) return
  const tx = db.transaction(['purchases', 'products'], 'readwrite')
  purchase.status = 'received'
  purchase.total = Object.values(costData).reduce((a, b) => a + b, 0) // total modal
  await tx.objectStore('purchases').put(purchase)
  
  for (const item of purchase.items) {
    const prod = await tx.objectStore('products').get(item.product_id)
    if (prod) {
      prod.stock_qty += item.qty
      prod.cost = costData[item.product_id] / item.qty
      await tx.objectStore('products').put(prod)
    }
  }
  await tx.done
}

// --- EXPORT / IMPORT DATA (BACKUP) ---
export async function exportData() {
  const db = await getDB(); if (!db) return
  const data = {
    products: await db.getAll('products'),
    suppliers: await db.getAll('suppliers'),
    sales: await db.getAll('sales'),
    purchases: await db.getAll('purchases')
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
files['app/globals.css'] = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nhtml, body { height: 100%; }\nbody { @apply bg-gray-50 text-gray-900; }`

files['app/layout.tsx'] = `import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Toko Offline POS',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="pb-16">
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t flex justify-around items-center h-16">
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
import { getProducts, saveSale, Product } from '@/lib/db'

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<{ product: Product, qty: number }[]>([])
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    setProducts(await getProducts())
  }
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
    const stockMap: Record<string, number> = {}
    cart.forEach(c => stockMap[c.product.id] = c.qty)

    const saleData = {
      id: crypto.randomUUID(),
      total,
      method,
      created_at: new Date().toISOString(),
      items: cart.map(c => ({ product_id: c.product.id, name: c.product.name, qty: c.qty, price: c.product.price }))
    }

    await saveSale(saleData, stockMap)
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
`

// ==========================================
// HALAMAN PEMASOK
// ==========================================
files['app/pemasok/page.tsx'] = `'use client'
import { useEffect, useState } from 'react'
import { getSuppliers, saveSupplier, deleteSupplier, Supplier } from '@/lib/db'

export default function PemasokPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [form, setForm] = useState({ name: '', contact: '' })

  async function load() { setSuppliers(await getSuppliers()) }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await saveSupplier({ id: crypto.randomUUID(), name: form.name, contact: form.contact, address: '' })
    setForm({ name: '', contact: '' })
    load()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Pemasok</h1>
      <form onSubmit={handleSave} className="bg-white p-3 rounded border grid grid-cols-1 md:grid-cols-3 gap-2">
        <input className="border p-2 rounded" placeholder="Nama Pemasok" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input className="border p-2 rounded" placeholder="No WhatsApp (ex: 0812...)" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
        <button className="bg-blue-600 text-white p-2 rounded">Tambah</button>
      </form>

      <table className="w-full bg-white border text-sm">
        <thead><tr className="bg-gray-100 text-left"><th className="p-2">Nama</th><th className="p-2">Kontak</th><th className="p-2"></th></tr></thead>
        <tbody>
          {suppliers.map(s => (
            <tr key={s.id} className="border-t">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.contact}</td>
              <td className="p-2 text-right"><button onClick={() => { if(confirm('Hapus?')) { deleteSupplier(s.id); load() } }} className="text-red-500 text-xs">hapus</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
`

// ==========================================
// HALAMAN PEMBELIAN (WA BUTUH INTERNET)
// ==========================================
files['app/pembelian/page.tsx'] = `'use client'
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
      const wa = sup.contact.replace(/\\D/g, '').replace(/^0/, '62')
      let text = \`Halo *\${sup.name}*, saya mau pesan:\\n\`
      draft.forEach((d, i) => { text += \`\${i+1}. \${d.product.name} - \${d.qty} pcs\\n\` })
      window.open(\`https://wa.me/\${wa}?text=\${encodeURIComponent(text)}\`, '_blank')
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
`

// ==========================================
// HALAMAN LAPORAN & BACKUP
// ==========================================
files['app/laporan/page.tsx'] = `'use client'
import { useEffect, useState } from 'react'
import { getDB, getProducts, exportData, Product } from '@/lib/db'

export default function LaporanPage() {
  const [totalToday, setTotalToday] = useState(0)
  const [trxCount, setTrxCount] = useState(0)
  const [lowStock, setLowStock] = useState<Product[]>([])

  useEffect(() => {
    (async () => {
      const db = await getDB()
      if (!db) return
      
      const today = new Date().toISOString().split('T')[0]
      const allSales = await db.getAll('sales')
      const todaySales = allSales.filter(s => s.created_at.startsWith(today))
      
      setTotalToday(todaySales.reduce((a, b) => a + b.total, 0))
      setTrxCount(todaySales.length)

      const prods = await getProducts()
      setLowStock(prods.filter(p => p.stock_qty <= 5))
    })()
  }, [])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Laporan</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border p-4 rounded shadow-sm">
          <p className="text-sm text-gray-500">Penjualan Hari Ini</p>
          <p className="text-2xl font-bold text-blue-600">Rp {totalToday.toLocaleString()}</p>
          <p className="text-xs mt-1">{trxCount} Transaksi</p>
        </div>
        <div className="bg-white border p-4 rounded shadow-sm">
          <p className="text-sm text-gray-500">Stok Menipis</p>
          <p className="text-2xl font-bold text-red-500">{lowStock.length}</p>
          <p className="text-xs mt-1">Produk perlu dipesan</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mt-6">
        <h2 className="font-bold text-yellow-800 mb-2">Amankan Data Anda</h2>
        <p className="text-sm text-yellow-700 mb-3">Aplikasi ini berjalan 100% offline di HP ini. Lakukan backup rutin agar data tidak hilang jika HP rusak atau cache terhapus.</p>
        <button onClick={exportData} className="bg-yellow-600 text-white px-4 py-2 rounded font-bold w-full">
          Download Backup Data (JSON)
        </button>
      </div>
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
  console.log(`\n✅ ${count} file dibuat (Versi 100% Offline).\n`)
  console.log('Langkah menjalankan:')
  console.log('  1. npm install')
  console.log('  2. npm run dev')
  console.log('  3. Buka http://localhost:3000/kasir\n')
}

main().catch((e) => { console.error('Gagal generate:', e); process.exit(1) })