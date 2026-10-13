export const VIM_STORAGE_KEY = "xenon:vim-mode"
export const VIM_SEARCH_EVENT = "xenon:vim-search"

export function createLinkHints(count: number) {
  const alphabet = "asdfghjkl"
  const width = Math.max(
    1,
    Math.ceil(Math.log(Math.max(1, count)) / Math.log(alphabet.length))
  )
  return Array.from({ length: count }, (_, index) => {
    let label = ""
    for (let position = 0; position < width; position += 1) {
      label = alphabet[index % alphabet.length] + label
      index = Math.floor(index / alphabet.length)
    }
    return label
  })
}

export function isVimTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      Boolean(
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]'
        )
      ))
  )
}

export type VimAction =
  | "back"
  | "forward"
  | "down"
  | "up"
  | "half-down"
  | "half-up"
  | "top"
  | "bottom"
  | "pending-top"
  | "search"
  | "hints"
  | "copy"
  | "help"

export function getVimAction(
  event: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey"
  >,
  pendingTop: boolean
): VimAction | null {
  if (event.metaKey || event.altKey) return null
  const key = event.key.toLowerCase()
  if (event.ctrlKey) {
    if (event.shiftKey) return null
    return key === "d" ? "half-down" : key === "u" ? "half-up" : null
  }
  if (event.key === "G") return "bottom"
  if (event.key === "g") return pendingTop ? "top" : "pending-top"
  if (event.key === "?") return "help"
  const actions: Record<string, VimAction> = {
    h: "back",
    j: "down",
    k: "up",
    l: "forward",
    "/": "search",
    f: "hints",
    y: "copy",
  }
  return actions[key] ?? null
}

export function trackVimHistory(browser: Window) {
  const history = browser.history
  const marker = "__xenonVimIndex"
  let index =
    typeof history.state?.[marker] === "number" ? history.state[marker] : 0
  let maximum = index
  const push = history.pushState
  const replace = history.replaceState
  replace.call(history, { ...history.state, [marker]: index }, "")
  const trackedPush: History["pushState"] = function (data, unused, url) {
    push.call(history, { ...data, [marker]: index + 1 }, unused, url)
    index += 1
    maximum = index
  }
  const trackedReplace: History["replaceState"] = function (data, unused, url) {
    replace.call(history, { ...data, [marker]: index }, unused, url)
  }
  history.pushState = trackedPush
  history.replaceState = trackedReplace
  const onPopState = (event: PopStateEvent) => {
    if (typeof event.state?.[marker] === "number") index = event.state[marker]
  }
  browser.addEventListener("popstate", onPopState)
  return {
    canGoForward: () => {
      const navigation = (
        browser as Window & { navigation?: { canGoForward: boolean } }
      ).navigation
      return navigation?.canGoForward ?? index < maximum
    },
    dispose: () => {
      browser.removeEventListener("popstate", onPopState)
      if (history.pushState === trackedPush) history.pushState = push
      if (history.replaceState === trackedReplace)
        history.replaceState = replace
    },
  }
}
