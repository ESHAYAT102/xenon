import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata } from "next"

import AuthProvider from "@/components/AuthProvider"
import "./globals.css"
import { getSessionUser } from "@/lib/session"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const geistHeading = Geist({ subsets: ["latin"], variable: "--font-heading" })

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Open-Hub",
  description:
    "Open-Hub is a GitHub client with repo browsing, profiles, command palette, and in-app actions.",
  icons: {
    icon: [
      {
        url: "/logo_light.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo_dark.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/logo_light.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo_dark.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: "/logo_light.png",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getSessionUser()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        "font-mono",
        geistMono.variable,
        geistHeading.variable
      )}
    >
      <body>
        <AuthProvider user={user}>
          <ThemeProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
