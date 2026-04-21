"use client"

import { useMemo, useState, type ReactNode } from "react"
import { ChevronRight } from "lucide-react"

import RepositoryFilePreview from "@/components/RepositoryFilePreview"
import RepositoryFileTree from "@/components/RepositoryFileTree"
import { Card, CardContent } from "@/components/ui/card"
import type {
  GitHubRepositoryContent,
  GitHubRepositoryFilePreview,
  GitHubRepositoryTreeItem,
} from "@/lib/github"

type RepositoryCodeBrowserProps = {
  canEdit: boolean
  commit?: string
  initialContents: GitHubRepositoryContent[]
  languageCard: ReactNode
  owner: string
  preloadedFiles: Record<string, GitHubRepositoryFilePreview>
  previewBranch: string
  readme: {
    htmlUrl: string
    markdown: string
    name: string
    path: string
    sha: string
  } | null
  repo: string
  selectedItem: GitHubRepositoryFilePreview | null
  selectedPath?: string
  treeBranch: string
  treeItems: GitHubRepositoryTreeItem[]
}

export default function RepositoryCodeBrowser({
  canEdit,
  commit,
  initialContents,
  languageCard,
  owner,
  preloadedFiles,
  previewBranch,
  readme,
  repo,
  selectedItem,
  selectedPath,
  treeBranch,
  treeItems,
}: RepositoryCodeBrowserProps) {
  const [instantSelectedPath, setInstantSelectedPath] = useState<string | null>(
    null
  )
  const instantSelectedItem = instantSelectedPath
    ? preloadedFiles[instantSelectedPath]
    : null
  const previewSelectedItem = instantSelectedItem ?? selectedItem
  const activeSelectedPath = instantSelectedPath ?? selectedPath
  const itemCount = useMemo(
    () => treeItems.filter((item) => item.type === "blob").length,
    [treeItems]
  )

  const handleFileSelect = (path: string) => {
    if (preloadedFiles[path]) {
      setInstantSelectedPath(path)
      return true
    }

    return false
  }

  const tree = (
    <RepositoryFileTree
      branch={treeBranch}
      commit={commit}
      initialContents={initialContents}
      onFileSelect={handleFileSelect}
      owner={owner}
      repo={repo}
      selectedPath={activeSelectedPath}
      treeItems={treeItems}
    />
  )

  const preview = (
    <RepositoryFilePreview
      branch={previewBranch}
      canEdit={canEdit}
      owner={owner}
      readme={instantSelectedItem ? null : readme}
      repo={repo}
      selectedItem={previewSelectedItem}
    />
  )

  return (
    <div className="space-y-4 lg:space-y-0">
      <div className="space-y-4 lg:hidden">
        {preview}

        {initialContents.length > 0 || treeItems.length > 0 ? (
          <details
            className="group overflow-hidden rounded-2xl border bg-card shadow-sm"
            open={!previewSelectedItem && !readme}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
              <span>Browse files</span>
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                {previewSelectedItem?.name ?? `${itemCount} files`}
                <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
              </span>
            </summary>
            <div className="border-t border-border/70">{tree}</div>
            {languageCard ? (
              <div className="border-t border-border/70 p-3">{languageCard}</div>
            ) : null}
          </details>
        ) : null}
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          <Card className="self-start rounded-2xl">
            <CardContent className="p-0">
              {initialContents.length > 0 || treeItems.length > 0 ? (
                tree
              ) : (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No repository contents available.
                </div>
              )}
            </CardContent>
          </Card>

          {languageCard}
        </div>

        <div className="space-y-6">{preview}</div>
      </div>
    </div>
  )
}
