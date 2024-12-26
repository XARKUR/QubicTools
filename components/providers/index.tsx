'use client'

import { PropsWithChildren } from 'react'
import { I18nProvider } from '@/components/i18n/i18n-provider'

export function Providers({ children }: PropsWithChildren) {
  return (
    <I18nProvider>
      {children}
    </I18nProvider>
  )
}
