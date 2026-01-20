import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SQL Query Optimizer',
  description: 'Analyze and optimize your SQL queries',
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
