import { openDB, DBSchema } from 'idb'

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
  a.download = `backup-toko-${new Date().toISOString().split('T')[0]}.json`
  a.click()
}
