import { ReactNode } from 'react'

export const metadata = {
  title: 'シフト確認 | Airport Shift Manager',
  description: '確定シフトの確認',
}

export default function StaffLayout({ children }: { children: ReactNode }) {
  // スタッフページ用のシンプルなレイアウト（サイドバーなし）
  return <>{children}</>
}
