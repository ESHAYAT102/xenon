import { unstable_cache } from "next/cache"

import type { Activity } from "@/components/contribution-graph"

type GitHubContributionsResponse = {
  contributions?: Activity[]
}

type GitHubGraphQLContributionsResponse = {
  errors?: unknown[]
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          weeks?: Array<{
            contributionDays?: Array<{
              contributionCount: number
              contributionLevel: string
              date: string
            }>
          }>
        }
      }
    } | null
  }
}

function isActivity(value: unknown): value is Activity {
  if (!value || typeof value !== "object") {
    return false
  }

  const activity = value as Partial<Activity>
  return (
    typeof activity.date === "string" &&
    typeof activity.count === "number" &&
    typeof activity.level === "number"
  )
}

export const getCachedContributions = unstable_cache(
  async (username: string) => {
    try {
      const baseUrl =
        process.env.GITHUB_CONTRIBUTIONS_API_URL ||
        "https://github-contributions-api.jogruber.de"
      const year = new Date().getFullYear()
      const response = await fetch(`${baseUrl}/v4/${username}?y=${year}`)

      if (!response.ok) {
        return []
      }

      const data = (await response.json()) as GitHubContributionsResponse
      return (data.contributions ?? []).filter(isActivity)
    } catch {
      return []
    }
  },
  ["github-contributions"],
  { revalidate: 86_400 }
)

export async function getGitHubContributions(
  username: string,
  accessToken?: string
) {
  if (!accessToken) return getCachedContributions(username)

  try {
    const now = new Date()
    const from = new Date(now)
    from.setFullYear(from.getFullYear() - 1)
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query:
          "query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{weeks{contributionDays{date contributionCount contributionLevel}}}}}}",
        variables: { from: from.toISOString(), login: username, to: now.toISOString() },
      }),
      cache: "no-store",
    })

    if (!response.ok) return getCachedContributions(username)

    const data = (await response.json()) as GitHubGraphQLContributionsResponse
    const weeks =
      data.data?.user?.contributionsCollection?.contributionCalendar?.weeks
    if (data.errors?.length || !weeks) return getCachedContributions(username)
    const days = weeks.flatMap((week) => week.contributionDays ?? [])
    const levels: Record<string, number> = {
      NONE: 0,
      FIRST_QUARTILE: 1,
      SECOND_QUARTILE: 2,
      THIRD_QUARTILE: 3,
      FOURTH_QUARTILE: 4,
    }

    return days.map((day) => ({
      count: day.contributionCount,
      date: day.date,
      level: levels[day.contributionLevel] ?? 0,
    }))
  } catch {
    return getCachedContributions(username)
  }
}
