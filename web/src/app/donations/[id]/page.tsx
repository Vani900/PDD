'use client'

import React, { useState, useEffect } from 'react'
import { DonationDetailView } from './DonationDetailView'

export const dynamic = 'force-dynamic'

export default function DonationDetailPage({ params }: { params: any }) {
  const [id, setId] = useState<string>('')

  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      if (resolved?.id) setId(resolved.id)
    })
  }, [params])

  if (!id) {
    return <div className="min-h-screen bg-muted/30 pt-24" />
  }

  return <DonationDetailView donationId={id} />
}


