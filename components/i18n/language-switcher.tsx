'use client'

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { languages } from '@/lib/i18n/settings'
import { languageMap } from '@/lib/i18n/languages'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const handleLanguageChange = async (lng: string) => {
    try {
      await i18n.changeLanguage(lng)
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[120px]">
          {languageMap[i18n.language]?.nativeName || 'Language'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => handleLanguageChange(lng)}
          >
            {languageMap[lng].nativeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
