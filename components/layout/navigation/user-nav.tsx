"use client"

import { Twitter } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function UserNav({ className, ...props }: React.ComponentProps<typeof SidebarMenu>) {
  return (
    <SidebarMenu className={cn("mb-0", className)} {...props}>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
        >
          <a 
            href="https://x.com/iXARKUR" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Twitter className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">XARKUR</span>
              <span className="truncate text-xs">https://x.com/iXARKUR</span>
            </div>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
