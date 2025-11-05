import * as React from "react"
import { Home, FileText, CreditCard, Sparkles, HelpCircle } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { getUserResumes } from "@/lib/uploadResume"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { GridPattern } from "@/components/ui/grid-pattern"
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    avatar?: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const navigate = useNavigate()
  const [tailorUrl, setTailorUrl] = React.useState("/app/tailor-resume")

  // Smart navigation: fetch user's first resume and go directly to generated resumes history
  React.useEffect(() => {
    const loadFirstResume = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const resumes = await getUserResumes(session.user.id)
        if (resumes && resumes.length > 0) {
          // If user has resumes, navigate to generated resumes page (history)
          setTailorUrl(`/app/generated-resumes/${resumes[0].id}`)
        }
      } catch (error) {
        console.error('Error loading resumes for sidebar:', error)
      }
    }

    loadFirstResume()
  }, [])

  const navItems = [
    {
      title: "Dashboard",
      url: "/app/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "My Resumes",
      url: "/app/my-resumes",
      icon: FileText,
    },
    {
      title: "Tailor Resume",
      url: tailorUrl,
      icon: Sparkles,
    },
    {
      title: "Billing",
      url: "/app/billing-details",
      icon: CreditCard,
    },
    {
      title: "Support",
      url: "/support",
      icon: HelpCircle,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="relative overflow-hidden">
        <GridPattern className="opacity-10" width={30} height={30} />
        <Link to="/app/dashboard" className="flex items-center gap-2 px-2 relative z-10">
          <img
            src="/icons/logo-500.png"
            alt="Resumefy Logo"
            className="w-8 h-8"
          />
          <AnimatedGradientText
            className="text-xl font-semibold"
            colorFrom="#4CAF50"
            colorTo="#2E7D32"
          >
            Resumefy
          </AnimatedGradientText>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
