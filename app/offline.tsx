"use client"

import { useEffect, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"

import Navbar from "@/components/Navbar"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"

function subscribe(callback: () => void) {
  window.addEventListener("online", callback)
  window.addEventListener("offline", callback)
  return () => {
    window.removeEventListener("online", callback)
    window.removeEventListener("offline", callback)
  }
}

export default function OfflinePage() {
  const router = useRouter()
  const isOnline = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  useEffect(() => {
    if (isOnline) {
      router.push("/")
    }
  }, [isOnline, router])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Empty className="flex h-screen flex-col items-center justify-center align-middle">
        <EmptyHeader>
          <EmptyTitle className="text-9xl font-black">Offline</EmptyTitle>
          <EmptyDescription>
            <p className="mb-2">You&apos;re offline</p>
            Check your internet connection and try again.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            onClick={() => window.location.reload()}
            className="rounded-full px-4"
          >
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
