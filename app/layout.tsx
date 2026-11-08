import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = { title: 'Toko Offline POS', manifest: '/manifest.json' }
export const viewport: Viewport = { themeColor: '#2563eb', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      {/* Gunakan h-screen dan flex-col agar layout mengunci tinggi layar */}
      <body className="h-screen flex flex-col bg-gray-50">
        {/* flex-1 dan overflow-y-auto membuat area ini bisa digulir (scroll) */}
        <main className="flex-1 overflow-y-auto pb-8">
          {children}
        </main>
        <Nav />
      </body>
    </html>
  )
}