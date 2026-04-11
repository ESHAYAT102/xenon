"use client"

import { useState } from "react"
import { Activity, FolderGit2 } from "lucide-react"

import ProfileActivityTimeline from "@/components/ProfileActivityTimeline"
import ProfileRepositories from "@/components/ProfileRepositories"
import { Button } from "@/components/ui/button"
import type { GitHubRepository, ProfileActivityItem } from "@/lib/github"

type ProfileContentTabsProps = {
  activity: ProfileActivityItem[]
  repositories: GitHubRepository[]
  starredRepositories?: GitHubRepository[]
}

export default function ProfileContentTabs({
  activity,
  repositories,
  starredRepositories = [],
}: ProfileContentTabsProps) {
  const [activeTab, setActiveTab] = useState<"repositories" | "activity">(
    "repositories"
  )

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-border bg-card p-1">
        <Button
          variant={activeTab === "repositories" ? "secondary" : "ghost"}
          size="sm"
          className="rounded-lg"
          onClick={() => setActiveTab("repositories")}
        >
          <FolderGit2 />
          Repositories
        </Button>
        <Button
          variant={activeTab === "activity" ? "secondary" : "ghost"}
          size="sm"
          className="rounded-lg"
          onClick={() => setActiveTab("activity")}
        >
          <Activity />
          Activity
        </Button>
      </div>

      {activeTab === "repositories" ? (
        <ProfileRepositories
          compact
          repositories={repositories}
          starredRepositories={starredRepositories}
        />
      ) : (
        <ProfileActivityTimeline activity={activity} />
      )}
    </div>
  )
}
