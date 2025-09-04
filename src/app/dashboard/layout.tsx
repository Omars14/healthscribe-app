"use client"

import dynamic from 'next/dynamic'

const ClientDashboardLayout = dynamic(
  () => import('./client-layout'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }
)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientDashboardLayout>{children}</ClientDashboardLayout>
}
