"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Home,
  FileAudio,
  Upload,
  Settings,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Mic,
  Clock,
  FileText,
  Shield,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    title: 'Workspace',
    href: '/dashboard/transcriptionist-workspace',
    icon: Mic
  },
  {
    title: 'Transcriptions',
    href: '/dashboard/transcriptions',
    icon: FileAudio
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings
  }
]

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [forceRender, setForceRender] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, userProfile, loading, signOut } = useAuth()

  useEffect(() => {
    setMounted(true)
    
    // Emergency timeout - if loading takes too long, force render
    const timeout = setTimeout(() => {
      console.log('🚨 Dashboard Layout: Auth loading timeout - forcing render')
      setForceRender(true)
    }, 3000) // 3 second timeout

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    console.log('🔧 Dashboard Layout: Auth state:', { loading, user: !!user, userProfile: !!userProfile })

    if (!loading && !user && !forceRender) {
      console.log('🔧 Dashboard Layout: No user found, redirecting to login')
      router.push('/login')
    }
  }, [user, loading, forceRender]) // Remove router from dependencies

  // Enhanced loading condition with debug info and timeout
  if ((!mounted || loading) && !forceRender) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-gray-500">
              <p>Mounted: {mounted ? 'Yes' : 'No'}</p>
              <p>Auth Loading: {loading ? 'Yes' : 'No'}</p>
              <p>User: {user ? user.email : 'None'}</p>
              <p>Force Render: {forceRender ? 'Yes' : 'No'}</p>
            </div>
          )}
          <button
            onClick={() => setForceRender(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Force Load Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-card border-r",
        sidebarOpen ? "w-64" : "w-16",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Mic className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Healthscribe Pro</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform",
              !sidebarOpen && "rotate-180"
            )} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent",
                  isActive && "bg-accent text-accent-foreground",
                  !sidebarOpen && "justify-center"
                )}
              >
                <Icon className="h-5 w-5" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.title}</span>
                )}
              </Link>
            )
          })}
          
          {/* Admin Link - Only show for admin users */}
          {userProfile?.role === 'admin' && (
            <>
              <div className="my-2 border-t" />
              <Link
                href="/dashboard/admin/users"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent",
                  pathname === '/dashboard/admin/users' && "bg-accent text-accent-foreground",
                  !sidebarOpen && "justify-center"
                )}
              >
                <div className="relative">
                  <Users className="h-5 w-5" />
                  <Shield className="h-3 w-3 absolute -bottom-1 -right-1 text-primary" />
                </div>
                {sidebarOpen && (
                  <span className="text-sm font-medium">User Management</span>
                )}
              </Link>
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="border-t p-4">
          <div className={cn(
            "flex items-center gap-3",
            !sidebarOpen && "justify-center"
          )}>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.email?.substring(0, 2).toUpperCase() || 'U'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-xs text-muted-foreground">
                  {userProfile?.role === 'admin' ? '👑 Admin' : 
                   userProfile?.role === 'editor' ? '✏️ Editor' : 
                   userProfile?.role === 'transcriptionist' ? '🎤 Transcriptionist' : 
                   user?.email || 'No email'}
                </p>
              </div>
            )}
            {sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300",
        sidebarOpen ? "lg:ml-64" : "lg:ml-16",
        "pt-16 lg:pt-0"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Medical Dictation Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">45s avg</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">12 today</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Quick Upload
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
