import { HTMLAttributes } from "react"
import { TooltipProps } from "recharts"
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent"

import { cn } from "@/lib/utils"

export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContainerProps extends HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: ChartContainerProps) {
  return (
    <div
      className={cn("relative space-y-4", className)}
      style={
        {
          "--color-profit": config.profit?.color,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  )
}

interface ChartTooltipContentProps extends TooltipProps<ValueType, NameType> {
  hideLabel?: boolean
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      {!hideLabel && <div className="text-[0.70rem] uppercase">{label}</div>}
      <div className="flex gap-2">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className="h-1 w-1 rounded-full"
              style={{ background: item.color }}
            />
            <span className="text-[0.70rem]">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { Tooltip as ChartTooltip } from "recharts"
