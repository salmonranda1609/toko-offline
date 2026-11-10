import dynamic from 'next/dynamic'

const KasirClient = dynamic(() => import('./KasirClient'), { ssr: false })

export default function ProdukPage() {
  return <KasirClient />
}