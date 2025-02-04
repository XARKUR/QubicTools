"use client"

import * as React from "react"
import { Moon, Sun, Languages, Github, Search, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useTranslation } from 'react-i18next'
import { toast } from "sonner"
import { CommandSearch } from "@/components/features/shared/command-search"
import { languageMap } from "@/lib/i18n/languages"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ActionButtons() {
  const { theme, setTheme } = useTheme()
  const { i18n, t } = useTranslation()
  const [searchOpen, setSearchOpen] = React.useState(false)

  React.useEffect(() => {
    const savedLang = localStorage.getItem('preferred-language')
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang)
    }
  }, [i18n])

  const handleLanguageChange = React.useCallback(async (lng: string) => {
    try {
      await i18n.changeLanguage(lng)
      localStorage.setItem('preferred-language', lng)
      toast.success(t('common.language.switched', { lang: languageMap[lng].name }))
    } catch (error) {
      console.error('Error switching language:', error)
      toast.error(t('common.language.switchFailed'))
    }
  }, [i18n, t])

  React.useEffect(() => {
    console.log('Current language:', i18n.language)
  }, [i18n.language])

  return (
    <>
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="hover:bg-accent h-8 w-8"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">{t('common.search')}</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="hover:bg-accent h-8 w-8"
          asChild
        >
          <a
            href="https://github.com/XARKUR/QubicTools"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" />
            <span className="sr-only">GitHub</span>
          </a>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="hover:bg-accent h-8 w-8"
            >
              <Languages className="h-4 w-4" />
              <span className="sr-only">{t('common.language.toggle')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.keys(languageMap).map((lng) => (
              <DropdownMenuItem
                key={lng}
                onClick={() => handleLanguageChange(lng)}
                className="flex items-center justify-between"
              >
                {languageMap[lng].nativeName}
                {i18n.language === lng && (
                  <Check className="h-4 w-4 ml-2" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="icon"
          className="hover:bg-accent h-8 w-8"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('common.theme.toggle')}</span>
        </Button>
      </div>
    </>
  )
}