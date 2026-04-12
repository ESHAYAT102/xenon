import { NextRequest, NextResponse } from "next/server"

import {
  decodeOAuthState,
  encodeSessionCookie,
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  oauthStateCookieOptions,
  sessionCookieOptions,
  type SessionUser,
} from "@/lib/session"

export const runtime = "nodejs"

type GitHubTokenResponse = {
  access_token?: string
  error?: string
}

type GitHubUserResponse = {
  avatar_url: string | null
  email: string | null
  login: string
  name: string | null
}

type GitHubEmailResponse = Array<{
  email: string
  primary: boolean
  verified: boolean
}>

function redirectWithError(
  request: NextRequest,
  callbackUrl: string,
  error: string
) {
  const url = new URL(callbackUrl, request.nextUrl.origin)
  url.searchParams.set("authError", error)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")
  const stateCookie = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value
  const parsedState = decodeOAuthState(stateCookie)
  const callbackUrl = parsedState?.callbackUrl || "/"

  if (!code || !state || !parsedState || parsedState.state !== state) {
    const response = redirectWithError(request, callbackUrl, "invalid_state")
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", {
      ...oauthStateCookieOptions,
      maxAge: 0,
    })
    return response
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return redirectWithError(request, callbackUrl, "missing_github_env")
  }

  const redirectUri = new URL(
    "/api/auth/github/callback",
    request.nextUrl.origin
  )

  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri.toString(),
        state,
      }),
    }
  )

  const tokenData = (await tokenResponse.json()) as GitHubTokenResponse

  if (!tokenResponse.ok || !tokenData.access_token) {
    return redirectWithError(
      request,
      callbackUrl,
      tokenData.error || "token_exchange_failed"
    )
  }

  const authHeaders = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${tokenData.access_token}`,
    "User-Agent": "OpenHub",
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: authHeaders,
  })

  if (!userResponse.ok) {
    return redirectWithError(request, callbackUrl, "user_fetch_failed")
  }

  const githubUser = (await userResponse.json()) as GitHubUserResponse

  let email = githubUser.email

  if (!email) {
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: authHeaders,
    })

    if (emailResponse.ok) {
      const emails = (await emailResponse.json()) as GitHubEmailResponse
      const primaryEmail = emails.find((item) => item.primary && item.verified)
      email =
        primaryEmail?.email ??
        emails.find((item) => item.verified)?.email ??
        null
    }
  }

  const sessionUser: SessionUser = {
    accessToken: tokenData.access_token,
    email,
    image: githubUser.avatar_url,
    login: githubUser.login,
    name: githubUser.name,
  }

  const response = NextResponse.redirect(
    new URL(callbackUrl, request.nextUrl.origin)
  )
  response.cookies.set(
    SESSION_COOKIE_NAME,
    encodeSessionCookie(sessionUser),
    sessionCookieOptions
  )
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", {
    ...oauthStateCookieOptions,
    maxAge: 0,
  })

  return response
}
