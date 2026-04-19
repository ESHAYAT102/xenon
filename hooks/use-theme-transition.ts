"use client"

import { useCallback } from "react"
import { useTheme } from "next-themes"

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => void
}

function applyThemeClass(theme: string) {
  const root = document.documentElement

  root.classList.remove("light", "dark")
  root.classList.add(theme)
  root.style.colorScheme = theme
}

function shouldSkipViewTransition() {
  return (
    !("startViewTransition" in document) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

function getNextTheme(resolvedTheme?: string) {
  return resolvedTheme === "dark" ? "light" : "dark"
}

export function useThemeTransition() {
  const { resolvedTheme, setTheme } = useTheme()

  const setThemeWithTransition = useCallback(
    (nextTheme: "light" | "dark") => {
      if (shouldSkipViewTransition()) {
        setTheme(nextTheme)
        return
      }

      const transitionDocument = document as ViewTransitionDocument

      transitionDocument.startViewTransition?.(() => {
        applyThemeClass(nextTheme)
        setTheme(nextTheme)
      })
    },
    [setTheme]
  )

  const toggleTheme = useCallback(() => {
    const nextTheme = getNextTheme(resolvedTheme)
    setThemeWithTransition(nextTheme)
    return nextTheme
  }, [resolvedTheme, setThemeWithTransition])

  return {
    resolvedTheme,
    setThemeWithTransition,
    toggleTheme,
  }
}
