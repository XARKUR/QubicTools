"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import Image from "next/image"

interface ArticleCardProps {
  title: string
  date: string
  link: string
  image: string
  isFirst?: boolean
}

export function ArticleCard({ title, date, link, image, isFirst = false }: ArticleCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="overflow-hidden">
      <div className="flex gap-6 p-4">
        <div className="relative w-32 h-32 flex-shrink-0">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 128px) 100vw"
            priority={isFirst}
            className="object-cover rounded-md"
          />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="font-medium line-clamp-2 text-sm mb-2">{title}</h3>
          <div className="flex items-center justify-between mt-auto">
            <p className="text-sm text-muted-foreground">{date}</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => window.open(link, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              {t('dashboard.articles.viewDetails')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
