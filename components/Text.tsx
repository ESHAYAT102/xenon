"use client"

import * as React from "react"
import { Copy } from "lucide-react"

import BrowserContextMenu from "@/components/BrowserContextMenu"
import { ContextMenuGroup, ContextMenuItem } from "@/components/ui/context-menu"

type TextProps = {
  children: React.ReactNode
  className?: string
}

export default function Text({ children, className }: TextProps) {
  const copyText = async () => {
    const selection = window.getSelection()
    if (selection && selection.toString()) {
      await navigator.clipboard.writeText(selection.toString())
    }
  }

  return (
    <BrowserContextMenu
      triggerClassName={className}
      menuChildren={
        <>
          <ContextMenuGroup>
            <ContextMenuItem onClick={copyText}>
              <Copy />
              Copy
            </ContextMenuItem>
          </ContextMenuGroup>
        </>
      }
    >
      {children}
    </BrowserContextMenu>
  )
}
