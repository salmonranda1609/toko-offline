import dynamic from 'next/dynamic'

const LaporanClient = dynamic(() => import('./LaporanClient'), { ssr: false })

export default function ProdukPage() {
  return <LaporanClient />
}