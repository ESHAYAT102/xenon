"use client"

import { useVimMode } from "@/components/VimNavigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function NavigationSettings() {
  const { enabled, toggle, openHelp } = useVimMode()

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Keyboard navigation</CardTitle>
        <CardDescription>
          Preferences are saved in this browser and apply immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <label htmlFor="vim-mode-setting" className="text-sm font-medium">
              Vim mode
            </label>
            <p
              id="vim-mode-description"
              className="text-sm text-muted-foreground"
            >
              Navigate with h/j/k/l, scroll smoothly, and follow links with
              hints. Shortcuts pause while typing or using menus.
            </p>
          </div>
          <input
            id="vim-mode-setting"
            type="checkbox"
            role="switch"
            checked={enabled}
            onChange={toggle}
            aria-describedby="vim-mode-description"
            className="size-5 shrink-0 accent-primary"
          />
        </div>
        <Button variant="outline" onClick={openHelp}>
          View Vim keybindings
        </Button>
      </CardContent>
    </Card>
  )
}
