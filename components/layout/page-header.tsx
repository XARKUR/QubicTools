"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Separator } from "@/components/ui/separator"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink,
  BreadcrumbList, 
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ActionButtons } from "@/components/layout/header/action-buttons"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  const { t } = useTranslation()
  
  return (
    <div>
      <header className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {children ? (
            children
          ) : (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">
                    {t("nav.home")}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t(title)}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
        <ActionButtons />
      </header>
      {description && (
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 mt-2">
          <p className="text-sm text-muted-foreground">{t(description)}</p>
        </div>
      )}
    </div>
  )
}
