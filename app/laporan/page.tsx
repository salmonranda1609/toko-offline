'use client'
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
                <td className="p-3 text-xs text-gray-500">{s.items && s.items.length > 0 ? `${s.items.reduce((sum, item) => sum + item.qty, 0)} item` : '-'}</td>
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
