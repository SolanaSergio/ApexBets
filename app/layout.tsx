import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Project Apex - Sports Analytics Platform",
  description: "Advanced sports analytics and prediction platform for NBA, NFL, and other major sports leagues",
  keywords: ["sports analytics", "predictions", "NBA", "betting odds", "machine learning"],
  authors: [{ name: "Project Apex Team" }],
  openGraph: {
    title: "Project Apex - Sports Analytics Platform",
    description: "Advanced sports analytics and prediction platform for NBA, NFL, and other major sports leagues",
    type: "website",
  },
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
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Suspense fallback={null}>{children}</Suspense>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
