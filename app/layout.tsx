import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import { AppSidebar } from '@/components/layout/AppSidebar'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'シフト管理システム | Airport Shift Manager',
  description: '空港シフト管理システム - 効率的なシフト作成と管理',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className="font-sans antialiased">
        <div className="flex h-screen overflow-hidden bg-gray-50">
          {/* Sidebar */}
          <AppSidebar />

          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden md:pl-64">
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
