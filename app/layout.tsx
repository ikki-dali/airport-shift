import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import { ConditionalLayout } from '@/components/layout/ConditionalLayout'
import { Toaster } from 'sonner'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HAS-G シフト管理',
  description: 'HAS-G 空港シフト管理システム',
  icons: {
    icon: '/icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="font-sans antialiased">
        <Toaster position="top-center" richColors />
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  )
}
