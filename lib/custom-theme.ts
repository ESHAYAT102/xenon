import { getThemeMode, THEME_IDS } from "@/lib/themes"

export const CUSTOM_THEME_STORAGE_KEY = "xenon-custom-theme"

const COLOR_KEYS = [
  "accent",
  "selection",
  "muted",
  "background",
  "dark_background",
  "darker_background",
  "lighter_background",
  "foreground",
  "dark_foreground",
  "light_foreground",
  "bright_foreground",
  "red",
  "yellow",
  "orange",
  "green",
  "cyan",
  "blue",
  "magenta",
  "brown",
  "bright_red",
  "bright_yellow",
  "bright_green",
  "bright_cyan",
  "bright_blue",
  "bright_magenta",
] as const

type ColorKey = (typeof COLOR_KEYS)[number]

export type CustomTheme = {
  mode: "light" | "dark"
  name: string
  source: string
  vars: Record<string, string>
}

export function parseCustomTheme(source: string, name = "Custom theme") {
  const values: Partial<Record<ColorKey | "mode", string>> = {}
  const allowedKeys = new Set<string>(["mode", ...COLOR_KEYS])

  for (const [index, rawLine] of source.split(/\r?\n/).entries()) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const match = line.match(/^([a-z_]+)\s*=\s*"([^"]+)"\s*(?:#.*)?$/)
    if (!match || !allowedKeys.has(match[1])) {
      throw new Error(`Invalid theme entry on line ${index + 1}.`)
    }

    if (values[match[1] as ColorKey | "mode"] !== undefined) {
      throw new Error(`Duplicate theme entry: ${match[1]}.`)
    }

    values[match[1] as ColorKey | "mode"] = match[2]
  }

  if (values.mode !== "light" && values.mode !== "dark") {
    throw new Error('Theme mode must be "light" or "dark".')
  }

  const missing = COLOR_KEYS.filter((key) => !values[key])
  if (missing.length) {
    throw new Error(`Missing theme colors: ${missing.join(", ")}.`)
  }

  for (const key of COLOR_KEYS) {
    if (!/^#[0-9a-f]{6}$/i.test(values[key]!)) {
      throw new Error(`${key} must be a six-digit hex color.`)
    }
  }

  const color = values as Record<ColorKey, string> & {
    mode: "light" | "dark"
  }

  return {
    mode: color.mode,
    name,
    source,
    vars: {
      "--background": color.background,
      "--foreground": color.foreground,
      "--card": color.dark_background,
      "--card-foreground": color.foreground,
      "--popover": color.dark_background,
      "--popover-foreground": color.foreground,
      "--primary": color.accent,
      "--primary-foreground": color.background,
      "--secondary": color.lighter_background,
      "--secondary-foreground": color.foreground,
      "--muted": color.lighter_background,
      "--muted-foreground": color.dark_foreground,
      "--accent": color.selection,
      "--accent-foreground": color.foreground,
      "--destructive": color.red,
      "--border": color.muted,
      "--input": color.lighter_background,
      "--ring": color.accent,
      "--chart-1": color.accent,
      "--chart-2": color.blue,
      "--chart-3": color.green,
      "--chart-4": color.yellow,
      "--chart-5": color.magenta,
      "--sidebar": color.dark_background,
      "--sidebar-foreground": color.foreground,
      "--sidebar-primary": color.accent,
      "--sidebar-primary-foreground": color.background,
      "--sidebar-accent": color.lighter_background,
      "--sidebar-accent-foreground": color.foreground,
      "--sidebar-border": color.muted,
      "--sidebar-ring": color.accent,
      "--selection-background": color.selection,
      "--selection-foreground": color.foreground,
    },
  } satisfies CustomTheme
}

export function applyCustomTheme(theme: CustomTheme) {
  const root = document.documentElement
  root.dataset.customTheme = theme.mode
  root.style.colorScheme = theme.mode
  Object.entries(theme.vars).forEach(([property, value]) =>
    root.style.setProperty(property, value)
  )
}

export function removeCustomTheme(theme: CustomTheme) {
  const root = document.documentElement
  delete root.dataset.customTheme
  Object.keys(theme.vars).forEach((property) =>
    root.style.removeProperty(property)
  )
  const themeId = THEME_IDS.find((id) => root.classList.contains(id))
  root.style.colorScheme = getThemeMode(themeId)
}

export const CUSTOM_THEME_SCRIPT = `try{const t=JSON.parse(localStorage.getItem(${JSON.stringify(
  CUSTOM_THEME_STORAGE_KEY
)})||"null");if(t&&["light","dark"].includes(t.mode)&&t.vars){const r=document.documentElement;r.dataset.customTheme=t.mode;r.style.colorScheme=t.mode;Object.entries(t.vars).forEach(([k,v])=>{if(k.startsWith("--")&&typeof v==="string")r.style.setProperty(k,v)})}}catch{}`
