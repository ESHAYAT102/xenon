import type { Metadata } from "next"

import BrowserContextMenu from "@/components/BrowserContextMenu"
import Navbar from "@/components/Navbar"
import NotificationsPanel from "@/components/NotificationsPanel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getGitHubNotifications } from "@/lib/github"
import { getSessionUser } from "@/lib/session"

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Notifications" }
}

export default async function NotificationsPage() {
  const sessionUser = await getSessionUser()
  const unreadNotifications = await getGitHubNotifications(sessionUser, {
    unreadOnly: true,
  })
  const notifications = await getGitHubNotifications(sessionUser, {
    unreadOnly: false,
  })

  return (
    <BrowserContextMenu triggerClassName="block min-h-screen w-full">
      <div className="min-h-screen bg-background text-foreground">
        <Navbar initialUnreadNotifications={unreadNotifications} />
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pt-24 pb-10 md:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Notifications
              </h1>
              <p className="mt-1 text-muted-foreground">
                All notifications from your GitHub inbox
              </p>
              <p className="mt-6 flex text-sm text-muted-foreground sm:hidden">
                {notifications.length} total
              </p>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:flex">
              {notifications.length} total
            </p>
          </div>

          <Card className="overflow-hidden rounded-3xl">
            <CardHeader className="border-b border-border">
              <CardTitle>Inbox</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <NotificationsPanel
                notifications={notifications}
                emptyLabel="No notifications"
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </BrowserContextMenu>
  )
}
