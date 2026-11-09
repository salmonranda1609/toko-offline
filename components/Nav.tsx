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
<<<<<<< HEAD
<<<<<<< HEAD
  
=======
>>>>>>> 44a9bed (pesan penjelasan update)
=======
>>>>>>> ffeabc0 (Commit pertama)
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex justify-around items-center h-16 pb-safe">
      {links.map((l) => {
        const isActive = pathname === l.href
        return (
<<<<<<< HEAD
<<<<<<< HEAD
          <Link 
            key={l.href} 
            href={l.href} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
          >
=======
          <Link key={l.href} href={l.href} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
>>>>>>> 44a9bed (pesan penjelasan update)
=======
          <Link key={l.href} href={l.href} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
>>>>>>> ffeabc0 (Commit pertama)
            <span className="text-xl">{l.icon}</span>
            <span className="text-[10px] font-medium">{l.label}</span>
          </Link>
        )
      })}
    </nav>
  )
<<<<<<< HEAD
<<<<<<< HEAD
}
=======
}
>>>>>>> 44a9bed (pesan penjelasan update)
=======
}
>>>>>>> ffeabc0 (Commit pertama)
