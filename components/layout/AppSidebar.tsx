'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  MapPin,
  Hash,
  Calendar,
  DollarSign,
  Bell,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUnreadCount } from '@/lib/actions/notifications'
import { logout } from '@/lib/actions/auth'

const navigation = [
  { name: 'ホーム', href: '/', icon: Home },
  { name: '通知', href: '/notifications', icon: Bell },
  { name: 'スタッフ管理', href: '/staff', icon: Users },
  { name: '配属箇所管理', href: '/locations', icon: MapPin },
  { name: '勤務記号管理', href: '/duty-codes', icon: Hash },
  { name: 'シフト作成', href: '/shifts/create', icon: Calendar },
  { name: '給与管理', href: '/payroll', icon: DollarSign },
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
      } catch (error) {
        console.error('Failed to load unread count:', error)
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
    <aside className="hidden md:fixed md:left-0 md:top-0 md:z-40 md:block md:h-screen md:w-64 border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-gray-900">シフト管理</span>
            <span className="text-xs text-gray-500">Airport Shift Manager</span>
          </div>
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
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
              {isNotifications && unreadCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
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
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-5 w-5 text-gray-400" />
          ログアウト
        </button>
      </div>
    </aside>
  )
}
