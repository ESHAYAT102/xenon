import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  Code,
  CircleDot,
  Eye,
  EyeOff,
  GitCommitHorizontal,
  GitFork,
  GitPullRequest,
  Globe,
  Settings,
  SquareArrowOutUpRight,
  Tag,
} from "lucide-react"

import A from "@/components/A"
import BrowserContextMenu from "@/components/BrowserContextMenu"
import EmptyRepositoryInstructions from "@/components/EmptyRepositoryInstructions"
import Navbar from "@/components/Navbar"
import RepositoryActions from "@/components/RepositoryActions"
import RepositoryBranchSelector from "@/components/RepositoryBranchSelector"
import RepositoryEngagementActions from "@/components/RepositoryEngagementActions"
import RepositoryFileTree from "@/components/RepositoryFileTree"
import RepositoryFilePreview from "@/components/RepositoryFilePreview"
import RepoKeyboardShortcuts from "@/components/RepoKeyboardShortcuts"
import RepositorySettingsForm from "@/components/RepositorySettingsForm"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContextMenuItem } from "@/components/ui/context-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  getGitHubRepositoryCommits,
  getGitHubNotifications,
  getGitHubRepositoryBranches,
  getGitHubRepositoryCommitCount,
  getGitHubRepository,
  getGitHubRepositoryIssues,
  getGitHubRepositoryIssueCount,
  getGitHubRepositoryLanguages,
  getGitHubRepositoryPageData,
  getGitHubRepositoryPullRequests,
  getGitHubRepositoryPullRequestCount,
  getGitHubRepositoryReleases,
  isGitHubRepositoryStarred,
} from "@/lib/github"
import { getSessionUser } from "@/lib/session"

type RepositoryPageProps = {
  params: Promise<{
    username: string
    repo: string
  }>
  searchParams: Promise<{
    branch?: string
    commit?: string
    path?: string
    tab?: string
  }>
}

type RepositoryTab =
  | "code"
  | "commits"
  | "issues"
  | "pulls"
  | "releases"
  | "settings"

export async function generateMetadata({
  params,
}: RepositoryPageProps): Promise<Metadata> {
  const { username, repo } = await params
  const sessionUser = await getSessionUser()
  const repository = await getGitHubRepository(username, repo, sessionUser)

  if (!repository) {
    return { title: `${username}/${repo}` }
  }

  const title = repository.description
    ? `${username}/${repository.name}: ${repository.description}`
    : `${username}/${repository.name}`

  return { title }
}

function formatRelativeDate(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const days = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)))

  if (days === 1) return "1d ago"
  if (days < 30) return `${days}d ago`

  const months = Math.floor(days / 30)
  if (months === 1) return "1mo ago"
  if (months < 12) return `${months}mo ago`

  const years = Math.floor(months / 12)
  return years === 1 ? "1y ago" : `${years}y ago`
}

function buildRepositoryLanguageDistribution(
  languages: Record<string, number>
) {
  const total = Object.values(languages).reduce((sum, value) => sum + value, 0)

  return Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([language, bytes], index) => ({
      colorClass: [
        "bg-sky-500",
        "bg-yellow-400",
        "bg-violet-500",
        "bg-orange-500",
        "bg-lime-400",
        "bg-slate-400",
      ][index],
      language,
      percentage: total > 0 ? Math.round((bytes / total) * 100) : 0,
    }))
}

