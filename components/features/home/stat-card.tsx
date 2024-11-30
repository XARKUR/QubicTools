"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * 统计卡片属性接口
 * @interface StatCardProps
 * @property {string} title - 卡片标题
 * @property {string | number} value - 统计值
 * @property {string} [description] - 可选的描述文本
 * @property {React.ReactNode} [icon] - 可选的图标
 * @property {string} [className] - 可选的样式类名
 */
interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  className?: string
}

/**
 * 统计卡片组件
 * 
 * 用于展示单个统计指标，包括：
 * - 标题和图标
 * - 主要统计值
 * - 可选的描述文本
 * 
 * 特点：
 * - 性能优化：预计算 className 和条件渲染元素
 * - 灵活布局：支持自定义样式和图标
 * - 响应式设计：适应不同尺寸
 * 
 * @component
 * @example
 * ```tsx
 * import { Activity } from 'lucide-react'
 * 
 * <StatCard
 *   title="活跃用户"
 *   value={1234}
 *   description="较上月增长 12%"
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
  // 预计算className，避免每次渲染时重新计算
  const cardClassName = cn("overflow-hidden", className)
  
  // 优化条件渲染的性能
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
