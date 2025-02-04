"use client"

import { AppSidebar } from "@/components/layout/navigation/sidebar"
import { PageHeader } from "@/components/layout/page-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useTranslation } from 'react-i18next'
import dynamic from 'next/dynamic'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink,
  BreadcrumbList, 
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ContentGridSkeleton } from '@/components/features/calculator/history/history-content'

const ContentGrid = dynamic(
  () => import('@/components/features/calculator/history/history-content').then((mod) => mod.ContentGrid),
  {
    loading: () => <ContentGridSkeleton />,
    ssr: false
  }
)

/**
 * Calculator页面组件
 * 
 * @returns {JSX.Element} Calculator页面
 */
export default function HistoryPage() {
  const { t } = useTranslation()
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader title={t('calculator.history.title')}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  {t('nav.home')}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/calculator">
                  {t('calculator.title')}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {t('calculator.history.title')}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageHeader>
        <div className="flex flex-col gap-4 px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8 lg:px-12 lg:pb-12">
          <ErrorBoundary>
            <ContentGrid />
          </ErrorBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