export default async function RepositoryPage({
  params,
  searchParams,
}: RepositoryPageProps) {
  const { username, repo } = await params
  const { branch, commit, path, tab } = await searchParams
  const sessionUser = await getSessionUser()
  const unreadNotifications = await getGitHubNotifications(sessionUser, {
    unreadOnly: true,
  })
  const commitRef = commit?.trim() || undefined
  const data = await getGitHubRepositoryPageData(
    username,
    repo,
    sessionUser,
    path,
    commitRef ?? branch
  )

  if (!data) {
    notFound()
  }

  const {
    contents,
    readme,
    repository,
    selectedItem,
    rateLimited,
    rateLimitReset,
  } = data
  const branches = await getGitHubRepositoryBranches(
    username,
    repo,
    sessionUser
  )
  const isStarred = await isGitHubRepositoryStarred(sessionUser, username, repo)
  const resolvedBranch = branch ?? repository.default_branch ?? "main"
  const isCommitRef = Boolean(commitRef)
  const canManageRepository =
    sessionUser?.login === repository.owner.login ||
    Boolean(repository.permissions?.admin || repository.permissions?.maintain)
  const currentTab: RepositoryTab =
    tab === "commits" ||
    tab === "issues" ||
    tab === "pulls" ||
    tab === "releases" ||
    (tab === "settings" && canManageRepository)
      ? tab
      : "code"
  const [
    commits,
    issues,
    pullRequests,
    releases,
    commitCount,
    issueCount,
    pullRequestCount,
    repositoryLanguages,
  ] = await Promise.all([
    currentTab === "commits"
      ? getGitHubRepositoryCommits(username, repo, sessionUser, resolvedBranch)
      : Promise.resolve([]),
    currentTab === "issues"
      ? getGitHubRepositoryIssues(username, repo, sessionUser)
      : Promise.resolve([]),
    currentTab === "pulls"
      ? getGitHubRepositoryPullRequests(username, repo, sessionUser)
      : Promise.resolve([]),
    getGitHubRepositoryReleases(username, repo, sessionUser),
    getGitHubRepositoryCommitCount(username, repo, sessionUser, resolvedBranch),
    getGitHubRepositoryIssueCount(username, repo, sessionUser),
    getGitHubRepositoryPullRequestCount(username, repo, sessionUser),
    getGitHubRepositoryLanguages(username, repo, sessionUser),
  ])
  const latestRelease = releases[0] ?? null
  const canEditRepository = canManageRepository && !isCommitRef
  const isOwnedEmptyRepository = canManageRepository && contents.length === 0
  const languageDistribution =
    buildRepositoryLanguageDistribution(repositoryLanguages)
  const ownerGitHubUrl = `https://github.com/${repository.owner.login}`
  const repositoryGitHubUrl = repository.html_url
  const contentRef = commitRef ?? resolvedBranch
  const showRateLimitNotice =
    Boolean(rateLimited) && contents.length === 0 && !readme && !selectedItem
  const rateLimitTime = rateLimitReset
    ? new Intl.DateTimeFormat("en", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(rateLimitReset))
    : null

  const codeTabHref = commitRef
    ? path
      ? `/${username}/${repo}?commit=${encodeURIComponent(commitRef)}&branch=${encodeURIComponent(resolvedBranch)}&path=${encodeURIComponent(path)}`
      : `/${username}/${repo}?commit=${encodeURIComponent(commitRef)}&branch=${encodeURIComponent(resolvedBranch)}`
    : resolvedBranch
      ? path
        ? `/${username}/${repo}?branch=${encodeURIComponent(resolvedBranch)}&path=${encodeURIComponent(path)}`
        : `/${username}/${repo}?branch=${encodeURIComponent(resolvedBranch)}`
      : path
        ? `/${username}/${repo}?path=${encodeURIComponent(path)}`
        : `/${username}/${repo}`

  const tabLinkClass = (isActive: boolean) =>
    [
      "inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm transition",
      isActive
        ? "border-foreground text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground",
    ].join(" ")

  return (
    <BrowserContextMenu triggerClassName="block min-h-screen w-full">
      <div className="min-h-screen bg-background text-foreground">
        <Navbar initialUnreadNotifications={unreadNotifications} />
        <RepoKeyboardShortcuts enabled />
        <main className="mx-auto max-w-7xl px-6 pt-24 pb-10">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="flex flex-wrap items-center text-3xl font-semibold tracking-tight">
                    <BrowserContextMenu
                      triggerClassName="inline-flex"
                      menuChildren={
                        <A
                          href={ownerGitHubUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ContextMenuItem>
                            <SquareArrowOutUpRight />
                            Open in GitHub
                          </ContextMenuItem>
                        </A>
                      }
                    >
                      <A
                        href={`/${repository.owner.login}`}
                        className="transition hover:text-muted-foreground"
                      >
                        {repository.owner.login}
                      </A>
                    </BrowserContextMenu>
                    <span className="px-1 text-muted-foreground">/</span>
                    <BrowserContextMenu
                      triggerClassName="inline-flex"
                      menuChildren={
                        <A
                          href={repositoryGitHubUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ContextMenuItem>
                            <SquareArrowOutUpRight />
                            Open in GitHub
                          </ContextMenuItem>
                        </A>
                      }
                    >
                      <A
                        href={`/${repository.owner.login}/${repository.name}`}
                        className="transition hover:text-muted-foreground"
                      >
                        {repository.name}
                      </A>
                    </BrowserContextMenu>
                  </h1>
                  <Badge variant="outline">
                    {repository.private ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                    {repository.private ? "Private" : "Public"}
                  </Badge>
                  {repository.fork ? (
                    <Badge variant="outline">
                      <GitFork className="size-3.5" />
                      Fork
                    </Badge>
                  ) : null}
                  {repository.archived ? (
                    <Badge variant="outline">Archived</Badge>
                  ) : null}
                </div>
                {repository.description ? (
                  <p className="max-w-xl text-sm text-muted-foreground">
                    {repository.description}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {repository.homepage ? (
                    <A
                      href={repository.homepage}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-foreground"
                    >
                      <Globe className="size-3.5" />
                      {repository.homepage.replace(/^https?:\/\//, "")}
                    </A>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Updated {formatRelativeDate(repository.updated_at)}
                  </span>
                </div>
                {commitRef ? (
                  <div className="text-xs text-muted-foreground">
                    Viewing commit{" "}
                    <span className="rounded-sm border border-border px-1 font-mono text-foreground">
                      {commitRef.slice(0, 7)}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <RepositoryBranchSelector
                  branches={branches}
                  commitRef={commitRef}
                  currentBranch={resolvedBranch}
                  owner={username}
                  repo={repo}
                  selectedPath={path}
                />
                <RepositoryEngagementActions
                  canFork={sessionUser?.login !== repository.owner.login}
                  initialForkCount={repository.forks_count}
                  initialIsStarred={isStarred}
                  initialStarCount={repository.stargazers_count}
                  owner={username}
                  repo={repo}
                />
                <RepositoryActions
                  branch={contentRef}
                  fullName={
                    repository.full_name ??
                    `${repository.owner.login}/${repository.name}`
                  }
                  htmlUrl={repository.html_url}
                />
              </div>
            </div>

            <div className="border-b border-border">
              <div className="flex flex-wrap items-center gap-5">
                <A
                  href={codeTabHref}
                  className={tabLinkClass(currentTab === "code")}
                  data-repo-tab-code
                >
                  <Code className="size-4" />
                  Code
                </A>
                <A
                  href={`/${username}/${repo}?tab=commits${resolvedBranch ? `&branch=${encodeURIComponent(resolvedBranch)}` : ""}`}
                  className={tabLinkClass(currentTab === "commits")}
                  data-repo-tab-commits
                >
                  <GitCommitHorizontal className="size-4" />
                  Commits
                  <span className="text-xs text-muted-foreground">
                    {commitCount}
                  </span>
                </A>
                <A
                  href={`/${username}/${repo}?tab=issues${resolvedBranch ? `&branch=${encodeURIComponent(resolvedBranch)}` : ""}`}
                  className={tabLinkClass(currentTab === "issues")}
                  data-repo-tab-issues
                >
                  <CircleDot className="size-4" />
                  Issues
                  <span className="text-xs text-muted-foreground">
                    {issueCount}
                  </span>
                </A>
                <A
                  href={`/${username}/${repo}?tab=pulls${resolvedBranch ? `&branch=${encodeURIComponent(resolvedBranch)}` : ""}`}
                  className={tabLinkClass(currentTab === "pulls")}
                  data-repo-tab-pulls
                >
                  <GitPullRequest className="size-4" />
                  Pull Requests
                  <span className="text-xs text-muted-foreground">
                    {pullRequestCount}
                  </span>
                </A>
                <A
                  href={`/${username}/${repo}?tab=releases${resolvedBranch ? `&branch=${encodeURIComponent(resolvedBranch)}` : ""}`}
                  className={tabLinkClass(currentTab === "releases")}
                  data-repo-tab-releases
                >
                  <Tag className="size-4" />
                  Releases
                  {latestRelease ? (
                    <span className="text-xs text-muted-foreground">
                      {latestRelease.tag_name}
                    </span>
                  ) : null}
                </A>
                {canManageRepository ? (
                  <A
                    href={`/${username}/${repo}?tab=settings${resolvedBranch ? `&branch=${encodeURIComponent(resolvedBranch)}` : ""}`}
                    className={tabLinkClass(currentTab === "settings")}
                    data-repo-tab-settings
                  >
                    <Settings className="size-4" />
                    Settings
                  </A>
                ) : null}
              </div>
            </div>

            <div className="grid gap-6">
              <section className="space-y-6">
                {currentTab === "code" ? (
                  showRateLimitNotice ? (
                    <Card className="rounded-2xl">
                      <CardContent className="px-5 py-12">
                        <Empty>
                          <EmptyHeader>
                            <EmptyTitle className="text-xl">
                              Rate limit reached
                            </EmptyTitle>
                            <EmptyDescription>
                              GitHub API rate limits were hit.{" "}
                              {rateLimitTime
                                ? `Try again after ${rateLimitTime}.`
                                : "Try again in a few minutes."}
                            </EmptyDescription>
                          </EmptyHeader>
                          <EmptyContent />
                        </Empty>
                      </CardContent>
                    </Card>
                  ) : isOwnedEmptyRepository ? (
                    <EmptyRepositoryInstructions
                      remoteUrl={repository.html_url}
                    />
                  ) : (
                    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
                      <div className="space-y-4">
                        <Card className="self-start rounded-2xl">
                          <CardContent className="p-0">
                            {contents.length > 0 ? (
                              <RepositoryFileTree
                                branch={contentRef}
                                initialContents={contents}
                                owner={username}
                                repo={repo}
                                selectedPath={path}
                              />
                            ) : (
                              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                                No repository contents available.
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {languageDistribution.length > 0 ? (
                          <Card className="rounded-2xl">
                            <CardContent className="space-y-3 px-5 py-4">
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
                            </CardContent>
                          </Card>
                        ) : null}
                      </div>

                      <div className="space-y-6">
                        <RepositoryFilePreview
                          branch={contentRef}
                          canEdit={canEditRepository}
                          owner={username}
                          readme={readme}
                          repo={repo}
                          selectedItem={selectedItem}
                        />
                      </div>
                    </div>
                  )
                ) : null}

                {currentTab === "commits" ? (
                  <Card className="rounded-2xl">
                    <CardHeader className="border-b border-border px-5 py-4">
                      <CardTitle className="flex items-center gap-3 text-base">
                        <GitCommitHorizontal className="size-4" />
                        Commits
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {commits.length > 0 ? (
                        <div className="divide-y divide-border">
                          {commits.map((commit) => (
                            <A
                              key={commit.sha}
                              href={`/${username}/${repo}?commit=${encodeURIComponent(commit.sha)}&branch=${encodeURIComponent(resolvedBranch)}`}
                              className="block px-5 py-4 transition hover:bg-accent/20"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-foreground">
                                    {commit.commit.message.split("\n")[0]}
                                  </div>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {commit.commit.author?.name ?? "Unknown"} ·{" "}
                                    {commit.sha.slice(0, 7)}
                                  </div>
                                </div>
                                <div className="shrink-0 text-xs text-muted-foreground">
                                  {formatRelativeDate(
                                    commit.commit.author?.date ??
                                      repository.updated_at
                                  )}
                                </div>
                              </div>
                            </A>
                          ))}
                        </div>
                      ) : (
                        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                          No commits available for this branch.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                {currentTab === "issues" ? (
                  <Card className="rounded-2xl">
                    <CardHeader className="border-b border-border px-5 py-4">
                      <CardTitle className="flex items-center gap-3 text-base">
                        <CircleDot className="size-4" />
                        Issues
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {issues.length > 0 ? (
                        <div className="divide-y divide-border">
                          {issues.map((issue) => (
                            <A
                              key={issue.number}
                              href={issue.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block px-5 py-4 transition hover:bg-accent/20"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-foreground">
                                    {issue.title}
                                  </div>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    #{issue.number} opened by{" "}
                                    {issue.user?.login ?? "unknown"} ·{" "}
                                    {issue.comments} comments
                                  </div>
                                </div>
                                <Badge variant="outline">{issue.state}</Badge>
                              </div>
                            </A>
                          ))}
                        </div>
                      ) : (
                        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                          No open issues found.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                {currentTab === "pulls" ? (
                  <Card className="rounded-2xl">
                    <CardHeader className="border-b border-border px-5 py-4">
                      <CardTitle className="flex items-center gap-3 text-base">
                        <GitPullRequest className="size-4" />
                        Pull Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {pullRequests.length > 0 ? (
                        <div className="divide-y divide-border">
                          {pullRequests.map((pullRequest) => (
                            <A
                              key={pullRequest.number}
                              href={pullRequest.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block px-5 py-4 transition hover:bg-accent/20"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-foreground">
                                    {pullRequest.title}
                                  </div>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    #{pullRequest.number} opened by{" "}
                                    {pullRequest.user?.login ?? "unknown"} ·{" "}
                                    {pullRequest.comments} comments
                                  </div>
                                </div>
                                <Badge variant="outline">
                                  {pullRequest.state}
                                </Badge>
                              </div>
                            </A>
                          ))}
                        </div>
                      ) : (
                        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                          No open pull requests found.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                {currentTab === "releases" ? (
                  <Card className="rounded-2xl">
                    <CardHeader className="border-b border-border px-5 py-4">
                      <CardTitle className="flex items-center gap-3 text-base">
                        <Tag className="size-4" />
                        Releases
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {releases.length > 0 ? (
                        <div className="divide-y divide-border">
                          {releases.map((release) => (
                            <A
                              key={release.tag_name}
                              href={release.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block px-5 py-4 transition hover:bg-accent/20"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="truncate text-sm font-medium text-foreground">
                                      {release.name || release.tag_name}
                                    </div>
                                    <Badge variant="outline">
                                      {release.tag_name}
                                    </Badge>
                                    {release.prerelease ? (
                                      <Badge variant="secondary">
                                        Pre-release
                                      </Badge>
                                    ) : null}
                                    {release.draft ? (
                                      <Badge variant="secondary">Draft</Badge>
                                    ) : null}
                                  </div>
                                  {release.body ? (
                                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                                      {release.body}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="shrink-0 text-xs text-muted-foreground">
                                  {release.published_at
                                    ? formatRelativeDate(release.published_at)
                                    : "Unpublished"}
                                </div>
                              </div>
                            </A>
                          ))}
                        </div>
                      ) : (
                        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                          No releases published.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                {currentTab === "settings" ? (
                  <RepositorySettingsForm
                    branches={branches}
                    repository={repository}
                  />
                ) : null}
              </section>
            </div>
          </div>
        </main>
      </div>
    </BrowserContextMenu>
  )
}
