import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth/auth-context"
import { DynamicBackground } from "@/components/effects/dynamic-background"
import { RealTimeProvider } from "@/components/data/real-time-provider"
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
      <body className="min-h-screen font-sans antialiased relative overflow-x-hidden" suppressHydrationWarning>
        {/* Enhanced Dynamic Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50" />
          <DynamicBackground
            variant="particles"
            intensity="medium"
            colors={["#06b6d4", "#8b5cf6", "#10b981", "#3b82f6"]}
            interactive={true}
          />
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}} />
        </div>

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <RealTimeProvider>
              {children}
            </RealTimeProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
