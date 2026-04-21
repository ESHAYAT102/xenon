import { NextRequest, NextResponse } from "next/server"

import { getGitHubRepositoryCommitDiff } from "@/lib/github"
import { getSessionUser } from "@/lib/session"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const owner = request.nextUrl.searchParams.get("owner")
  const repo = request.nextUrl.searchParams.get("repo")
  const sha = request.nextUrl.searchParams.get("sha")

  if (!owner || !repo || !sha) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 })
  }

  const sessionUser = await getSessionUser()
  const diff = await getGitHubRepositoryCommitDiff(
    owner,
    repo,
    sessionUser,
    sha
  )

  return NextResponse.json({ diff })
}
