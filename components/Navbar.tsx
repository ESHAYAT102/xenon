"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import A from "@/components/A"
import { useAuth } from "@/components/AuthProvider"
import BrowserContextMenu from "@/components/BrowserContextMenu"
import CommandPalette from "@/components/CommandPalette"
import NotificationsDrawer from "@/components/NotificationsDrawer"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ContextMenuItem } from "@/components/ui/context-menu"
import { useThemeTransition } from "@/hooks/use-theme-transition"
import type { GitHubNotification } from "@/lib/github"
import {
  Settings,
  LogOutIcon,
  User,
  Copy,
  Moon,
  Plus,
  Search,
  Sun,
  SquareArrowOutUpRight,
  BookMarked,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "./Image"

type NavbarProps = {
  initialUnreadNotifications?: GitHubNotification[]
}

export default function Page({ initialUnreadNotifications = [] }: NavbarProps) {
  const { user } = useAuth()
  const { resolvedTheme, toggleTheme } = useThemeTransition()
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const profileUrl = useMemo(
    () => (user?.login ? `/${user.login}` : "/"),
    [user?.login]
  )
  const newRepositoryUrl = "/new"
  const fallbackInitial =
    user?.name?.trim().charAt(0).toUpperCase() ||
    user?.login?.trim().charAt(0).toUpperCase() ||
    user?.email?.trim().charAt(0).toUpperCase() ||
    "O"

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href)
  }

  const isDarkTheme = resolvedTheme === "dark"
  const authUrl = "/api/auth/github/login?callbackUrl=/"

  return (
    <nav className="fixed z-50 flex w-full items-center justify-between border-b border-foreground/10 bg-primary-foreground/50 px-4 py-4 backdrop-blur-md md:px-8">
      <CommandPalette
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
        onOpenNotificationsChange={setIsNotificationsOpen}
      />
      <div className="flex items-center">
        <BrowserContextMenu
          triggerClassName="flex items-center justify-center"
          menuChildren={
            <>
              <A href="/" target="_blank">
                <ContextMenuItem>
                  <SquareArrowOutUpRight />
                  Open in new tab
                </ContextMenuItem>
              </A>
              <A href="/ESHAYAT102/Xenon">
                <ContextMenuItem>
                  <BookMarked />
                  Open repository
                </ContextMenuItem>
              </A>
              <ContextMenuItem onClick={handleCopyUrl}>
                <Copy />
                Copy URL
              </ContextMenuItem>
            </>
          }
        >
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Image className="h-6" src="/favicon.ico" alt="Logo"></Image>
            <span>Xenon</span>
          </Link>
        </BrowserContextMenu>
      </div>
      <div className="flex items-center gap-2">
        <BrowserContextMenu
          triggerClassName="inline-flex"
          menuChildren={
            <>
              <ContextMenuItem onClick={() => setIsCommandOpen(true)}>
                <Search />
                Search
              </ContextMenuItem>
            </>
          }
        >
          <Button
            className="rounded-full"
            variant="ghost"
            onClick={() => setIsCommandOpen(true)}
          >
            <Search />
          </Button>
        </BrowserContextMenu>
        <div className="hidden items-center gap-2 md:flex">
          {user && (
            <>
              <Button
                asChild
                className="rounded-full"
                variant="ghost"
                title="Create new repository"
              >
                <A href={newRepositoryUrl}>
                  <Plus />
                </A>
              </Button>
              <NotificationsDrawer
                open={isNotificationsOpen}
                onOpenChange={setIsNotificationsOpen}
                initialNotifications={initialUnreadNotifications}
              />
            </>
          )}
        </div>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden rounded-full md:flex"
              >
                <Avatar size="sm">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={user.name ?? "Profile Picture"}
                  />
                  <AvatarFallback>{fallbackInitial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mt-6" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      @{user.login}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <A href={profileUrl}>
                  <DropdownMenuItem className="hover:bg-accent-foreground/10">
                    <User className="mr-2 size-4" />
                    Your profile
                  </DropdownMenuItem>
                </A>
                <A href="/settings">
                  <DropdownMenuItem className="hover:bg-accent-foreground/10">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </DropdownMenuItem>
                </A>
              </DropdownMenuGroup>
              <DropdownMenuItem
                className="hover:bg-accent-foreground/10"
                onClick={toggleTheme}
              >
                {isDarkTheme ? (
                  <>
                    <Sun className="mr-2 size-4" />
                    Light Theme
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 size-4" />
                    Dark Theme
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="hover:bg-accent-foreground/10"
                onClick={() => {
                  window.location.href = "/api/auth/signout?callbackUrl=/"
                }}
              >
                <LogOutIcon className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            asChild
            variant="outline"
            className="hidden rounded-full px-4 md:inline-flex"
          >
            <A href={authUrl}>Sign in</A>
          </Button>
        )}
      </div>
    </nav>
  )
}
