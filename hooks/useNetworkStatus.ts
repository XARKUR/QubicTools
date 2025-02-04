import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

export function useNetworkStatus() {
  const { t } = useTranslation()
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine)
    }

    setIsOffline(!navigator.onLine)

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  const securityStatus = isOffline
    ? { variant: "default" as const, color: "text-green-500", message: t('vanityAddress.networkStatus.offline') }
    : { variant: "destructive" as const, color: "text-destructive", message: t('vanityAddress.networkStatus.online') }

  return { isOffline, securityStatus }
}
