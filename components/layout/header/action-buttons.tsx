"use client"

import * as React from "react"
import { Moon, Sun, Languages, Github } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useTranslation } from 'react-i18next'
import { toast } from "sonner"

export function ActionButtons() {
  const { theme, setTheme } = useTheme()
  const { i18n, t } = useTranslation()

  React.useEffect(() => {
    const savedLang = localStorage.getItem('preferred-language')
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang)
    }
  }, [i18n])

  const toggleLanguage = React.useCallback(() => {
    try {
      const currentLang = i18n.language
      const nextLang = currentLang === 'zh' ? 'en' : 'zh'
      console.log('Switching language from', currentLang, 'to', nextLang)
      i18n.changeLanguage(nextLang)
      localStorage.setItem('preferred-language', nextLang)
      toast.success(t('common.language.switched', { lang: nextLang.toUpperCase() }))
    } catch (error) {
      console.error('Error switching language:', error)
      toast.error(t('common.language.switchFailed'))
    }
  }, [i18n, t])

  React.useEffect(() => {
    console.log('Current language:', i18n.language)
  }, [i18n.language])

  return (
    <div className="flex items-center space-x-2">
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

      <Button
        variant="outline"
        size="icon"
        className="hover:bg-accent h-8 w-8"
        onClick={toggleLanguage}
      >
        <Languages className="h-4 w-4" />
        <span className="sr-only">{t('common.language.toggle')}</span>
      </Button>

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
  )
}