import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

import { cookies } from "next/headers"

export type SessionUser = {
  accessToken: string
  email: string | null
  image: string | null
  login: string
  name: string | null
}

type SessionPayload = {
  user: SessionUser
}

type OAuthStatePayload = {
  callbackUrl: string
  state: string
}

export const SESSION_COOKIE_NAME = "Xenon_session"
export const OAUTH_STATE_COOKIE_NAME = "Xenon_oauth_state"

const SESSION_MAX_AGE = 60 * 60 * 24 * 30
const OAUTH_STATE_MAX_AGE = 60 * 10

function getSessionSecret() {
  const secret = process.env.NEXTAUTH_SECRET

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required")
  }

  return secret
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url")
}

function verify(value: string, signature: string) {
  const expectedSignature = sign(value)

  return timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(expectedSignature, "utf8")
  )
}

export function encodeSessionCookie(user: SessionUser) {
  const payload = encodeBase64Url(
    JSON.stringify({ user } satisfies SessionPayload)
  )
  const signature = sign(payload)

  return `${payload}.${signature}`
}

export function decodeSessionCookie(cookieValue?: string | null) {
  if (!cookieValue) return null

  const [payload, signature] = cookieValue.split(".")
  if (!payload || !signature) return null
  if (!verify(payload, signature)) return null

  const parsed = JSON.parse(decodeBase64Url(payload)) as SessionPayload
  return parsed.user
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  return decodeSessionCookie(cookieStore.get(SESSION_COOKIE_NAME)?.value)
}

export function createOAuthState(callbackUrl: string) {
  const payload: OAuthStatePayload = {
    callbackUrl,
    state: randomBytes(16).toString("hex"),
  }

  return {
    cookieValue: encodeBase64Url(JSON.stringify(payload)),
    state: payload.state,
  }
}

export function decodeOAuthState(cookieValue?: string | null) {
  if (!cookieValue) return null

  try {
    return JSON.parse(decodeBase64Url(cookieValue)) as OAuthStatePayload
  } catch {
    return null
  }
}

export function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  }
}

export const sessionCookieOptions = getCookieOptions(SESSION_MAX_AGE)
export const oauthStateCookieOptions = getCookieOptions(OAUTH_STATE_MAX_AGE)
