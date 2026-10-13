"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  createLinkHints,
  getVimAction,
  isVimTypingTarget,
  trackVimHistory,
  VIM_SEARCH_EVENT,
  VIM_STORAGE_KEY,
} from "@/lib/vim-navigation"

const preferenceEvent = "xenon:vim-mode-changed"
let fallbackPreference = false

function readPreference() {
  try {
    return localStorage.getItem(VIM_STORAGE_KEY) === "true"
  } catch {
    return fallbackPreference
  }
}

function subscribePreference(callback: () => void) {
  window.addEventListener(preferenceEvent, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(preferenceEvent, callback)
    window.removeEventListener("storage", callback)
  }
}

const VimContext = createContext({
  enabled: false,
  openHelp: () => {},
  toggle: () => {},
})
export const useVimMode = () => useContext(VimContext)

type LinkHint = {
  label: string
  element: HTMLAnchorElement
  top: number
  left: number
}

const shortcuts = [
  ["h / H", "Go back"],
  ["j / J", "Scroll down"],
  ["k / K", "Scroll up"],
  ["l / L", "Go forward, if available"],
  ["gg / G", "Jump to top / bottom"],
  ["Ctrl+d / Ctrl+u", "Scroll down / up half a screen"],
  ["/", "Search repositories and users"],
  ["f", "Show link hints; type a hint to follow"],
  ["y", "Copy the current page URL"],
  ["Esc", "Leave search, dismiss a menu, or cancel hints"],
  ["?", "Show this help"],
]

