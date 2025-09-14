import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth/auth-context"
import { Inter } from "next/font/google"
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
    <html lang="en" className={`${inter.variable} antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class" 
          defaultTheme="system" 
          enableSystem 
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
