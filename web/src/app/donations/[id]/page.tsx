import React from 'react'
import { DonationDetailView } from './DonationDetailView'

export const dynamic = 'force-dynamic'

export default async function DonationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DonationDetailView donationId={id} />
}
