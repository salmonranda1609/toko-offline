import dynamic from 'next/dynamic'

const ProdukClient = dynamic(() => import('./ProdukClient'), { ssr: false })

export default function ProdukPage() {
  return <ProdukClient />
}