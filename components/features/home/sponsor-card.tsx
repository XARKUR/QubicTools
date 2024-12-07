"use client"

import { Copy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

interface WalletAddress {
  title: string
  address: string
  icon: React.ReactNode
}

interface SponsorCardProps {
  wallets: WalletAddress[]
}

export function SponsorCard({ wallets }: SponsorCardProps) {
  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      toast.success("Address copied to clipboard")
    } catch {
      toast.error("Unable to copy, please copy manually")
    }
  }

  return (
    <Card className="overflow-hidden bg-card hover:bg-accent/5 transition-colors">
      <CardContent className="p-6">
        <div className="space-y-6">
          {wallets.map((wallet, index) => (
            <div key={wallet.title} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-md">
                    {wallet.icon}
                  </div>
                  <span className="font-semibold">{wallet.title}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => copyToClipboard(wallet.address)}
                  className="hover:bg-primary/10 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground font-mono break-all bg-muted/50 p-3 rounded-md">
                {wallet.address}
              </div>
              {index < wallets.length - 1 && (
                <Separator className="mt-3" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
