"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * 
 * @interface StatCardProps
 * @property {string} title 
 * @property {string | number} value 
 * @property {string} [description] 
 * @property {React.ReactNode} [icon] 
 * @property {string} [className] 
 */
interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  className?: string
}

/*
 * 
 * @component
 * @example
 * ```tsx
 * import { Activity } from 'lucide-react'
 * 
 * <StatCard
 *   title="user"
 *   value={1234}
 *   description="+ 12%"
 *   icon={<Activity className="h-4 w-4" />}
 * />
 * ```
 */
export const StatCard = memo<StatCardProps>(({ 
  title, 
  value, 
  description, 
  icon,
  className 
}) => {
  const cardClassName = cn("overflow-hidden", className)
  
  const descriptionElement = description ? (
    <p className="text-xs text-muted-foreground">{description}</p>
  ) : null

  const iconElement = icon ? (
    <div className="text-muted-foreground">{icon}</div>
  ) : null

  return (
    <Card className={cardClassName}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {iconElement}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {descriptionElement}
      </CardContent>
    </Card>
  )
})

StatCard.displayName = "StatCard"
