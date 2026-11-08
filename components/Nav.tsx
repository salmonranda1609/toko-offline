'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/kasir', label: 'Kasir', icon: '🛒' },
  { href: '/produk', label: 'Produk', icon: '📦' },
  { href: '/pemasok', label: 'Pemasok', icon: '🏭' },
  { href: '/pembelian', label: 'Pembelian', icon: '📥' },
  { href: '/laporan', label: 'Laporan', icon: '📊' },
]

export function Nav() {
  const pathname = usePathname()
  
  return (
    // Hapus 'fixed', ganti dengan 'shrink-0' agar navbar tidak mengecil
    <nav className="shrink-0 bg-white border-t flex justify-around items-center h-16 w-full z-40">
      {links.map((l) => {
        const isActive = pathname === l.href
        return (
          <Link 
            key={l.href} 
            href={l.href} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <span className="text-xl">{l.icon}</span>
            <span className="text-[10px] font-medium">{l.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}