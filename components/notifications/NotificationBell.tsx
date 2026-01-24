'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { getUnreadCount } from '@/lib/actions/notifications'

interface NotificationBellProps {
  staffId: string
}

export function NotificationBell({ staffId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let isActive = true
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount(staffId)
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
  }, [staffId])

  return (
    <Link href="/notifications" className="relative" aria-label="通知">
      <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors" aria-label="通知を表示">
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </Link>
  )
}
