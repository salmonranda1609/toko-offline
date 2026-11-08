'use client'
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
