"use client"

import { useEffect } from "react"

type RepoKeyboardShortcutsProps = {
  enabled: boolean
}

function isEditableElement(element: HTMLElement) {
  const tag = element.tagName

  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    element.isContentEditable ||
    element.getAttribute("contenteditable") === "true" ||
    element.getAttribute("role") === "textbox"
  )
}

function isEditableTarget(event: KeyboardEvent) {
  const path = event.composedPath()

  for (const target of path) {
    if (!(target instanceof HTMLElement)) continue
    if (isEditableElement(target)) return true

    const editableAncestor = target.closest(
      "input, textarea, select, [contenteditable='true'], [role='textbox']"
    )

    if (editableAncestor) return true
  }

  return false
}

function triggerByDataAttribute(attr: string) {
  const element = document.querySelector<HTMLElement>(`[${attr}]`)
  element?.click()
}

export default function RepoKeyboardShortcuts({
  enabled,
}: RepoKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isEditableTarget(event)) return

      switch (event.key.toLowerCase()) {
        case "s":
          event.preventDefault()
          triggerByDataAttribute("data-repo-action-star")
          break
        case "f":
          event.preventDefault()
          triggerByDataAttribute("data-repo-action-fork")
          break
        case "c":
          event.preventDefault()
          triggerByDataAttribute("data-repo-action-copy-url")
          break
        case "i":
          event.preventDefault()
          triggerByDataAttribute("data-repo-action-download-zip")
          break
        case "1":
          event.preventDefault()
          triggerByDataAttribute("data-repo-tab-code")
          break
        case "2":
          event.preventDefault()
          triggerByDataAttribute("data-repo-tab-commits")
          break
        case "3":
          event.preventDefault()
          triggerByDataAttribute("data-repo-tab-issues")
          break
        case "4":
          event.preventDefault()
          triggerByDataAttribute("data-repo-tab-pulls")
          break
        case "5":
          event.preventDefault()
          triggerByDataAttribute("data-repo-tab-releases")
          break
        case "6":
          event.preventDefault()
          triggerByDataAttribute("data-repo-tab-settings")
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [enabled])

  return null
}
