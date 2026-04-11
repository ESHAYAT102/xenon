import BrowserContextMenu from "@/components/BrowserContextMenu"
import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { getGitHubNotifications, getTrendingRepositories } from "@/lib/github"
import { getSessionUser } from "@/lib/session"
import { Flame, GitFork, Star } from "lucide-react"

import A from "@/components/A"
import ProfileRepositories from "@/components/ProfileRepositories"

type HomePageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function Page({ searchParams }: HomePageProps) {
  const params = await searchParams
  const user = await getSessionUser()
  const unreadNotifications = await getGitHubNotifications(user, {
    unreadOnly: true,
  })
  const tab = params.tab ?? "trending"

  const viewerRepos = user
    ? await (await import("@/lib/github")).getGitHubViewerRepositories(user)
    : []
  const trending = await getTrendingRepositories(user)

  return (
    <BrowserContextMenu triggerClassName="block min-h-screen w-full">
      <div className="min-h-screen bg-background text-foreground">
        <Navbar initialUnreadNotifications={unreadNotifications} />
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 pt-32 pb-10 md:px-8">
          <div className="space-y-6">
            <div className="mx-auto max-w-2xl space-y-4 text-center">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Find repositories
              </h1>
              <p className="text-lg text-muted-foreground">
                Search and explore open-source projects
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {user ? (
                <>
                  <Button
                    variant={tab === "trending" ? "secondary" : "outline"}
                    className="rounded-full"
                    asChild
                  >
                    <A href="/">
                      <Flame className="mr-2 size-4" />
                      Trending
                    </A>
                  </Button>
                  <Button
                    variant={tab === "starred" ? "secondary" : "outline"}
                    className="rounded-full"
                    asChild
                  >
                    <A href="/?tab=starred">
                      <Star className="mr-2 size-4" />
                      Starred
                    </A>
                  </Button>
                  <Button
                    variant={tab === "forks" ? "secondary" : "outline"}
                    className="rounded-full"
                    asChild
                  >
                    <A href="/?tab=forks">
                      <GitFork className="mr-2 size-4" />
                      Forks
                    </A>
                  </Button>
                </>
              ) : null}
            </div>
          </div>
          {tab === "trending" && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold tracking-tight">
                Trending Repositories
              </h1>
              <p className="text-sm text-muted-foreground">
                Popular repositories from the last 30 days
              </p>
              <ProfileRepositories
                repositories={trending}
                enableRemoteSearch
                showStarredToggle={false}
              />
            </div>
          )}
          {tab === "starred" && user && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold tracking-tight">
                Your Starred Repositories
              </h1>
              <p className="text-sm text-muted-foreground">
                Repositories you have starred
              </p>
              <ProfileRepositories
                repositories={viewerRepos}
                showStarredToggle={false}
              />
            </div>
          )}
          {tab === "forks" && user && (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold tracking-tight">
                Your Forked Repositories
              </h1>
              <p className="text-sm text-muted-foreground">
                Repositories you have forked
              </p>
              <ProfileRepositories
                repositories={viewerRepos}
                showStarredToggle={false}
              />
            </div>
          )}
        </main>
      </div>
    </BrowserContextMenu>
  )
}
