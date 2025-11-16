'use server'

import { createClient } from '@/lib/supabase/server'

export async function seedStaffData() {
  const supabase = await createClient()

  // 役職を取得
  const { data: roles } = await supabase.from('roles').select('*')
  if (!roles || roles.length === 0) {
    throw new Error('役職データが存在しません')
  }

  const leaderRole = roles.find((r) => r.name === 'リーダー')
  const subLeaderRole = roles.find((r) => r.name === 'サブリーダー')
  const generalRole = roles.find((r) => r.name === '一般社員')

  // サンプルスタッフデータ
  const staffData = [
    {
      employee_number: '0001',
      name: '山田太郎',
      email: 'yamada@example.com',
      phone: '090-1234-5678',
      role_id: leaderRole?.id,
      tags: ['保安検査', 'バス案内'],
      is_active: true,
    },
    {
      employee_number: '0002',
      name: '佐藤花子',
      email: 'sato@example.com',
      phone: '090-1234-5679',
      role_id: subLeaderRole?.id,
      tags: ['保安検査'],
      is_active: true,
    },
    {
      employee_number: '0003',
      name: '鈴木次郎',
      email: 'suzuki@example.com',
      phone: '090-1234-5680',
      role_id: generalRole?.id,
      tags: ['保安検査'],
      is_active: true,
    },
    {
      employee_number: '0004',
      name: '田中美咲',
      email: 'tanaka@example.com',
      phone: '090-1234-5681',
      role_id: generalRole?.id,
      tags: ['バス案内'],
      is_active: true,
    },
    {
      employee_number: '0005',
      name: '高橋健太',
      email: 'takahashi@example.com',
      phone: '090-1234-5682',
      role_id: generalRole?.id,
      tags: ['保安検査'],
      is_active: true,
    },
    {
      employee_number: '0006',
      name: '伊藤舞',
      email: 'ito@example.com',
      phone: '090-1234-5683',
      role_id: subLeaderRole?.id,
      tags: ['バス案内', 'OSS'],
      is_active: true,
    },
    {
      employee_number: '0007',
      name: '渡辺大輔',
      email: 'watanabe@example.com',
      phone: '090-1234-5684',
      role_id: generalRole?.id,
      tags: ['保安検査'],
      is_active: true,
    },
    {
      employee_number: '0008',
      name: '中村優子',
      email: 'nakamura@example.com',
      phone: '090-1234-5685',
      role_id: generalRole?.id,
      tags: ['横特'],
      is_active: true,
    },
    {
      employee_number: '0009',
      name: '小林誠',
      email: 'kobayashi@example.com',
      phone: '090-1234-5686',
      role_id: generalRole?.id,
      tags: ['保安検査'],
      is_active: true,
    },
    {
      employee_number: '0010',
      name: '加藤明美',
      email: 'kato@example.com',
      phone: '090-1234-5687',
      role_id: generalRole?.id,
      tags: ['バス案内'],
      is_active: true,
    },
    {
      employee_number: '0011',
      name: '吉田隆史',
      email: 'yoshida@example.com',
      phone: '090-1234-5688',
      role_id: leaderRole?.id,
      tags: ['保安検査', '番台'],
      is_active: true,
    },
    {
      employee_number: '0012',
      name: '山本彩',
      email: 'yamamoto@example.com',
      phone: '090-1234-5689',
      role_id: generalRole?.id,
      tags: ['保安検査'],
      is_active: true,
    },
    {
      employee_number: '0013',
      name: '佐々木翔',
      email: 'sasaki@example.com',
      phone: '090-1234-5690',
      role_id: generalRole?.id,
      tags: ['バス案内'],
      is_active: true,
    },
    {
      employee_number: '0014',
      name: '森田里奈',
      email: 'morita@example.com',
      phone: '090-1234-5691',
      role_id: generalRole?.id,
      tags: ['保安検査'],
      is_active: true,
    },
    {
      employee_number: '0015',
      name: '林拓也',
      email: 'hayashi@example.com',
      phone: '090-1234-5692',
      role_id: subLeaderRole?.id,
      tags: ['保安検査', 'バス案内'],
      is_active: true,
    },
  ]

  // 既存のスタッフをチェック
  const { count } = await supabase
    .from('staff')
    .select('id', { count: 'exact', head: true })

  if (count && count > 0) {
    console.log(`既に ${count} 件のスタッフが登録されています`)
    return { skipped: true, count }
  }

  // スタッフデータを投入
  const { data, error } = await supabase.from('staff').insert(staffData).select()

  if (error) {
    console.error('スタッフデータ投入エラー:', error)
    throw error
  }

  console.log(`${data?.length} 件のスタッフを投入しました`)
  return { success: true, count: data?.length }
}
