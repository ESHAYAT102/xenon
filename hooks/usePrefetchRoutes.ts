"use client"

import { useEffect } from "react"

export function usePrefetchRoutes(paths: string[]) {
  useEffect(() => {
    if (paths.length === 0) return

    const link = document.createElement("link")
    link.rel = "prefetch"
    link.as = "document"

    let index = 0

    const prefetchNext = () => {
      if (index >= paths.length) return

      const linkEl = document.createElement("link")
      linkEl.rel = "prefetch"
      linkEl.href = paths[index]

      linkEl.onload = () => {
        index++
        prefetchNext()
      }

      linkEl.onerror = () => {
        index++
        prefetchNext()
      }

      document.head.appendChild(linkEl)
    }

    prefetchNext()
  }, [paths])
}
