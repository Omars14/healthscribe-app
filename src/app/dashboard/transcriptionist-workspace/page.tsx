'use client'

import dynamic from 'next/dynamic'

const TranscriptionistWorkspace = dynamic(
  () => import('../transcriptionist-workspace'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    )
  }
)

export default function TranscriptionistWorkspacePage() {
  return <TranscriptionistWorkspace />
}
