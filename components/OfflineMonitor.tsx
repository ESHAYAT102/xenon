"use client"

import { useEffect, useState } from "react"

export default function OfflineMonitor() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOffline = () => setIsOnline(false)
    const handleOnline = () => setIsOnline(true)

    setIsOnline(navigator.onLine)

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  if (!isOnline) {
    document.documentElement.classList.add("offline")
  } else {
    document.documentElement.classList.remove("offline")
  }

  return null
}
