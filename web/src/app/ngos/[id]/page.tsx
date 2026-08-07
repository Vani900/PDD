import NGODetailView from './NGODetailView'

export const dynamic = 'force-dynamic'

export default async function NGODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <NGODetailView ngoId={id} />
}
