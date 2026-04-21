"use client"

import { useState } from "react"
import { PatchDiff } from "@pierre/diffs/react"
import { GitCommitHorizontal } from "lucide-react"

import type {
  GitHubRepositoryCommit,
  GitHubRepositoryCommitDiff,
} from "@/lib/github"
import Loader from "./Loader"

type RepositoryCommitsProps = {
  commits: GitHubRepositoryCommit[]
  owner: string
  repo: string
  repositoryUpdatedAt: string
}

type DiffState =
  | { diff: GitHubRepositoryCommitDiff; status: "loaded" }
  | { status: "error" }
  | { status: "loading" }

export default function RepositoryCommits({
  commits,
  owner,
  repo,
  repositoryUpdatedAt,
}: RepositoryCommitsProps) {
  const [openSha, setOpenSha] = useState<string | null>(null)
  const [diffsBySha, setDiffsBySha] = useState<Record<string, DiffState>>({})

  const loadDiff = async (sha: string) => {
    if (diffsBySha[sha]?.status === "loaded") return

    setDiffsBySha((current) => ({
      ...current,
      [sha]: { status: "loading" },
    }))

    const query = new URLSearchParams({ owner, repo, sha })

    try {
      const response = await fetch(`/api/repository-commit?${query}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Failed to load commit diff")
      }

      const data = (await response.json()) as {
        diff: GitHubRepositoryCommitDiff
      }

      setDiffsBySha((current) => ({
        ...current,
        [sha]: { diff: data.diff, status: "loaded" },
      }))
    } catch {
      setDiffsBySha((current) => ({
        ...current,
        [sha]: { status: "error" },
      }))
    }
  }

  const handleCommitClick = (sha: string) => {
    const nextSha = openSha === sha ? null : sha
    setOpenSha(nextSha)

    if (nextSha) {
      void loadDiff(nextSha)
    }
  }

  if (commits.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-muted-foreground">
        No commits available for this branch.
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {commits.map((commit) => {
        const diffState = diffsBySha[commit.sha]
        const isOpen = openSha === commit.sha

        return (
          <div key={commit.sha}>
            <button
              type="button"
              onClick={() => handleCommitClick(commit.sha)}
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-accent/20"
              aria-expanded={isOpen}
            >
              <div className="flex min-w-0 items-start gap-3">
                <GitCommitHorizontal className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="max-w-[70ch] truncate text-sm font-medium text-foreground">
                    {commit.commit.message.split("\n")[0]}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {commit.commit.author?.name ?? "Unknown"} ·{" "}
                    {commit.sha.slice(0, 7)}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-xs text-muted-foreground">
                {formatRelativeDate(
                  commit.commit.author?.date ?? repositoryUpdatedAt
                )}
              </div>
            </button>

            {isOpen ? (
              <div className="border-t border-border/70 bg-background px-3 py-4 sm:px-5">
                {diffState?.status === "loading" || !diffState ? (
                  <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader className="scale-75" />
                    Loading diff...
                  </div>
                ) : diffState.status === "error" ? (
                  <div className="py-8 text-sm text-muted-foreground">
                    Could not load this commit diff.
                  </div>
                ) : diffState.diff.patch ? (
                  <div className="space-y-4">
                    {diffState.diff.files
                      .filter((file) => file.patch)
                      .map((file) => (
                        <div
                          key={`${file.previousFilename ?? file.filename}:${file.filename}`}
                          className="overflow-hidden rounded-xl border border-border/80"
                        >
                          <PatchDiff
                            patch={buildFilePatch(file)}
                            options={{
                              diffStyle: "unified",
                              hunkSeparators: "line-info-basic",
                              overflow: "wrap",
                              themeType: "system",
                            }}
                          />
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-8 text-sm text-muted-foreground">
                    No text patch is available for this commit.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function buildFilePatch(file: GitHubRepositoryCommitDiff["files"][number]) {
  const previousPath = file.previousFilename ?? file.filename
  const oldPath = file.status === "added" ? "/dev/null" : `a/${previousPath}`
  const newPath = file.status === "removed" ? "/dev/null" : `b/${file.filename}`

  return [
    `diff --git a/${previousPath} b/${file.filename}`,
    file.status === "renamed"
      ? `rename from ${previousPath}\nrename to ${file.filename}`
      : null,
    `--- ${oldPath}`,
    `+++ ${newPath}`,
    file.patch,
  ]
    .filter(Boolean)
    .join("\n")
}

function formatRelativeDate(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const days = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)))

  if (days < 2) return "today"
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} mo ago`
  return `${Math.floor(months / 12)} yr ago`
}