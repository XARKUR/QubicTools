'use client'

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { languages } from '@/lib/i18n/settings'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="flex gap-2">
      {languages.map((lng) => (
        <Button
          key={lng}
          variant={i18n.language === lng ? 'default' : 'outline'}
          onClick={() => i18n.changeLanguage(lng)}
        >
          {lng === 'en' ? 'English' : '中文'}
        </Button>
      ))}
    </div>
  )
}
