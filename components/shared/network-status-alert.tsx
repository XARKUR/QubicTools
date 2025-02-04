import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { cn } from "@/lib/utils"

export function NetworkStatusAlert() {
  const { securityStatus } = useNetworkStatus()

  return (
    <div
      role="alert"
      className="relative rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground py-1.5 px-3 h-8 w-fit flex items-center"
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full shrink-0",
          securityStatus.variant === "default" ? "bg-green-500" : "bg-destructive"
        )}
      />
      <div
        className={cn(
          "[&_p]:leading-relaxed text-xs ml-2 flex items-center",
          securityStatus.color
        )}
      >
        {securityStatus.message}
      </div>
    </div>
  )
}
