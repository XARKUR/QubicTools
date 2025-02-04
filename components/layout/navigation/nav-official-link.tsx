import { LucideIcon, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useState } from 'react'

export function NavOfficialLinks({
  officialLinks,
}: {
  officialLinks: {
    titleKey: string
    url?: string
    icon: LucideIcon
    defaultExpanded?: boolean
    children?: {
      titleKey: string
      url: string
      icon?: LucideIcon
    }[]
  }[]
}) {
  const { t } = useTranslation()
  const [expandedItems, setExpandedItems] = useState<string[]>(
    officialLinks
      .filter(item => item.defaultExpanded && item.children)
      .map(item => item.titleKey)
  )

  const toggleExpand = (titleKey: string) => {
    setExpandedItems(prev =>
      prev.includes(titleKey)
        ? prev.filter(key => key !== titleKey)
        : [...prev, titleKey]
    )
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t('nav.officialLinks.title')}</SidebarGroupLabel>
      <SidebarMenu>
        {officialLinks.map((item) => (
          <SidebarMenuItem key={item.titleKey}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild>
                    {item.url ? (
                      <a 
                        href={item.url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.titleKey)}</span>
                      </a>
                    ) : (
                      <div 
                        className="flex items-center gap-3 w-full cursor-pointer"
                        onClick={() => item.children && toggleExpand(item.titleKey)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.titleKey)}</span>
                        {item.children && (
                          <ChevronRight 
                            className={`ml-auto h-4 w-4 transition-transform ${expandedItems.includes(item.titleKey) ? 'rotate-90' : ''}`} 
                          />
                        )}
                      </div>
                    )}
                  </SidebarMenuButton>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
            {item.children && expandedItems.includes(item.titleKey) && (
              <SidebarMenu>
                {item.children.map((child) => (
                  <SidebarMenuItem key={child.titleKey}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <a 
                              href={child.url} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 pl-7"
                            >
                              {child.icon && <child.icon className="h-4 w-4" />}
                              <span>{t(child.titleKey)}</span>
                            </a>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
