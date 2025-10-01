import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth/auth-context"


import { Inter } from "next/font/google"
import "./globals.css"

export const metadata: Metadata = {
  title: "Project Apex - Sports Analytics Platform",
  description: "Advanced sports analytics and prediction platform for NBA, NFL, and other major sports leagues",
  keywords: ["sports analytics", "predictions", "NBA", "betting odds", "machine learning"],
  authors: [{ name: "Project Apex Team" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Project Apex"
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false
  },
  openGraph: {
    title: "Project Apex - Sports Analytics Platform",
    description: "Advanced sports analytics and prediction platform for NBA, NFL, and other major sports leagues",
    type: "website",
    siteName: "Project Apex",
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Apex - Sports Analytics Platform",
    description: "Advanced sports analytics and prediction platform for NBA, NFL, and other major sports leagues"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#06b6d4" },
    { media: "(prefers-color-scheme: dark)", color: "#0891b2" }
  ]
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 font-sans antialiased" suppressHydrationWarning>


        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}