'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  Home,
  Users,
  MapPin,
  Hash,
  Calendar,
  Bell,
  Megaphone,
  LogOut,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUnreadCount } from '@/lib/actions/notifications'
import { logout } from '@/lib/actions/auth'

const navigation = [
  { name: 'ホーム', href: '/', icon: Home },
  { name: 'シフト作成', href: '/shifts/create', icon: Calendar },
  { name: '通知', href: '/notifications', icon: Bell },
  { name: 'お知らせ', href: '/announcements', icon: Megaphone },
  { name: 'スタッフ管理', href: '/staff', icon: Users },
  { name: '配属箇所管理', href: '/locations', icon: MapPin },
  { name: '勤務記号管理', href: '/duty-codes', icon: Hash },
  { name: '設定', href: '/admin/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let isActive = true
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount()
        if (isActive) setUnreadCount(count)
      } catch {
        /* ignore */
      }
    }
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [])

  return (
    <aside className="hidden md:fixed md:left-0 md:top-0 md:z-40 md:block md:h-screen md:w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-4">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="羽田空港サービス"
            width={180}
            height={71}
            className="h-10 w-auto"
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isNotifications = item.href === '/notifications'

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-2 border-transparent'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                )}
              />
              {item.name}
              {isNotifications && unreadCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <LogOut className="h-5 w-5 text-gray-400" />
          ログアウト
        </button>
      </div>
    </aside>
  )
}
