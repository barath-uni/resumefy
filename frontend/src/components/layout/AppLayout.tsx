import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ripple } from '../ui/ripple'
import { RetroGrid } from '../ui/retro-grid'
import { AnimatedShinyText } from '../ui/animated-shiny-text'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Crown, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getUserTier } from '../../lib/paywall'
import { AppSidebar } from '../app-sidebar'
import { SidebarInset, SidebarProvider } from '../ui/sidebar'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string }>()
  const [, setUserId] = useState<string>()
  const [currentTier, setCurrentTier] = useState<string>('free')
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        navigate('/')
        return
      }

      setUser({
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        avatar: session.user.user_metadata?.avatar_url,
      })
      setUserId(session.user.id)

      // Get user tier
      const tierInfo = await getUserTier(session.user.id)
      setCurrentTier(tierInfo.tier)

      setIsLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/')
      } else {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar_url,
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
        <RetroGrid className="opacity-30" />
        <Ripple />
        <div className="relative z-10 text-center">
          <AnimatedShinyText className="text-lg">Loading your workspace...</AnimatedShinyText>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        {/* Top Bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <div className="flex-1"></div>
          <div className="flex items-center gap-3">
            {/* Tier Badge */}
            <Badge
              variant="outline"
              className={
                currentTier === 'max'
                  ? 'border-primary text-primary'
                  : currentTier === 'pro'
                  ? 'border-primary text-primary'
                  : 'border-muted-foreground text-muted-foreground'
              }
            >
              {currentTier === 'max' && <Crown className="w-3 h-3 mr-1" />}
              {currentTier === 'pro' && <Zap className="w-3 h-3 mr-1" />}
              {currentTier.toUpperCase()}
            </Badge>

            {/* Upgrade Button (only show for free tier) */}
            {currentTier === 'free' && (
              <Button
                size="sm"
                onClick={() => navigate('/app/billing')}
              >
                Upgrade
              </Button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
