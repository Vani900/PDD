import NGODetailView from './NGODetailView'

export const dynamic = 'force-dynamic'

export default async function NGODetailPage({ params }: { params: any }) {
  const resolvedParams = params && typeof params.then === 'function' ? await params : params
  const ngoId = resolvedParams?.id || ''
  return <NGODetailView ngoId={ngoId} />
}

