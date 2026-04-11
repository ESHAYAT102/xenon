"use client"

import type { PropsWithChildren, MouseEvent } from "react"

export default function DisableNativeContextMenu({
  children,
}: PropsWithChildren) {
  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <div className="min-h-screen" onContextMenu={handleContextMenu}>
      {children}
    </div>
  )
}