export default function VimNavigation({
  children,
}: {
  children: React.ReactNode
}) {
  const enabled = useSyncExternalStore(
    subscribePreference,
    readPreference,
    () => false
  )
  const [helpOpen, setHelpOpen] = useState(false)
  const [hints, setHints] = useState<LinkHint[]>([])
  const [hintPrefix, setHintPrefix] = useState("")
  const [message, setMessage] = useState("")
  const historyRef = useRef<ReturnType<typeof trackVimHistory> | null>(null)

  useEffect(() => {
    const history = trackVimHistory(window)
    historyRef.current = history
    return () => history.dispose()
  }, [])

  useEffect(() => {
    if (!message) return
    const timeout = window.setTimeout(() => setMessage(""), 2500)
    return () => window.clearTimeout(timeout)
  }, [message])

  useEffect(() => {
    if (!enabled) return
    let pendingTopUntil = 0
    let activeHints: LinkHint[] = []
    let prefix = ""
    const clear = () => {
      pendingTopUntil = 0
      activeHints = []
      prefix = ""
      setHints([])
      setHintPrefix("")
    }
    const claim = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    const hasOverlay = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '[role="dialog"], [role="alertdialog"], [role="menu"][data-state="open"], [data-slot="context-menu-content"][data-state="open"], [data-slot="popover-content"][data-state="open"], dialog[open]'
        )
      ).some((element) => {
        if (
          element.dataset.state === "closed" ||
          element.closest('[hidden], [aria-hidden="true"]')
        )
          return false
        const style = window.getComputedStyle(element)
        return (
          element.getClientRects().length > 0 &&
          style.visibility === "visible" &&
          style.display !== "none"
        )
      })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return
      if (event.key === "Escape") {
        if (activeHints.length) {
          claim(event)
          clear()
        } else if (!hasOverlay() && isVimTypingTarget(event.target)) {
          claim(event)
          if (document.activeElement instanceof HTMLElement)
            document.activeElement.blur()
        }
        return
      }
      if (isVimTypingTarget(event.target) || hasOverlay()) {
        pendingTopUntil = 0
        return
      }
      if (activeHints.length) {
        if (
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          event.key.length !== 1
        ) {
          clear()
          return
        }
        claim(event)
        if (event.repeat) return
        prefix += event.key.toLowerCase()
        const matching = activeHints.filter((hint) =>
          hint.label.startsWith(prefix)
        )
        const selected = matching.find((hint) => hint.label === prefix)
        if (selected) {
          clear()
          if (selected.element.isConnected) {
            selected.element.focus({ preventScroll: true })
            selected.element.click()
          }
        } else if (!matching.length) {
          clear()
        } else {
          setHintPrefix(prefix)
        }
        return
      }
      const action = getVimAction(event, Date.now() < pendingTopUntil)
      if (!action) {
        pendingTopUntil = 0
        return
      }
      claim(event)
      if (
        event.repeat &&
        !["up", "down", "half-up", "half-down"].includes(action)
      )
        return
      pendingTopUntil = action === "pending-top" ? Date.now() + 750 : 0
      switch (action) {
        case "back":
          if (window.history.length > 1) window.history.back()
          break
        case "forward":
          if (historyRef.current?.canGoForward()) window.history.forward()
          break
        case "down":
        case "up":
        case "half-down":
        case "half-up":
          window.scrollBy({
            top:
              (action.startsWith("half") ? window.innerHeight / 2 : 80) *
              (action.endsWith("up") ? -1 : 1),
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
          })
          break
        case "top":
        case "bottom":
          window.scrollTo({
            top: action === "top" ? 0 : document.documentElement.scrollHeight,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
          })
          break
        case "search":
          window.dispatchEvent(new Event(VIM_SEARCH_EVENT))
          break
        case "hints": {
          const links = Array.from(
            document.querySelectorAll<HTMLAnchorElement>("a[href]")
          ).filter((link) => {
            const rect = link.getBoundingClientRect()
            if (
              !rect.width ||
              !rect.height ||
              rect.bottom <= 0 ||
              rect.top >= window.innerHeight ||
              rect.right <= 0 ||
              rect.left >= window.innerWidth ||
              link.closest('[inert], [aria-hidden="true"]') ||
              link.getAttribute("aria-disabled") === "true"
            )
              return false
            const style = window.getComputedStyle(link)
            if (style.visibility !== "visible" || style.opacity === "0")
              return false
            const hit = document.elementFromPoint(
              Math.max(
                0,
                Math.min(window.innerWidth - 1, rect.left + rect.width / 2)
              ),
              Math.max(
                0,
                Math.min(window.innerHeight - 1, rect.top + rect.height / 2)
              )
            )
            return Boolean(hit && link.contains(hit))
          })
          const labels = createLinkHints(links.length)
          activeHints = links.map((element, index) => {
            const rect = element.getBoundingClientRect()
            return {
              element,
              label: labels[index],
              top: Math.max(0, rect.top),
              left: Math.max(0, Math.min(window.innerWidth - 48, rect.left)),
            }
          })
          setHints(activeHints)
          setHintPrefix("")
          if (!activeHints.length) setMessage("No visible links to follow")
          break
        }
        case "copy":
          void (async () => {
            try {
              await navigator.clipboard.writeText(window.location.href)
              setMessage("Page URL copied")
            } catch {
              setMessage("Could not copy the URL. Check clipboard permissions.")
            }
          })()
          break
        case "help":
          setHelpOpen(true)
          break
      }
    }
    window.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("scroll", clear, true)
    window.addEventListener("resize", clear)
    window.addEventListener("popstate", clear)
    window.addEventListener("pointerdown", clear)
    window.addEventListener("blur", clear)
    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
      window.removeEventListener("scroll", clear, true)
      window.removeEventListener("resize", clear)
      window.removeEventListener("popstate", clear)
      window.removeEventListener("pointerdown", clear)
      window.removeEventListener("blur", clear)
    }
  }, [enabled])

  const toggle = () => {
    fallbackPreference = !enabled
    try {
      localStorage.setItem(VIM_STORAGE_KEY, String(!enabled))
    } catch {}
    setHints([])
    setHelpOpen(false)
    setMessage(
      enabled
        ? "Vim mode disabled"
        : "Vim mode enabled. Press ? for keybindings."
    )
    window.dispatchEvent(new Event(preferenceEvent))
  }

  return (
    <VimContext.Provider
      value={{ enabled, openHelp: () => setHelpOpen(true), toggle }}
    >
      {children}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vim navigation</DialogTitle>
            <DialogDescription>
              Optional keyboard navigation. Shortcuts pause while typing or when
              a dialog or menu is open.
            </DialogDescription>
          </DialogHeader>
          <Button
            variant={enabled ? "default" : "outline"}
            aria-pressed={enabled}
            onClick={toggle}
          >
            {enabled ? "Disable Vim mode" : "Enable Vim mode"}
          </Button>
          <dl className="space-y-3">
            {shortcuts.map(([key, description]) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <dt>
                  <kbd className="rounded bg-muted px-1.5 py-1 font-mono text-xs whitespace-nowrap">
                    {key}
                  </kbd>
                </dt>
                <dd className="text-right text-sm text-muted-foreground">
                  {description}
                </dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
      {enabled &&
        hints
          .filter((hint) => hint.label.startsWith(hintPrefix))
          .map((hint) => (
            <span
              key={hint.label}
              aria-hidden="true"
              className="pointer-events-none fixed z-[100] rounded border border-foreground bg-background px-1.5 py-0.5 font-mono text-xs font-bold text-foreground shadow-sm"
              style={{ top: hint.top, left: hint.left }}
            >
              {hint.label}
            </span>
          ))}
      <div
        role="status"
        className={
          message
            ? "pointer-events-none fixed bottom-4 left-1/2 z-[100] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg"
            : "sr-only"
        }
      >
        {message}
      </div>
    </VimContext.Provider>
  )
}
