'use server'

import { createClient } from '@/lib/supabase/server'

export async function seedLocationRequirements() {
  const supabase = await createClient()

  // 既存のデータをチェック
  const { count: existingCount } = await supabase
    .from('location_requirements')
    .select('id', { count: 'exact', head: true })

  if (existingCount && existingCount > 0) {
    console.log(`既に ${existingCount} 件の配属箇所要件が登録されています`)
    return { skipped: true, count: existingCount }
  }

  // 配属箇所を取得
  const { data: locations } = await supabase.from('locations').select('*')
  if (!locations || locations.length === 0) {
    throw new Error('配属箇所データが存在しません')
  }

  // 勤務記号を取得
  const { data: dutyCodes } = await supabase.from('duty_codes').select('*')
  if (!dutyCodes || dutyCodes.length === 0) {
    throw new Error('勤務記号データが存在しません')
  }

  const t3CentralLocation = locations.find((l) => l.code === 'T3C')
  const t3NorthLocation = locations.find((l) => l.code === 'T3N')
  const t2CentralLocation = locations.find((l) => l.code === 'T2C')
  const busLocation = locations.find((l) => l.code === 'BUS')
  const touLocation = locations.find((l) => l.code === 'TOU')

  // 勤務記号のマッピング（カテゴリで検索）
  const getDutyCode = (code: string, category: string) => {
    return dutyCodes.find((dc) => dc.code === code && dc.category === category)
  }

  // 配属箇所要件データ
  const requirements = [
    // T3中央
    {
      location_id: t3CentralLocation?.id,
      duty_code_id: getDutyCode('06G5DA', 'T3中央')?.id,
      required_staff_count: 5,
      required_responsible_count: 1,
      required_tags: ['保安検査'],
      day_of_week: null,
      specific_date: null,
    },
    {
      location_id: t3CentralLocation?.id,
      duty_code_id: getDutyCode('06G5DA', 'T3中央')?.id,
      required_staff_count: 8,
      required_responsible_count: 2,
      required_tags: ['保安検査'],
      day_of_week: 1, // 月曜日
      specific_date: null,
    },
    {
      location_id: t3CentralLocation?.id,
      duty_code_id: getDutyCode('14A5AA', 'T3中央')?.id,
      required_staff_count: 4,
      required_responsible_count: 1,
      required_tags: ['保安検査'],
      day_of_week: null,
      specific_date: null,
    },
    {
      location_id: t3CentralLocation?.id,
      duty_code_id: getDutyCode('18A5AA', 'T3中央')?.id,
      required_staff_count: 3,
      required_responsible_count: 1,
      required_tags: ['保安検査'],
      day_of_week: null,
      specific_date: null,
    },

    // T3北
    {
      location_id: t3NorthLocation?.id,
      duty_code_id: getDutyCode('06J0AW', 'T3北')?.id,
      required_staff_count: 3,
      required_responsible_count: 1,
      required_tags: ['保安検査'],
      day_of_week: null,
      specific_date: null,
    },
    {
      location_id: t3NorthLocation?.id,
      duty_code_id: getDutyCode('15A7JA', 'T3北')?.id,
      required_staff_count: 2,
      required_responsible_count: 0,
      required_tags: ['保安検査'],
      day_of_week: null,
      specific_date: null,
    },

    // T2中央
    {
      location_id: t2CentralLocation?.id,
      duty_code_id: getDutyCode('06A6AA', 'T2中央')?.id,
      required_staff_count: 3,
      required_responsible_count: 1,
      required_tags: ['保安検査'],
      day_of_week: null,
      specific_date: null,
    },
    {
      location_id: t2CentralLocation?.id,
      duty_code_id: getDutyCode('14A5AA', 'T2中央')?.id,
      required_staff_count: 2,
      required_responsible_count: 0,
      required_tags: ['保安検査'],
      day_of_week: null,
      specific_date: null,
    },

    // バス案内
    {
      location_id: busLocation?.id,
      duty_code_id: getDutyCode('05D8GA', 'バス案内')?.id,
      required_staff_count: 4,
      required_responsible_count: 1,
      required_tags: ['バス案内'],
      day_of_week: null,
      specific_date: null,
    },
    {
      location_id: busLocation?.id,
      duty_code_id: getDutyCode('18J6AA', 'バス案内')?.id,
      required_staff_count: 2,
      required_responsible_count: 0,
      required_tags: ['バス案内'],
      day_of_week: null,
      specific_date: null,
    },
    {
      location_id: busLocation?.id,
      duty_code_id: getDutyCode('19A5AA', 'バス案内')?.id,
      required_staff_count: 2,
      required_responsible_count: 0,
      required_tags: ['バス案内'],
      day_of_week: null,
      specific_date: null,
    },

    // 横特
    {
      location_id: touLocation?.id,
      duty_code_id: getDutyCode('05G4AA', '横特')?.id,
      required_staff_count: 1,
      required_responsible_count: 0,
      required_tags: ['横特'],
      day_of_week: null,
      specific_date: null,
    },
  ]

  // undefined の要素を除外
  const validRequirements = requirements.filter(
    (r): r is typeof r & { location_id: string; duty_code_id: string } =>
      r.location_id != null && r.duty_code_id != null
  )

  if (validRequirements.length === 0) {
    throw new Error('有効な配属箇所要件データがありません')
  }

  // データを投入
  const { data, error } = await supabase
    .from('location_requirements')
    .insert(validRequirements)
    .select()

  if (error) {
    console.error('配属箇所要件データ投入エラー:', error)
    throw error
  }

  console.log(`${data?.length} 件の配属箇所要件を投入しました`)
  return { success: true, count: data?.length }
}
