'use client'
import { useEffect, useState } from 'react'
import { db, exportData, Sale, Product } from '@/lib/db'

export default function LaporanPage() {
  // State untuk Laporan
  const [sales, setSales] = useState<Sale[]>([])
  const [lowStock, setLowStock] = useState<Product[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0] // Default hari ini (YYYY-MM-DD)
  )

  // State Ringkasan
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [trxCount, setTrxCount] = useState(0)
  const [paymentSummary, setPaymentSummary] = useState<Record<string, number>>({})

  useEffect(() => {
    (async () => {
      // 1. Ambil produk stok menipis
      const prods = await db.products.toArray()
      setLowStock(prods.filter(p => p.stock_qty <= 5))

      // 2. Ambil transaksi berdasarkan tanggal yang dipilih
      const allSales = await db.sales.toArray()
      
      // Filter: Cek apakah tanggal transaksi (created_at) sama dengan selectedDate
      const filteredSales = allSales.filter(s => s.created_at.startsWith(selectedDate))
      
      // Urutkan dari yang terbaru
      filteredSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setSales(filteredSales)
      setTrxCount(filteredSales.length)
      
      // 3. Hitung Total Pendapatan & Rekap Metode Pembayaran
      let total = 0
      const summary: Record<string, number> = {}

      filteredSales.forEach(s => {
        total += s.total
        if (!summary[s.method]) summary[s.method] = 0
        summary[s.method] += s.total
      })

      setTotalRevenue(total)
      setPaymentSummary(summary)
    })()
  }, [selectedDate]) // Jalankan ulang jika tanggal diganti

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Laporan</h1>
        
        {/* Input Filter Tanggal */}
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-2 rounded text-sm bg-white"
        />
      </div>

      {/* Ringkasan Penjualan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border p-4 rounded shadow-sm">
          <p className="text-sm text-gray-500">Total Penjualan</p>
          <p className="text-2xl font-bold text-blue-600">Rp {totalRevenue.toLocaleString()}</p>
          <p className="text-xs mt-1 text-gray-600">Dari <strong className="text-gray-900">{trxCount}</strong> transaksi</p>
        </div>
        
        {/* Rekap Metode Pembayaran */}
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

      {/* Tabel Rincian Transaksi */}
      <h2 className="font-semibold text-lg pt-2">Rincian Transaksi</h2>
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
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  {new Date(s.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="p-3 uppercase text-xs font-bold text-blue-600">{s.method}</td>
                <td className="p-3 text-xs text-gray-500">
                  {/* Tampilkan jumlah item yang dibeli */}
                  {s.items.reduce((sum, item) => sum + item.qty, 0)} item
                </td>
                <td className="p-3 text-right font-medium">{s.total.toLocaleString()}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Tidak ada transaksi pada tanggal ini.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Stok Menipis */}
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
            {lowStock.length === 0 && (
              <tr><td colSpan={2} className="p-4 text-center text-green-600 font-medium">Semua stok aman.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tombol Backup */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mt-6">
        <h2 className="font-bold text-yellow-800 mb-2">Amankan Data Anda</h2>
        <p className="text-sm text-yellow-700 mb-3">Aplikasi ini berjalan 100% offline. Lakukan backup rutin agar data tidak hilang jika HP rusak atau cache terhapus.</p>
        <button onClick={exportData} className="bg-yellow-600 text-white px-4 py-2 rounded font-bold w-full">
          Download Backup Data (JSON)
        </button>
      </div>
    </div>
  )
}