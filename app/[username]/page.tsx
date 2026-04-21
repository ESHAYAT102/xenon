import {
  CalendarDays,
  SquareArrowOutUpRight,
  Globe,
  MapPin,
  Users,
} from "lucide-react"
import type { Metadata } from "next"

import BrowserContextMenu from "@/components/BrowserContextMenu"
import Navbar from "@/components/Navbar"
import ProfileContentTabs from "@/components/ProfileContentTabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  getGitHubActivity,
  getGitHubNotifications,
  getGitHubProfilePageData,
  getGitHubStarredRepositories,
} from "@/lib/github"
import { getSessionUser } from "@/lib/session"
import A from "@/components/A"

type ProfilePageProps = {
  params: Promise<{
    username: string
  }>
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const sessionUser = await getSessionUser()
  const { profile, rateLimited } = await getGitHubProfilePageData(
    username,
    sessionUser
  )

  if (rateLimited) {
    return { title: username }
  }

  const title = profile.name
    ? `${profile.name} (${profile.login})`
    : profile.login

  return { title }
}

function formatJoinedDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function buildLanguageDistribution(
  repositories: Awaited<
    ReturnType<typeof getGitHubProfilePageData>
  >["repositories"]
) {
  const counts = new Map<string, number>()

  for (const repository of repositories) {
    if (!repository.language) continue
    counts.set(repository.language, (counts.get(repository.language) ?? 0) + 1)
  }

  const total = Array.from(counts.values()).reduce(
    (sum, value) => sum + value,
    0
  )

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([language, count], index) => ({
      colorClass: [
        "bg-sky-500",
        "bg-yellow-400",
        "bg-violet-500",
        "bg-orange-500",
        "bg-lime-400",
        "bg-slate-400",
      ][index],
      count,
      language,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const sessionUser = await getSessionUser()
  const profileData = await getGitHubProfilePageData(username, sessionUser)

  if (profileData.rateLimited) {
    const rateLimitTime = profileData.rateLimitReset
      ? new Intl.DateTimeFormat("en", {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(profileData.rateLimitReset))
      : null

    return (
      <BrowserContextMenu triggerClassName="block min-h-screen w-full">
        <div className="min-h-screen bg-background text-foreground">
          <Navbar initialUnreadNotifications={[]} />
          <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 pt-50 pb-10 md:px-8">
            <Empty className="w-full">
              <EmptyHeader>
                <EmptyTitle className="text-2xl">Rate limit reached</EmptyTitle>
                <EmptyDescription>
                  GitHub API rate limits were hit.{" "}
                  {rateLimitTime
                    ? `Try again after ${rateLimitTime}.`
                    : "Try again in a few minutes."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent />
            </Empty>
            {!sessionUser && (
              <Button className="px-4" asChild>
                <A href="/api/auth/github/login">Continue with GitHub</A>
              </Button>
            )}
          </div>
        </div>
      </BrowserContextMenu>
    )
  }

  const { profile, repositories } = profileData

  const [unreadNotifications, activity, starredRepositories] = sessionUser
    ? await Promise.all([
        getGitHubNotifications(sessionUser, { unreadOnly: true }),
        getGitHubActivity(username, sessionUser),
        getGitHubStarredRepositories(username, sessionUser),
      ])
    : [undefined, [], []]

  const languageDistribution = buildLanguageDistribution(repositories)
  const fallbackInitial = profile.login.charAt(0).toUpperCase()
  const followerCount = profile.followers ?? 0
  const followingCount = profile.following ?? 0

  return (
    <BrowserContextMenu triggerClassName="block min-h-screen w-full">
      <div className="min-h-screen bg-background text-foreground">
        <Navbar initialUnreadNotifications={unreadNotifications} />
        <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 pt-24 pb-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
          <aside className="space-y-5">
            <div className="space-y-4">
              <Avatar
                size="lg"
                className="mt-10 mb-16 ml-10 scale-300 rounded-[1.75rem]"
              >
                <AvatarImage
                  src={profile.avatar_url ?? undefined}
                  alt={profile.login}
                />
                <AvatarFallback className="rounded-[1.75rem] text-4xl">
                  {fallbackInitial}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {profile.name || profile.login}
                  </h2>
                  <A
                    href={profile.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    <SquareArrowOutUpRight className="size-4" />
                  </A>
                </div>
                <p className="text-sm text-muted-foreground">
                  @{profile.login}
                </p>
                {profile.bio ? (
                  <p className="pt-1 text-xs leading-6 text-muted-foreground">
                    {profile.bio}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Users className="size-4" />
              <span>{followerCount} followers</span>
              <span className="opacity-0">·</span>
              <span>{followingCount} following</span>
            </div>

            <Separator />

            <div className="space-y-3 text-xs text-muted-foreground">
              {profile.blog ? (
                <div className="flex items-center gap-3">
                  <Globe className="size-4" />
                  <A
                    href={
                      profile.blog.startsWith("http")
                        ? profile.blog
                        : `https://${profile.blog}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="truncate hover:text-foreground"
                  >
                    {profile.blog.replace(/^https?:\/\//, "")}
                  </A>
                </div>
              ) : null}
              {profile.location ? (
                <div className="flex items-center gap-3">
                  <MapPin className="size-4" />
                  <span>{profile.location}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-3">
                <CalendarDays className="size-4" />
                <span>Joined {formatJoinedDate(profile.created_at)}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
                Languages
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                {languageDistribution.map((language) => (
                  <div
                    key={language.language}
                    className={language.colorClass}
                    style={{ width: `${language.percentage}%` }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-2 text-[11px] text-muted-foreground">
                {languageDistribution.map((language) => (
                  <div
                    key={language.language}
                    className="flex items-center gap-2"
                  >
                    <span
                      className={`size-2 rounded-full ${language.colorClass}`}
                    />
                    <span>
                      {language.language} {language.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <Separator className="block lg:hidden" />

          <section className="space-y-5">
            <ProfileContentTabs
              activity={activity}
              repositories={repositories}
              starredRepositories={starredRepositories}
            />
          </section>
        </main>
      </div>
    </BrowserContextMenu>
  )
}
