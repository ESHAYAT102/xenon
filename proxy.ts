import { NextResponse, type NextRequest } from "next/server"

type AcceptedType = {
  mediaType: string
  order: number
  q: number
  specificity: number
}

const NEGOTIABLE_TYPES = ["text/html", "text/markdown"]

function parseAcceptHeader(value: string | null): AcceptedType[] {
  if (!value) {
    return [{ mediaType: "*/*", order: 0, q: 1, specificity: 0 }]
  }

  return value
    .split(",")
    .map((part, order) => {
      const [mediaRange, ...parameters] = part.trim().split(";")
      const qParameter = parameters.find((parameter) =>
        parameter.trim().startsWith("q=")
      )
      const q = qParameter ? Number(qParameter.trim().slice(2)) : 1
      const mediaType = mediaRange.trim().toLowerCase()
      const specificity =
        mediaType === "*/*" ? 0 : mediaType.endsWith("/*") ? 1 : 2

      return {
        mediaType,
        order,
        q: Number.isFinite(q) ? q : 0,
        specificity,
      }
    })
    .filter((item) => item.q > 0)
    .sort(
      (a, b) => b.q - a.q || b.specificity - a.specificity || a.order - b.order
    )
}

function mediaRangeMatches(range: string, mediaType: string) {
  if (range === "*/*") return true
  if (range === mediaType) return true

  const [rangeType, rangeSubtype] = range.split("/")
  const [type] = mediaType.split("/")

  return rangeSubtype === "*" && rangeType === type
}

function chooseRepresentation(accept: string | null) {
  const accepted = parseAcceptHeader(accept)

  for (const item of accepted) {
    const match = NEGOTIABLE_TYPES.find((mediaType) =>
      mediaRangeMatches(item.mediaType, mediaType)
    )

    if (match) return match
  }

  return null
}

function shouldNegotiate(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/agent-markdown") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/.well-known") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    pathname === "/openapi.json"
  ) {
    return false
  }

  return !/\.[a-z0-9]+$/i.test(pathname)
}

function discoveryLinks(request: NextRequest) {
  const url = request.nextUrl
  const markdownUrl = new URL(url.pathname + url.search, url.origin)

  return [
    `<${markdownUrl.toString()}>; rel="alternate"; type="text/markdown"`,
    `</llms.txt>; rel="alternate"; type="text/plain"; title="LLM index"`,
    `</llms-full.txt>; rel="alternate"; type="text/plain"; title="Full LLM context"`,
    `</.well-known/agent-skills/index.json>; rel="service-desc"; type="application/json"`,
    `</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"`,
  ].join(", ")
}

export function proxy(request: NextRequest) {
  if (!shouldNegotiate(request)) {
    return NextResponse.next()
  }

  const representation = chooseRepresentation(request.headers.get("accept"))

  if (!representation) {
    return new NextResponse("Not Acceptable", {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Vary: "Accept",
      },
    })
  }

  if (representation === "text/markdown") {
    const rewriteUrl = new URL("/agent-markdown", request.url)
    rewriteUrl.search = request.nextUrl.search
    rewriteUrl.searchParams.set("xenon_path", request.nextUrl.pathname)

    return NextResponse.rewrite(rewriteUrl, {
      headers: {
        "Content-Signal": "ai-input=yes, search=yes, ai-train=no",
        Link: discoveryLinks(request),
        Vary: "Accept",
      },
    })
  }

  const response = NextResponse.next({
    headers: {
      Vary: "Accept",
    },
  })
  response.headers.set(
    "Content-Signal",
    "ai-input=yes, search=yes, ai-train=no"
  )
  response.headers.set("Link", discoveryLinks(request))
  response.headers.set("Vary", "Accept")

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
