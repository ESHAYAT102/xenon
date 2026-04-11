import { NextResponse } from "next/server"

import { getGitHubNotifications } from "@/lib/github"
import { getSessionUser } from "@/lib/session"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get("unreadOnly") !== "false"
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return NextResponse.json({ notifications: [] })
  }

  const notifications = await getGitHubNotifications(sessionUser, {
    unreadOnly,
  })

  return NextResponse.json({ notifications })
}
