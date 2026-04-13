"use client"

import { useEffect, useState } from "react"

import BrowserContextMenu from "@/components/BrowserContextMenu"
import { LoginForm } from "@/components/login-form"
import { getTrendingRepositories } from "@/lib/github"
import { useAuth } from "@/components/AuthProvider"
import HomeActivity from "@/components/HomeActivity"
import TrendingRepositories from "@/components/TrendingRepositories"
import { getGitHubActivity, getGitHubNotifications } from "@/lib/github"

export default function HomePage() {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [trending, setTrending] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    setIsLoading(false)

    const handleOffline = () => setIsOnline(false)
    const handleOnline = () => setIsOnline(true)

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  useEffect(() => {
    if (!isOnline) return

    async function fetchData() {
      try {
        const trendingData = await getTrendingRepositories(null)
        setTrending(trendingData)

        if (user?.accessToken) {
          const [notifs, act] = await Promise.all([
            getGitHubNotifications(user, { unreadOnly: true }),
            getGitHubActivity(user.login, user),
          ])
          setActivity(act)
        }
      } catch (e) {
        console.error(e)
      }
    }

    fetchData()
  }, [isOnline, user])

  if (!isOnline) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <h1 className="text-9xl font-black">Offline</h1>
        <p className="mt-4 text-muted-foreground">
          You&apos;re offline. Check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-full bg-foreground px-4 py-2 text-background"
        >
          Try again
        </button>
      </div>
    )
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background text-foreground" />
  }

  return (
    <BrowserContextMenu triggerClassName="block min-h-screen w-full">
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pt-24 pb-10 md:px-8">
          {user ? (
            <>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Your Activity
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Recent commits, issues, and pull requests
                  </p>
                </div>
                <HomeActivity activity={activity} />
              </div>

              <div className="space-y-6">
                <TrendingRepositories repositories={trending} />
              </div>
            </>
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center">
              <LoginForm />
            </div>
          )}
        </main>
      </div>
    </BrowserContextMenu>
  )
}
