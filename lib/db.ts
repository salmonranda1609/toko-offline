import Dexie, { type EntityTable } from 'dexie'
import 'dexie-export-import'

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

// Inisialisasi Database Dexie
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

// --- FUNGSI BACKUP (EXPORT) ---
export async function exportData() {
  // Pastikan fungsi hanya berjalan di browser (Client Side)
  if (typeof window === 'undefined') return
  
  try {
    // Menggunakan fitur export dari dexie-export-import
    const blob = await db.export()
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-toko-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Gagal backup:", error)
    alert("Gagal melakukan backup data.")
  }
}

// --- FUNGSI RESTORE (IMPORT) ---
export async function importData(file: File) {
  // Pastikan fungsi hanya berjalan di browser (Client Side)
  if (typeof window === 'undefined') return false
  
  try {
    // Konfirmasi sebelum menimpa data
    if (!confirm('PERINGATAN: Data saat ini akan DIGANTI dengan data dari file backup. Lanjutkan?')) {
      return false
    }

    // Menggunakan fitur import dari dexie-export-import
    // clearTablesBeforeImport: true akan menghapus data lama sebelum memasukkan data baru
    await db.import(file, { clearTablesBeforeImport: true })
    
    alert('Data berhasil dipulihkan!')
    return true
  } catch (error) {
    console.error("Gagal restore:", error)
    alert("Gagal memulihkan data. Pastikan file yang dipilih valid.")
    return false
  }
}