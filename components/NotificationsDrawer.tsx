"use client"

import { useEffect, useState } from "react"
import { BellIcon } from "lucide-react"

import NotificationsPanel from "@/components/NotificationsPanel"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import type { GitHubNotification } from "@/lib/github"
import A from "./A"

type NotificationsDrawerProps = {
  initialNotifications: GitHubNotification[]
}

export default function NotificationsDrawer({
  initialNotifications,
}: NotificationsDrawerProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] =
    useState<GitHubNotification[]>(initialNotifications)

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadNotifications() {
      const response = await fetch("/api/notifications?unreadOnly=true", {
        cache: "no-store",
      })

      if (!response.ok) return

      const data = (await response.json()) as {
        notifications: GitHubNotification[]
      }

      if (!cancelled) {
        setNotifications(data.notifications)
      }
    }

    void loadNotifications()

    return () => {
      cancelled = true
    }
  }, [open])

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          className="rounded-full"
          variant="ghost"
          title="View notifications"
        >
          <BellIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-2 text-sm before:inset-2 before:rounded-2xl before:border before:border-border before:bg-popover before:shadow-xl data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:max-w-125">
        <DrawerHeader className="gap-0 border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <DrawerTitle className="flex items-center gap-3 text-[15px] font-medium">
                <BellIcon className="size-4.5" />
                Notifications
              </DrawerTitle>
            </div>
            <div className="flex items-center gap-3 pt-0.5">
              <Button
                asChild
                variant="ghost"
                className="h-auto rounded-none px-0 py-0 text-[13px] font-medium text-foreground hover:bg-transparent hover:text-foreground"
              >
                <A href="/notifications">View all</A>
              </Button>
            </div>
          </div>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <NotificationsPanel
            notifications={notifications.filter(
              (notification) => notification.unread
            )}
            emptyLabel="All caught up"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
