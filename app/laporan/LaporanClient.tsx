
'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef } from 'react'
import { db, exportData, importData, Sale, Product } from '@/lib/db'

export default function LaporanClient() {
  const [sales, setSales] = useState<Sale[]>([])
  const [lowStock, setLowStock] = useState<Product[]>([])
  
  // State Filter Tanggal
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    const offset = today.getTimezoneOffset() * 60000
    return new Date(today.getTime() - offset).toISOString().split('T')[0]
  })

  // State Ringkasan
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [trxCount, setTrxCount] = useState(0)
  const [paymentSummary, setPaymentSummary] = useState<Record<string, { total: number, count: number }>>({})

  // State Modal Detail
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  // Ref untuk Input File Backup
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const summary: Record<string, { total: number, count: number }> = {}
      
      filteredSales.forEach(s => {
        total += s.total
        if (!summary[s.method]) summary[s.method] = { total: 0, count: 0 }
        summary[s.method].total += s.total
        summary[s.method].count += 1
      })

      setTotalRevenue(total)
      setPaymentSummary(summary)

    } catch (error) {
      console.error("Gagal memuat laporan:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  // Fungsi Menangani Upload File Backup
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    const success = await importData(file)
    if (success) {
      fetchData() // Refresh data setelah import berhasil
    }
    
    // Reset input agar bisa upload file yang sama di masa depan
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Helper untuk ikon metode
  const getMethodIcon = (method: string) => {
    switch(method) {
      case 'cash': return '💵'
      case 'qris': return '📱'
      case 'transfer': return '🏦'
      default: return '💳'
    }
  }

  return (
    <div className="p-4 pb-24 space-y-5 relative bg-gray-50 min-h-screen">
      
      {/* HEADER & FILTER TANGGAL */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Laporan</h1>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-2 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* CARD RINGKASAN MODERN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-white">
          <p className="text-sm text-gray-500 font-medium mb-1">Total Penjualan</p>
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-bold text-blue-600">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </h2>
            <span className="text-sm font-semibold text-gray-600 bg-white px-3 py-1 rounded-full border shadow-sm mb-1">
              {trxCount} Transaksi
            </span>
          </div>
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {['qris', 'cash', 'transfer'].map(method => {
            const data = paymentSummary[method]
            if (!data) return null

            return (
              <div key={method} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg">
                    {getMethodIcon(method)}
                  </div>
                  <div>
                    <p className="uppercase font-bold text-gray-700 text-sm">{method}</p>
                    <p className="text-xs text-gray-500">{data.count} kali</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">Rp {data.total.toLocaleString('id-ID')}</p>
                </div>
              </div>
            )
          })}

          {Object.keys(paymentSummary).length === 0 && (
            <div className="col-span-full p-4 text-center text-gray-500 text-sm italic">
              Belum ada transaksi pada tanggal ini.
            </div>
          )}
        </div>
      </div>

      {/* TABEL RINCIAN TRANSAKSI */}
      <div>
        <h2 className="font-bold text-gray-800 text-lg mb-1">Rincian Transaksi</h2>
        <p className="text-xs text-gray-500 mb-3">*Klik baris tabel untuk melihat detail barang</p>
        
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 border-b border-gray-100">
                <th className="p-3 font-semibold">Jam</th>
                <th className="p-3 font-semibold">Metode</th>
                <th className="p-3 font-semibold">Barang</th>
                <th className="p-3 font-semibold text-right">Total (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr 
                  key={s.id} 
                  onClick={() => setSelectedSale(s)}
                  className="border-b border-gray-50 last:border-0 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="p-3 text-gray-600">
                    {new Date(s.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3">
                    <span className="uppercase text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-md">
                      {s.method}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-500">
                    {s.items && s.items.length > 0 
                      ? `${s.items.reduce((sum, item) => sum + item.qty, 0)} item`
                      : '-'}
                  </td>
                  <td className="p-3 text-right font-medium text-gray-800">{s.total.toLocaleString()}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">Tidak ada transaksi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOK MENIPIS */}
      <div>
        <h2 className="font-bold text-gray-800 text-lg mb-3">Produk Stok Menipis</h2>
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 border-b border-gray-100">
                <th className="p-3 font-semibold">Produk</th>
                <th className="p-3 font-semibold text-right">Sisa Stok</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-red-50">
                  <td className="p-3 font-medium text-red-600">{p.name}</td>
                  <td className="p-3 text-right">
                    <span className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded-md text-xs">{p.stock_qty}</span>
                  </td>
                </tr>
              ))}
              {lowStock.length === 0 && (
                <tr><td colSpan={2} className="p-6 text-center text-green-600 font-medium">Semua stok aman.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AREA BACKUP & RESTORE (TANPA HAPUS TRANSAKSI) */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm mt-6">
        <h2 className="font-bold text-blue-800 mb-1">Backup & Restore Data</h2>
        <p className="text-xs text-blue-700 mb-3">
          Unduh file backup (JSON) untuk menyimpan data ke HP/Cloud, atau unggah file backup untuk memulihkan data.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Tombol Download Backup */}
          <button 
            onClick={exportData} 
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm"
          >
            📥 Download Backup
          </button>
          
          {/* Tombol Upload/Restore Data */}
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex items-center justify-center gap-2 bg-white border-2 border-blue-600 text-blue-600 px-4 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors text-sm"
          >
            📤 Import / Restore
          </button>
          
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
        </div>
      </div>

      {/* MODAL DETAIL TRANSAKSI */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-4 shadow-xl">
            <div className="border-b pb-3 border-gray-100">
              <h2 className="font-bold text-lg text-gray-900">Detail Transaksi</h2>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(selectedSale.created_at).toLocaleString('id-ID')} • <span className="uppercase font-bold text-blue-600">{selectedSale.method}</span>
              </p>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {selectedSale.items && selectedSale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 border-gray-50">
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.qty} x Rp {item.price.toLocaleString()}</p>
                  </div>
                  <p className="font-medium">Rp {(item.qty * item.price).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t mt-2 border-gray-100">
              <span className="font-bold text-gray-600">Total</span>
              <span className="font-bold text-lg text-blue-600">Rp {selectedSale.total.toLocaleString()}</span>
            </div>

            <button 
              onClick={() => setSelectedSale(null)} 
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}