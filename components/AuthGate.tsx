"use client"

import type { PropsWithChildren } from "react"

import { useAuth } from "@/components/AuthProvider"
import { LoginForm } from "@/components/login-form"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export default function AuthGate({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth()

  return (
    <>
      {children}
      <Dialog open={!isAuthenticated}>
        <DialogContent
          className="max-w-sm border-none bg-transparent p-0 shadow-none ring-0"
          showCloseButton={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <LoginForm />
        </DialogContent>
      </Dialog>
    </>
  )
}
