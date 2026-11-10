import dynamic from 'next/dynamic'

const PembelianClient = dynamic(() => import('./PembelianClient'), { ssr: false })

export default function ProdukPage() {
  return <PembelianClient />
}