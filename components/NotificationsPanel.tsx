"use client"

import { useEffect, useState } from "react"
import {
  BellIcon,
  Check,
  BellOff,
  Bookmark,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import type { GitHubNotification } from "@/lib/github"
import A from "./A"

type NotificationsPanelProps = {
  emptyLabel: string
  notifications: GitHubNotification[]
}

function formatRelativeDate(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.floor(diff / (1000 * 60)))

  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(months / 12)
  return `${years}y ago`
}

export default function NotificationsPanel({
  emptyLabel,
  notifications: initialNotifications,
}: NotificationsPanelProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setNotifications(initialNotifications)
  }, [initialNotifications])

  const handleAction = async (id: string, method: string) => {
    setLoadingIds((prev) => new Set(prev).add(id))
    try {
      const response = await fetch("/api/notifications", {
        method,
        body: JSON.stringify({ threadId: id }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        router.refresh()
      }
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center text-muted-foreground">
        <BellIcon className="mb-4 size-10 stroke-[1.75] opacity-35" />
        <p className="text-[13px] tracking-[0.08em]">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {notifications.map((notification, index) => (
        <div key={notification.id} className="group relative">
          <div className="flex items-start justify-between gap-4 px-5 py-4 transition hover:bg-accent/20">
            <A
              href={notification.url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1"
            >
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full text-[11px]">
                    {notification.reason}
                  </Badge>
                  <span className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                    {notification.subjectType}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {notification.repositoryFullName}
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 font-medium">
                  {notification.subjectTitle}
                </p>
              </div>
            </A>
            <div className="flex shrink-0 flex-col items-end gap-3">
              <div className="text-xs text-muted-foreground">
                {formatRelativeDate(notification.updatedAt)}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  title="Mark as done"
                  disabled={loadingIds.has(notification.id)}
                  onClick={() => handleAction(notification.id, "DELETE")}
                >
                  {loadingIds.has(notification.id) ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  title="Unsubscribe"
                  disabled={loadingIds.has(notification.id)}
                  onClick={() => handleAction(notification.id, "PUT")}
                >
                  {loadingIds.has(notification.id) ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <BellOff className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  title="Save for later"
                  disabled={loadingIds.has(notification.id)}
                  onClick={() => {}} // Not implemented
                >
                  <Bookmark className="size-4" />
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  title="Open on GitHub"
                >
                  <A href={notification.url} target="_blank" rel="noreferrer">
                    <ArrowRight className="size-4" />
                  </A>
                </Button>
              </div>
            </div>
          </div>
          {index < notifications.length - 1 ? <Separator /> : null}
        </div>
      ))}
    </div>
  )
}
