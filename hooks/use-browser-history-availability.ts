"use client"

import { useEffect, useState } from "react"

const HISTORY_INDEX_KEY = "__open_hub_history_index__"
const HISTORY_MAX_KEY = "__open_hub_history_max__"
const HISTORY_STATE_KEY = "__open_hub_history_state_index__"

export function useBrowserHistoryAvailability() {
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  useEffect(() => {
    const readSessionNumber = (key: string) => {
      const value = window.sessionStorage.getItem(key)
      return value ? Number(value) : 0
    }

    const syncAvailability = (index: number, maxIndex: number) => {
      setCanGoBack(index > 0 || window.history.length > 1)
      setCanGoForward(index < maxIndex)
    }

    const originalPushState = window.history.pushState.bind(window.history)
    const originalReplaceState = window.history.replaceState.bind(window.history)

    const writeHistoryState = (index: number) => {
      originalReplaceState(
        { ...(window.history.state ?? {}), [HISTORY_STATE_KEY]: index },
        ""
      )
    }

    const currentStateIndex = window.history.state?.[HISTORY_STATE_KEY]
    const initialIndex =
      typeof currentStateIndex === "number"
        ? currentStateIndex
        : readSessionNumber(HISTORY_INDEX_KEY)
    const initialMaxIndex = Math.max(
      readSessionNumber(HISTORY_MAX_KEY),
      initialIndex
    )

    window.sessionStorage.setItem(HISTORY_INDEX_KEY, String(initialIndex))
    window.sessionStorage.setItem(HISTORY_MAX_KEY, String(initialMaxIndex))

    if (typeof currentStateIndex !== "number") {
      writeHistoryState(initialIndex)
    }

    syncAvailability(initialIndex, initialMaxIndex)

    window.history.pushState = function pushState(data, unused, url) {
      const nextIndex = readSessionNumber(HISTORY_INDEX_KEY) + 1
      window.sessionStorage.setItem(HISTORY_INDEX_KEY, String(nextIndex))
      window.sessionStorage.setItem(HISTORY_MAX_KEY, String(nextIndex))
      syncAvailability(nextIndex, nextIndex)

      return originalPushState(
        { ...(data ?? {}), [HISTORY_STATE_KEY]: nextIndex },
        unused,
        url
      )
    }

    window.history.replaceState = function replaceState(data, unused, url) {
      const index =
        typeof data?.[HISTORY_STATE_KEY] === "number"
          ? data[HISTORY_STATE_KEY]
          : readSessionNumber(HISTORY_INDEX_KEY)

      window.sessionStorage.setItem(HISTORY_INDEX_KEY, String(index))
      syncAvailability(index, readSessionNumber(HISTORY_MAX_KEY))

      return originalReplaceState(
        { ...(data ?? {}), [HISTORY_STATE_KEY]: index },
        unused,
        url
      )
    }

    const handlePopState = (event: PopStateEvent) => {
      const index =
        typeof event.state?.[HISTORY_STATE_KEY] === "number"
          ? event.state[HISTORY_STATE_KEY]
          : readSessionNumber(HISTORY_INDEX_KEY)
      const maxIndex = readSessionNumber(HISTORY_MAX_KEY)

      window.sessionStorage.setItem(HISTORY_INDEX_KEY, String(index))
      syncAvailability(index, maxIndex)
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  return { canGoBack, canGoForward }
}
