"use client"

import { useCallback } from "react"
import { useTheme } from "next-themes"

import {
  THEME_CLASS_NAMES,
  getPairedThemeId,
  getThemeMode,
  type ThemeId,
} from "@/lib/themes"

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => void
}

function applyThemeClass(theme: string) {
  const root = document.documentElement
  const mode = getThemeMode(theme)

  root.classList.remove(...THEME_CLASS_NAMES)
  root.classList.add(theme)
  root.style.colorScheme = mode
}

function shouldSkipViewTransition() {
  return (
    !("startViewTransition" in document) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

export function useThemeTransition() {
  const { resolvedTheme, setTheme, theme } = useTheme()

  const setThemeWithTransition = useCallback(
    (nextTheme: ThemeId) => {
      if (shouldSkipViewTransition()) {
        setTheme(nextTheme)
        document.documentElement.style.colorScheme = getThemeMode(nextTheme)
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
    const nextTheme = getPairedThemeId(theme === "system" ? resolvedTheme : theme)
    setThemeWithTransition(nextTheme)
    return nextTheme
  }, [resolvedTheme, setThemeWithTransition, theme])

  return {
    theme,
    resolvedTheme,
    setThemeWithTransition,
    toggleTheme,
  }
}
