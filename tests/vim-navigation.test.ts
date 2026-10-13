import { describe, expect, it, vi } from "vitest"
import {
  createLinkHints,
  getVimAction,
  trackVimHistory,
} from "@/lib/vim-navigation"

function key(key: string, modifiers = {}) {
  return {
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: key === "G" || key === "?",
    ...modifiers,
  }
}

describe("Vim navigation", () => {
  it("maps navigation keys in either case", () => {
    for (const [shortcut, action] of [
      ["h", "back"],
      ["j", "down"],
      ["k", "up"],
      ["l", "forward"],
      ["/", "search"],
      ["f", "hints"],
      ["y", "copy"],
      ["?", "help"],
    ]) {
      expect(getVimAction(key(shortcut), false)).toBe(action)
      expect(getVimAction(key(shortcut.toUpperCase()), false)).toBe(action)
    }
  })

  it("distinguishes gg, G and half-screen shortcuts", () => {
    expect(getVimAction(key("g"), false)).toBe("pending-top")
    expect(getVimAction(key("g"), true)).toBe("top")
    expect(getVimAction(key("G"), true)).toBe("bottom")
    expect(getVimAction(key("d", { ctrlKey: true }), false)).toBe("half-down")
    expect(getVimAction(key("u", { ctrlKey: true }), false)).toBe("half-up")
    expect(getVimAction(key("j"), true)).toBe("down")
  })

  it("preserves unrelated browser and application shortcuts", () => {
    for (const modifiers of [
      { metaKey: true },
      { altKey: true },
      { ctrlKey: true },
      { ctrlKey: true, shiftKey: true },
    ]) {
      expect(getVimAction(key("f", modifiers), false)).toBeNull()
    }
    expect(getVimAction(key("d"), false)).toBeNull()
    expect(getVimAction(key("k", { ctrlKey: true }), false)).toBeNull()
  })

  it("creates unique, prefix-free hint labels across large pages", () => {
    for (const count of [0, 1, 9, 10, 81, 82, 1000]) {
      const labels = createLinkHints(count)
      expect(labels).toHaveLength(count)
      expect(new Set(labels).size).toBe(count)
      expect(new Set(labels.map((label) => label.length)).size).toBe(
        count ? 1 : 0
      )
      expect(labels.every((label) => /^[asdfghjkl]+$/.test(label))).toBe(true)
    }
  })

  it("tracks back/forward availability without losing router state", () => {
    let state: Record<string, unknown> = { __NA: true, tree: ["root"] }
    const listeners = new Map<string, (event: { state: unknown }) => void>()
    const history = {
      get state() {
        return state
      },
      pushState: vi.fn((data) => {
        state = data
      }),
      replaceState: vi.fn((data) => {
        state = data
      }),
    }
    const originalPush = history.pushState
    const browser = {
      history,
      addEventListener: (
        name: string,
        callback: (event: { state: unknown }) => void
      ) => listeners.set(name, callback),
      removeEventListener: (name: string) => listeners.delete(name),
    }
    const tracker = trackVimHistory(browser as unknown as Window)
    const initialState = state
    expect(state.__NA).toBe(true)
    expect(state.tree).toEqual(["root"])
    expect(tracker.canGoForward()).toBe(false)
    history.pushState({ __NA: true, tree: ["repo"] })
    const nextState = state
    listeners.get("popstate")?.({ state: initialState })
    expect(tracker.canGoForward()).toBe(true)
    history.replaceState({ __NA: true, tree: ["updated"] })
    expect(state.__xenonVimIndex).toBe(initialState.__xenonVimIndex)
    listeners.get("popstate")?.({ state: nextState })
    expect(tracker.canGoForward()).toBe(false)
    listeners.get("popstate")?.({ state: initialState })
    history.pushState({ tree: ["new branch"] })
    expect(tracker.canGoForward()).toBe(false)
    tracker.dispose()
    expect(history.pushState).toBe(originalPush)
    expect(listeners.size).toBe(0)
  })

  it("prefers browser navigation availability when available", () => {
    const browser = {
      navigation: { canGoForward: true },
      history: { state: null, pushState: vi.fn(), replaceState: vi.fn() },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    const tracker = trackVimHistory(browser as unknown as Window)
    expect(tracker.canGoForward()).toBe(true)
    browser.navigation.canGoForward = false
    expect(tracker.canGoForward()).toBe(false)
    tracker.dispose()
  })
})
