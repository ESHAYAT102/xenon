"use client"

import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react"

import type { SessionUser } from "@/lib/session"

type AuthContextValue = {
  isAuthenticated: boolean
  user: SessionUser | null
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
})

type AuthProviderProps = PropsWithChildren<{
  user: SessionUser | null
}>

export default function AuthProvider({ children, user }: AuthProviderProps) {
  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      user,
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
