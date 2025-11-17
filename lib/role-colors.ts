// 役職ごとの色を管理

const ROLE_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-900' },
  { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-900' },
  { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-900' },
  { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-900' },
  { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-900' },
  { bg: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-900' },
  { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-900' },
  { bg: 'bg-teal-100', border: 'border-teal-500', text: 'text-teal-900' },
  { bg: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-900' },
  { bg: 'bg-rose-100', border: 'border-rose-500', text: 'text-rose-900' },
]

// 役職IDから色を取得（一貫性を保つためにハッシュ化）
export function getRoleColor(roleId: string | null | undefined): {
  bg: string
  border: string
  text: string
} {
  if (!roleId) {
    return { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-900' }
  }

  // 役職IDをハッシュ化して色のインデックスを決定
  let hash = 0
  for (let i = 0; i < roleId.length; i++) {
    hash = (hash << 5) - hash + roleId.charCodeAt(i)
    hash = hash & hash // 32ビット整数に変換
  }

  const index = Math.abs(hash) % ROLE_COLORS.length
  return ROLE_COLORS[index]
}

// 役職名から色を取得（役職名がキーの場合）
export function getRoleColorByName(roleName: string | null | undefined): {
  bg: string
  border: string
  text: string
} {
  if (!roleName) {
    return { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-900' }
  }

  return getRoleColor(roleName)
}
