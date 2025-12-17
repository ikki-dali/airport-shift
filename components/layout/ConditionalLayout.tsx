'use client'

import { usePathname } from 'next/navigation'
import { AppSidebar } from './AppSidebar'
import { MobileNav } from './MobileNav'

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // スタッフ専用ページ（サイドバーなし）
  const isStaffPage = pathname?.startsWith('/staff/shifts') || pathname?.startsWith('/shift-request')

  if (isStaffPage) {
    // スタッフページ: サイドバーなし
    return <>{children}</>
  }

  // 管理者ページ: サイドバー付き
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <AppSidebar />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden md:pl-64">
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
