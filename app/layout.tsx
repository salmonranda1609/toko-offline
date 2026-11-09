import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = { title: 'Toko Offline POS', manifest: '/manifest.json' }
export const viewport: Viewport = { themeColor: '#2563eb', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-gray-50 pb-20">
        {children}
        <Nav />
      </body>
    </html>
  )
}
