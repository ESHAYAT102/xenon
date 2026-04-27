"use client"

import { useEffect } from "react"

type RepoKeyboardShortcutsProps = {
  enabled: boolean
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable
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
      if (event.shiftKey && event.key === "Delete") {
        if (isEditableTarget(event.target)) return

        const deleteRepositoryTrigger = document.querySelector<HTMLElement>(
          "[data-repo-action-delete-repository]"
        )

        if (!deleteRepositoryTrigger?.hasAttribute("disabled")) {
          event.preventDefault()
          deleteRepositoryTrigger?.click()
        }
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isEditableTarget(event.target)) return

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
