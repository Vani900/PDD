'use client'

import React, { useState, useEffect } from 'react'
import NGODetailView from './NGODetailView'

export default function NGODetailPage({ params }: { params: any }) {
  const [id, setId] = useState<string>('')

  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      if (resolved?.id) setId(resolved.id)
    })
  }, [params])

  if (!id) {
    return <div className="min-h-screen bg-muted/30 pt-24" />
  }

  return <NGODetailView ngoId={id} />
}


