import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KFactor - Viral Growth System',
  description: '10x K-Factor Viral Growth Engineering Challenge',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

