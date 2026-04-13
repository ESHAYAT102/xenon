"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function OfflineMonitor() {
  const router = useRouter()

  useEffect(() => {
    const handleOffline = () => {
      if (!navigator.onLine) {
        router.push("/offline")
      }
    }

    const handleOnline = () => {
      if (navigator.onLine && window.location.pathname === "/offline") {
        router.push("/")
      }
    }

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    if (!navigator.onLine) {
      router.push("/offline")
    }

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [router])

  return null
}
