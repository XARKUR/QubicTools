"use client"

import * as React from "react"
import {
  CircleGauge,
  Calculator,
  CopyPlus,
  Dices,
  ScanSearch,
  Heart,
  Earth,
  FileText,
  Wallet,
  AppWindow,
  SquarePlay,
  Users
} from "lucide-react"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { SponsorDialog } from "@/components/features/shared/sponsor-dialog"

import { MainNav } from "./main-nav"
import { UserNav } from "./user-nav"
import { NavFriendLinks } from "./nav-friendlink"
import { NavOfficialLinks } from "./nav-official-link"
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
    email: "https://x.com/iXARKUR",
    avatar: "XARKUR"
  },
  navMain: [
    {
      titleKey: 'nav.dashboard',
      url: "/",
      icon: CircleGauge
    },
    {
      titleKey: 'nav.profitCalculator',
      url: "/calculator",
      icon: Calculator
    },
    {
      titleKey: 'nav.vanityAddress',
      url: "/vanity-address",
      icon: Dices
    },
    {
      titleKey: 'nav.batchAddress',
      url: "/batch-address",
      icon: CopyPlus
    },
    {
      titleKey: 'nav.batchBalance',
      url: "/batch-balance",
      icon: ScanSearch
    }
  ],
  officialLinks: [
    {
      titleKey: 'nav.officialLinks.officialWebsite',
      url: "https://qubic.org/",
      icon: Earth,
    },
    {
      titleKey: 'nav.officialLinks.officialDocs',
      url: "https://docs.qubic.org/",
      icon: FileText,
    },
    {
      titleKey: 'nav.officialLinks.wallet.title',
      icon: Wallet,
      defaultExpanded: false,
      children: [
        {
          titleKey: 'nav.officialLinks.wallet.web',
          url: "https://wallet.qubic.org/"
        },
        {
          titleKey: 'nav.officialLinks.wallet.android',
          url: "https://play.google.com/store/apps/details?id=org.qubic.wallet"
        },
        {
          titleKey: 'nav.officialLinks.wallet.ios',
          url: "https://apps.apple.com/us/app/qubic-wallet/id6502265811"
        }
      ]
    },
    {
      titleKey: 'nav.officialLinks.officialExplorer',
      url: "https://explorer.qubic.org/",
      icon: AppWindow,
    },
    {
      titleKey: 'nav.officialLinks.community.title',
      icon: Users,
      defaultExpanded: false,
      children: [
        {
          titleKey: 'nav.officialLinks.community.twitter',
          url: "https://x.com/_qubic_"
        },
        {
          titleKey: 'nav.officialLinks.community.discord',
          url: "https://discord.com/invite/qubic"
        },
        {
          titleKey: 'nav.officialLinks.community.telegram',
          url: "https://t.me/qubic_network"
        }
      ]
    },
  ],
  friendLinks: [
    {
      titleKey: 'nav.friendLinks.fattyDoge.title',
      url: "https://fattydoge.top/",
      icon: Calculator,
      description: "nav.friendLinks.fattyDoge.description"
    },
    {
      titleKey: 'nav.friendLinks.haosky.title',
      url: "https://www.youtube.com/@Haosky-Qubic",
      icon: SquarePlay,
      description: "nav.friendLinks.haosky.description"
    }
  ],
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
                    alt="LOGO"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    fallbackSrc="/img/placeholder.png"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">QubicTools</span>
                  <span className="truncate text-xs">Build by XARKUR</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        <MainNav items={data.navMain} />
        <NavOfficialLinks officialLinks={data.officialLinks} />
        <NavFriendLinks friendLinks={data.friendLinks} />
        <div className="mt-auto space-y-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="flex items-center justify-center"
              >
                <SponsorDialog trigger={
                  <Button variant="outline" size="default" className="w-full h-10">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <span className="text-sm font-medium">{t('common.support.title')}</span>
                    </div>
                  </Button>
                } wallets={[
                  {
                    title: "Qubic",
                    address: "XARKUROFQOTNDDSGVGUZSWDEEYMBSXOEAAYGJMUTFDWDMASHMFQPKYIHTPHA",
                    chain: "qubic"
                  },
                  {
                    title: "ETH",
                    address: "0xDc12280f38FD02A6c8751E385F74E46AFadebd8e",
                    chain: "ethereum"
                  },
                  {
                    title: "BTC",
                    address: "bc1plc6lapvsnwzc6faxufkatu83hjf4ma97uy0ghz8v269f6vphfdws4jhaad",
                    chain: "bitcoin"
                  },
                  {
                    title: "SOL",
                    address: "3ycJJzoQKzKYQYFxBsoRpqxmPR7t8tUKiYefNjDCCF38",
                    chain: "solana"
                  }
                ]} />
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
