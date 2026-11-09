import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = { title: 'Toko Offline POS', manifest: '/manifest.json' }
export const viewport: Viewport = { themeColor: '#2563eb', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
<<<<<<< HEAD
      {/* Tambahkan pb-20 agar seluruh halaman punya ruang kosong di bawah */}
=======
>>>>>>> 44a9bed (pesan penjelasan update)
      <body className="bg-gray-50 pb-20">
        {children}
        <Nav />
      </body>
    </html>
  )
<<<<<<< HEAD
}
=======
}
>>>>>>> 44a9bed (pesan penjelasan update)
