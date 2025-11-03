import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ripple } from '../ui/ripple'
import { RetroGrid } from '../ui/retro-grid'
import { AnimatedShinyText } from '../ui/animated-shiny-text'
import { supabase } from '../../lib/supabase'
import { AppSidebar } from '../app-sidebar'
import { SidebarInset, SidebarProvider } from '../ui/sidebar'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string }>()
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
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
