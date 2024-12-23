"use client"

import * as React from "react"
import {
  Calculator,
  Group,
  Dices,
  ScanSearch,
  Heart
} from "lucide-react"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { useTranslation } from 'react-i18next'
import { SponsorDialog } from "@/components/features/home/sponsor-dialog"

import { MainNav } from "./main-nav"
import { UserNav } from "./user-nav"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const getNavData = (t: (key: string) => string) => ({
  user: {
    name: t('common.userName'),
    email: t('common.userEmail'),
    avatar: ""
  },
  navMain: [
    {
      titleKey: 'nav.dashboard',
      url: "/",
      icon: Calculator
    },
    {
      titleKey: 'nav.vanityAddress',
      url: "/vanity-address",
      icon: Dices
    },
    {
      titleKey: 'nav.batchWallet',
      url: "/batch-wallet",
      icon: Group
    },
    {
      titleKey: 'nav.batchBalance',
      url: "/batch-balance",
      icon: ScanSearch
    }
  ]
})

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()
  const data = getNavData(t)

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <OptimizedImage
                    src="/img/logo.png"
                    alt={t('common.qubicLogo')}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    fallbackSrc="/img/placeholder.png"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t('common.qubicTools')}</span>
                  <span className="truncate text-xs">{t('common.buildBy', { author: t('common.authorName') })}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        <MainNav items={data.navMain} />
        <div className="mt-auto space-y-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="flex items-center justify-center"
              >
                <div className="flex items-center">
                  <SponsorDialog wallets={[
                    {
                      title: "Qubic",
                      address: "XARKUROFQOTNDDSGVGUZSWDEEYMBSXOEAAYGJMUTFDWDMASHMFQPKYIHTPHA",
                      icon: <Heart className="h-4 w-4" />
                    }
                  ]} />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <UserNav className="mt-auto" />
        </div>
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
    </Sidebar>
  )
}
