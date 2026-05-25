import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: "RD's Ledger Pro — Accounts & Bill Register",
  description: 'Full-featured accounts ledger, bill register, and cashbook management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Sora:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen" style={{ background: '#0F1117', color: '#F0F0F0', fontFamily: "'Sora', system-ui, sans-serif" }}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#22263A',
              color: '#F0F0F0',
              border: '1px solid #2E3350',
              borderRadius: '10px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#2ECC71', secondary: '#0F1117' } },
            error: { iconTheme: { primary: '#E74C3C', secondary: '#0F1117' } },
          }}
        />
      </body>
    </html>
  )
}
