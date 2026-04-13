"use client"

import { useMemo, useState } from "react"
import { CircleDot, GitCommitHorizontal, GitPullRequest } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProfileActivityItem } from "@/lib/github"
import A from "./A"

type HomeActivityProps = {
  activity: ProfileActivityItem[]
}

function formatRelativeDate(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function HomeActivity({ activity }: HomeActivityProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "commits" | "issues" | "prs"
  >("all")

  const filteredActivity = useMemo(() => {
    if (activeTab === "all") return activity.slice(0, 20)
    if (activeTab === "commits")
      return activity.filter((a) => a.category === "Commits").slice(0, 20)
    if (activeTab === "issues")
      return activity.filter((a) => a.category === "Issues").slice(0, 20)
    if (activeTab === "prs")
      return activity.filter((a) => a.category === "Pull Requests").slice(0, 20)
    return activity.slice(0, 20)
  }, [activity, activeTab])

  const commits = activity.filter((a) => a.category === "Commits")
  const issues = activity.filter((a) => a.category === "Issues")
  const prs = activity.filter((a) => a.category === "Pull Requests")

  if (activity.length === 0) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="px-6 py-16 text-center text-muted-foreground">
          No recent activity found.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-full px-4 py-2 text-sm transition ${
            activeTab === "all" ? "bg-secondary" : "bg-muted hover:bg-muted/80"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("commits")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
            activeTab === "commits"
              ? "bg-secondary"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          <GitCommitHorizontal className="size-4" />
          Commits
          <span className="text-xs text-muted-foreground">
            {commits.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("issues")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
            activeTab === "issues"
              ? "bg-secondary"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          <CircleDot className="size-4" />
          Issues
          <span className="text-xs text-muted-foreground">{issues.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("prs")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
            activeTab === "prs" ? "bg-secondary" : "bg-muted hover:bg-muted/80"
          }`}
        >
          <GitPullRequest className="size-4" />
          PRs
          <span className="text-xs text-muted-foreground">{prs.length}</span>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredActivity.map((item) => (
          <A
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <Card className="transition hover:bg-accent/20">
              <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  {item.category === "Commits" && (
                    <GitCommitHorizontal className="size-4 text-muted-foreground" />
                  )}
                  {item.category === "Issues" && (
                    <CircleDot className="size-4 text-muted-foreground" />
                  )}
                  {item.category === "Pull Requests" && (
                    <GitPullRequest className="size-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {item.category}
                  </span>
                </div>
                {item.status === "open" && (
                  <Badge variant="outline" className="text-xs">
                    Open
                  </Badge>
                )}
                {item.status === "closed" && (
                  <Badge variant="secondary" className="text-xs">
                    Closed
                  </Badge>
                )}
                {item.status === "merged" && (
                  <Badge className="bg-purple-500/20 text-xs text-purple-400">
                    Merged
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm">{item.title}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.repoName} · {formatRelativeDate(item.createdAt)}
                </p>
              </CardContent>
            </Card>
          </A>
        ))}
      </div>
    </div>
  )
}
