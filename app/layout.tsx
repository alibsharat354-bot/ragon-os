import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ragon OS',
  description: 'Business Operating System for Ragon Solutions',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#020617', color: '#e2e8f0' }}>
        {children}
      </body>
    </html>
  )
}
