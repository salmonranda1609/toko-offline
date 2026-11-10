import dynamic from 'next/dynamic'

const PemasokClient = dynamic(() => import('./PemasokClient'), { ssr: false })

export default function ProdukPage() {
  return <PemasokClient />
}