import * as React from "react"
import { Home, FileText, CreditCard, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

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
      url: "/app/tailor-resume",
      icon: Sparkles,
    },
    {
      title: "Billing",
      url: "/app/billing-details",
      icon: CreditCard,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="relative overflow-hidden">
        <GridPattern className="opacity-10" width={30} height={30} />
        <Link to="/app/dashboard" className="flex items-center gap-2 px-2 relative z-10">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">R</span>
          </div>
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
