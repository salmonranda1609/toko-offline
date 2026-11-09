import Dexie, { type EntityTable } from 'dexie'

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

<<<<<<< HEAD
<<<<<<< HEAD
// Inisialisasi Database Dexie
=======
>>>>>>> 44a9bed (pesan penjelasan update)
=======
>>>>>>> ffeabc0 (Commit pertama)
const db = new Dexie('TokoKelontongDB') as Dexie & {
  products: EntityTable<Product, 'id'>
  suppliers: EntityTable<Supplier, 'id'>
  sales: EntityTable<Sale, 'id'>
  purchases: EntityTable<Purchase, 'id'>
}

db.version(1).stores({
<<<<<<< HEAD
<<<<<<< HEAD
  products: 'id, name', // id adalah primary key
=======
  products: 'id, name',
>>>>>>> 44a9bed (pesan penjelasan update)
=======
  products: 'id, name',
>>>>>>> ffeabc0 (Commit pertama)
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
  a.download = `backup-toko-${new Date().toISOString().split('T')[0]}.json`
  a.click()
}
