"use client"

import { AppSidebar } from "@/components/layout/navigation/sidebar"
import { PageHeader } from "@/components/layout/page-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useTranslation } from 'react-i18next'
import dynamic from 'next/dynamic'

const StatCardGrid = dynamic(
  () => import('@/components/features/calculator/stat-card-grid').then((mod) => mod.StatCardGrid),
  {
    ssr: false
  }
)

const ContentGrid = dynamic(
  () => import('@/components/features/calculator/content-grid').then((mod) => mod.ContentGrid),
  {
    ssr: false
  }
)

/**
 * Calculator页面组件
 * 
 * @returns {JSX.Element} Calculator页面
 */
export default function CalculatorPage() {
  const { t } = useTranslation()
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader title={t('calculator.title')} />
        <div className="flex flex-col gap-4 px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8 lg:px-12 lg:pb-12">
          <StatCardGrid />
          <ContentGrid />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
