"use client"

import { useEffect } from "react"

export function usePrefetchRoutes(paths: string[]) {
  const pathsKey = paths.join("\n")

  useEffect(() => {
    if (!pathsKey) return
    const routes = pathsKey.split("\n")

    let cancelled = false
    let index = 0
    const start = () => {
      if (cancelled) return
      const prefetchNext = () => {
        if (cancelled || index >= routes.length) return

        const linkEl = document.createElement("link")
        linkEl.rel = "prefetch"
        linkEl.href = routes[index]

        linkEl.onload = linkEl.onerror = () => {
          index++
          prefetchNext()
        }

        document.head.appendChild(linkEl)
      }

      prefetchNext()
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      observer.disconnect()
      start()
    })
    const target = document.querySelector("main")
    if (target) observer.observe(target)

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [pathsKey])
}
