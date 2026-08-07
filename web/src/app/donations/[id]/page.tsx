import React from 'react'
import { DonationDetailView } from './DonationDetailView'

export const dynamic = 'force-dynamic'

export default async function DonationDetailPage({ params }: { params: any }) {
  const resolvedParams = params && typeof params.then === 'function' ? await params : params
  const donationId = resolvedParams?.id || ''
  return <DonationDetailView donationId={donationId} />
}

