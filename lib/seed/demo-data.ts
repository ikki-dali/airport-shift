import { createServiceClient } from '@/lib/supabase/service'
import { format, addDays, startOfMonth, endOfMonth, addMonths } from 'date-fns'

// 日本人の名字（50種）
const LAST_NAMES = [
  '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
  '山崎', '森', '池田', '橋本', '阿部', '石川', '前田', '小川', '藤田', '岡田',
  '後藤', '長谷川', '村上', '近藤', '坂本', '遠藤', '青木', '藤井', '西村', '福田',
  '太田', '三浦', '岡本', '松田', '中島', '中川', '原田', '小野', '田村', '竹内',
]

// 日本人の名前（男女各40種）
const FIRST_NAMES_MALE = [
  '太郎', '健一', '大輔', '翔太', '拓也', '誠', '隆', '浩', '修', '亮',
  '和也', '健太', '圭介', '直樹', '雅人', '康平', '裕太', '慎一', '達也', '智也',
  '優太', '颯太', '大地', '海斗', '悠斗', '陸', '蓮', '湊', '樹', '大翔',
  '陽太', '悠真', '春樹', '涼太', '拓海', '雄太', '翼', '駿', '航', '隼人',
]

const FIRST_NAMES_FEMALE = [
  '花子', '美咲', '舞', '愛', '里奈', '彩', '優子', '明美', '恵', '幸子',
  '由美', '直美', '智子', '真由美', '麻衣', '沙織', '千尋', '瞳', '美穂', '香織',
  '結衣', '美月', '陽菜', '凛', '葵', '楓', '咲良', '美桜', '心春', '杏',
  '美優', '莉子', '芽依', '真央', '優花', '菜々美', '彩花', '美羽', '桃花', '琴美',
]

// 1日あたりの必要人数（デモ用）
export const DAILY_REQUIRED_STAFF = 43

// A〜G時間帯グループ（モバイルアプリと同じ定義）
const TIME_SLOT_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

// シフト希望タイプ
// ◯=どの時間帯でも出勤可、休=休み希望、有給=有給休暇、A〜G=その時間帯に出勤可能
const REQUEST_TYPES = ['◯', '休', '有給', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

// 150人のスタッフを生成
function generateStaff(): Array<{
  employee_number: string
  name: string
  email: string
  employment_type: 'contract' | 'part_time'
}> {
  const staff: Array<{
    employee_number: string
    name: string
    email: string
    employment_type: 'contract' | 'part_time'
  }> = []

  // 契約社員30人（社員番号 0001-0030）
  for (let i = 1; i <= 30; i++) {
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
    const isMale = Math.random() > 0.5
    const firstName = isMale
      ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
      : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)]

    staff.push({
      employee_number: String(i).padStart(4, '0'),
      name: `${lastName}${firstName}`,
      email: `staff${String(i).padStart(4, '0')}@example.com`,
      employment_type: 'contract',
    })
  }

  // パート120人（社員番号 0031-0150）
  for (let i = 31; i <= 150; i++) {
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
    const isMale = Math.random() > 0.6 // パートは女性多め
    const firstName = isMale
      ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
      : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)]

    staff.push({
      employee_number: String(i).padStart(4, '0'),
      name: `${lastName}${firstName}`,
      email: `staff${String(i).padStart(4, '0')}@example.com`,
      employment_type: 'part_time',
    })
  }

  return staff
}

// シフト希望を生成（今月と来月）
function generateShiftRequests(
  staffIds: string[],
): Array<{
  staff_id: string
  date: string
  request_type: string
  note: string | null
  year_month: string
}> {
  const requests: Array<{
    staff_id: string
    date: string
    request_type: string
    note: string | null
    year_month: string
  }> = []

  const today = new Date()
  const thisMonthStart = startOfMonth(today)
  const nextMonthEnd = endOfMonth(addMonths(today, 1))

  // 各スタッフについてシフト希望を生成
  staffIds.forEach((staffId, staffIndex) => {
    // スタッフごとの傾向を決定（一貫性を持たせる）
    const staffSeed = staffIndex * 17 // 擬似乱数のシード代わり
    
    // スタッフごとに好む時間帯を設定（1〜3個をランダムに）
    const preferredSlotCount = 1 + (staffSeed % 3) // 1-3個
    const shuffledSlots = [...TIME_SLOT_GROUPS].sort(() =>
      Math.sin(staffSeed + staffIndex) - 0.5
    )
    const preferredSlots = shuffledSlots.slice(0, preferredSlotCount)

    let currentDate = thisMonthStart
    while (currentDate <= nextMonthEnd) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const yearMonthStr = format(currentDate, 'yyyy-MM')
      const dayOfWeek = currentDate.getDay()

      // 希望提出率を決定（約70%の日に希望を出す）
      const submitRate = 0.7
      if (Math.random() > submitRate) {
        currentDate = addDays(currentDate, 1)
        continue
      }

      // 希望タイプを決定
      let requestType: string
      const rand = Math.random()
      
      // 土日は休み希望が増える
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        if (rand < 0.5) {
          requestType = '休'
        } else if (rand < 0.55) {
          requestType = '有給'
        } else if (rand < 0.65) {
          requestType = '◯' // どの時間帯でもOK
        } else {
          // 好みの時間帯から選択
          requestType = preferredSlots[Math.floor(Math.random() * preferredSlots.length)]
        }
      } else {
        // 平日
        if (rand < 0.15) {
          requestType = '休'
        } else if (rand < 0.18) {
          requestType = '有給'
        } else if (rand < 0.30) {
          requestType = '◯' // どの時間帯でもOK
        } else {
          // 好みの時間帯から選択（日によって少し変動）
          const dailyVariation = Math.random() < 0.2
          if (dailyVariation && preferredSlots.length < TIME_SLOT_GROUPS.length) {
            // たまに別の時間帯も選ぶ
            const otherSlots = TIME_SLOT_GROUPS.filter(s => !preferredSlots.includes(s))
            requestType = otherSlots[Math.floor(Math.random() * otherSlots.length)]
          } else {
            requestType = preferredSlots[Math.floor(Math.random() * preferredSlots.length)]
          }
        }
      }

      requests.push({
        staff_id: staffId,
        date: dateStr,
        request_type: requestType,
        note: null,
        year_month: yearMonthStr,
      })

      currentDate = addDays(currentDate, 1)
    }
  })

  return requests
}

// location_requirementsに基づいてシフトを生成（今月と来月）
function generateShiftsFromRequirements(
  staffIds: string[],
  requirements: Array<{
    location_id: string
    duty_code_id: string
    required_staff_count: number
  }>,
  contractStaffCount: number,
): Array<{
  staff_id: string
  location_id: string
  duty_code_id: string
  date: string
  status: '確定'
}> {
  const shifts: Array<{
    staff_id: string
    location_id: string
    duty_code_id: string
    date: string
    status: '確定'
  }> = []

  const today = new Date()
  const thisMonthStart = startOfMonth(today)
  const nextMonthEnd = endOfMonth(addMonths(today, 1))

  // 各日にシフトを割り当て
  let currentDate = thisMonthStart
  while (currentDate <= nextMonthEnd) {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const dayOfMonth = currentDate.getDate()

    // 不足人数を決定（日によって変動）
    // 目標: ほとんど充足（43/43）、月に2-3日だけ少し不足
    let shortageCount: number
    // 特定の日だけ不足（7日、14日、21日）
    if (dayOfMonth === 7 || dayOfMonth === 14 || dayOfMonth === 21) {
      shortageCount = 7 // 7人不足で固定
    } else {
      shortageCount = 0
    }

    // その日に割り当てるスタッフのリスト（シャッフルして先頭から使う）
    const shuffledStaff = [...staffIds].sort(() => Math.random() - 0.5)
    let staffPoolIndex = 0

    // 各requirement（配置箇所×勤務記号）に対してシフトを作成
    // スロットをシャッフルして、shortageCount分をスキップ対象に
    const shuffledReqs = [...requirements].sort(() => Math.random() - 0.5)
    let skippedSlots = 0

    for (const req of shuffledReqs) {
      let actualCount: number
      if (shortageCount === 0) {
        actualCount = req.required_staff_count
      } else {
        // 不足日: 一部のスロットで1人減らす
        if (skippedSlots < shortageCount && req.required_staff_count > 0) {
          actualCount = req.required_staff_count - 1
          skippedSlots++
        } else {
          actualCount = req.required_staff_count
        }
      }

      for (let i = 0; i < actualCount; i++) {
        // スタッフプールから次のスタッフを取得
        const staffId = shuffledStaff[staffPoolIndex % shuffledStaff.length]
        staffPoolIndex++

        const status = '確定' as const

        shifts.push({
          staff_id: staffId,
          location_id: req.location_id,
          duty_code_id: req.duty_code_id,
          date: dateStr,
          status,
        })
      }
    }

    currentDate = addDays(currentDate, 1)
  }

  return shifts
}

export async function seedDemoData() {
  const supabase = createServiceClient()

  console.log('🎭 Seeding demo data...')

  // 1. 既存データをクリア（外部キー制約の順序で削除）
  console.log('🗑️  Clearing existing data...')
  await supabase.from('shifts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('shift_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('location_requirements').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('staff').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log('✅ Existing data cleared')

  // 2. 役職を取得（または作成）
  let { data: roles } = await supabase.from('roles').select('id, name')
  if (!roles || roles.length === 0) {
    const { data: newRoles } = await supabase
      .from('roles')
      .upsert([
        { name: '一般社員', is_responsible: false, priority: 1 },
        { name: 'サブリーダー', is_responsible: true, priority: 2 },
        { name: 'リーダー', is_responsible: true, priority: 3 },
      ], { onConflict: 'name' })
      .select()
    roles = newRoles
  }
  const defaultRoleId = roles?.find((r) => r.name === '一般社員')?.id || roles?.[0]?.id

  // 3. 勤務地を取得（または作成）- 実Excelデータに基づく7箇所
  let { data: locations } = await supabase.from('locations').select('id, location_name, code')
  if (!locations || locations.length === 0) {
    const { data: newLocations } = await supabase
      .from('locations')
      .upsert([
        { business_type: '保安検査場案内業務', location_name: 'T3中央', code: 'T3C' },
        { business_type: '保安検査場案内業務', location_name: 'T3北側', code: 'T3N' },
        { business_type: '保安検査場案内業務', location_name: 'T2中央検査場', code: 'T2C' },
        { business_type: 'バス案内業務', location_name: 'T3クリーンバス', code: 'T3CB' },
        { business_type: 'バス案内業務', location_name: 'T3際際バス', code: 'T3IB' },
        { business_type: 'バス案内業務', location_name: 'T2クリーンバス', code: 'T2CB' },
        { business_type: 'バス案内業務', location_name: 'T2際際バス', code: 'T2IB' },
      ], { onConflict: 'code' })
      .select()
    locations = newLocations
  }
  const locationIds = locations?.map((l) => l.id) || []

  // 4. 勤務記号をリセット＆作成 - 実Excelデータに基づく38種類（既存33 + 新規5）
  console.log('⏰ Resetting duty codes...')
  await supabase.from('duty_codes').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { data: dutyCodes, error: dutyError } = await supabase
    .from('duty_codes')
    .insert([
      // === T3中央 (25コード) ===
      { code: '04A5GA', start_time: '04:00', end_time: '09:30', duration_hours: 5, duration_minutes: 30, break_minutes: 0, is_overnight: false, category: 'T3中央' },
      { code: '04G4JA', start_time: '04:30', end_time: '09:30', duration_hours: 4, duration_minutes: 45, break_minutes: 15, is_overnight: false, category: 'T3中央' },
      { code: '05A7AA', start_time: '05:00', end_time: '11:00', duration_hours: 7, duration_minutes: 0, break_minutes: 60, is_overnight: false, category: 'T3中央' },
      { code: '06A9A', start_time: '06:00', end_time: '15:00', duration_hours: 8, duration_minutes: 0, break_minutes: 60, is_overnight: false, category: 'T3中央' },
      { code: '06G9AY', start_time: '06:30', end_time: '15:30', duration_hours: 7, duration_minutes: 30, break_minutes: 90, is_overnight: false, category: 'T3中央' },
      { code: '07A5AA', start_time: '07:00', end_time: '12:00', duration_hours: 5, duration_minutes: 0, break_minutes: 0, is_overnight: false, category: 'T3中央' },
      { code: '07A2GY', start_time: '07:00', end_time: '19:30', duration_hours: 11, duration_minutes: 0, break_minutes: 90, is_overnight: false, category: 'T3中央' },
      { code: '07G2AY', start_time: '07:30', end_time: '18:00', duration_hours: 9, duration_minutes: 0, break_minutes: 90, is_overnight: false, category: 'T3中央' },
      { code: '12A9A', start_time: '12:00', end_time: '21:00', duration_hours: 8, duration_minutes: 0, break_minutes: 60, is_overnight: false, category: 'T3中央' },
      { code: '12A8AY', start_time: '12:00', end_time: '20:00', duration_hours: 6, duration_minutes: 30, break_minutes: 90, is_overnight: false, category: 'T3中央' },
      { code: '13A9A', start_time: '13:00', end_time: '22:00', duration_hours: 8, duration_minutes: 0, break_minutes: 60, is_overnight: false, category: 'T3中央' },
      { code: '13A7GA', start_time: '13:00', end_time: '20:30', duration_hours: 7, duration_minutes: 30, break_minutes: 60, is_overnight: false, category: 'T3中央' },
      { code: '13A9AX', start_time: '13:00', end_time: '22:00', duration_hours: 8, duration_minutes: 0, break_minutes: 60, is_overnight: false, category: 'T3中央' },
      { code: '13J5DA', start_time: '13:45', end_time: '19:00', duration_hours: 5, duration_minutes: 15, break_minutes: 0, is_overnight: false, category: 'T3中央' },
      { code: '14A5AA', start_time: '14:00', end_time: '19:00', duration_hours: 5, duration_minutes: 0, break_minutes: 0, is_overnight: false, category: 'T3中央' },
      { code: '14A9A', start_time: '14:00', end_time: '23:00', duration_hours: 8, duration_minutes: 0, break_minutes: 60, is_overnight: false, category: 'T3中央' },
      { code: '14D7JY', start_time: '14:15', end_time: '22:00', duration_hours: 6, duration_minutes: 15, break_minutes: 90, is_overnight: false, category: 'T3中央' },
      { code: '14D8G', start_time: '14:15', end_time: '22:45', duration_hours: 7, duration_minutes: 30, break_minutes: 60, is_overnight: false, category: 'T3中央' },
      { code: '14J8D', start_time: '14:45', end_time: '23:00', duration_hours: 7, duration_minutes: 15, break_minutes: 60, is_overnight: false, category: 'T3中央' },
      { code: '15A5AA', start_time: '15:00', end_time: '20:00', duration_hours: 5, duration_minutes: 0, break_minutes: 0, is_overnight: false, category: 'T3中央' },
      { code: '15A7J', start_time: '15:00', end_time: '22:45', duration_hours: 6, duration_minutes: 45, break_minutes: 60, is_overnight: false, category: 'T3中央' },
      { code: '16G6GG', start_time: '16:30', end_time: '23:00', duration_hours: 6, duration_minutes: 0, break_minutes: 30, is_overnight: false, category: 'T3中央' },
      { code: '22A0AY', start_time: '22:00', end_time: '08:00', duration_hours: 8, duration_minutes: 30, break_minutes: 90, is_overnight: true, category: 'T3中央' },
      { code: '22A9GY', start_time: '22:00', end_time: '07:30', duration_hours: 8, duration_minutes: 0, break_minutes: 90, is_overnight: true, category: 'T3中央' },
      { code: '23A1AO', start_time: '23:00', end_time: '10:00', duration_hours: 7, duration_minutes: 0, break_minutes: 240, is_overnight: true, category: 'T3中央' },
      // === T3北側 (2コード) ===
      { code: '06J1JT', start_time: '06:45', end_time: '18:30', duration_hours: 9, duration_minutes: 0, break_minutes: 165, is_overnight: false, category: 'T3北側' },
      { code: '06J9AW', start_time: '06:45', end_time: '15:45', duration_hours: 7, duration_minutes: 0, break_minutes: 120, is_overnight: false, category: 'T3北側' },
      // === T2中央検査場 (6コード) ===
      { code: '06A6AA', start_time: '06:00', end_time: '12:00', duration_hours: 6, duration_minutes: 0, break_minutes: 0, is_overnight: false, category: 'T2中央検査場' },
      { code: '09G2GY', start_time: '09:30', end_time: '22:00', duration_hours: 11, duration_minutes: 0, break_minutes: 90, is_overnight: false, category: 'T2中央検査場' },
      { code: '14G4GA', start_time: '14:30', end_time: '19:00', duration_hours: 4, duration_minutes: 30, break_minutes: 0, is_overnight: false, category: 'T2中央検査場' },
      { code: '19A4AA', start_time: '19:00', end_time: '23:00', duration_hours: 4, duration_minutes: 0, break_minutes: 0, is_overnight: false, category: 'T2中央検査場' },
      { code: '19A1AO', start_time: '19:00', end_time: '06:00', duration_hours: 7, duration_minutes: 0, break_minutes: 240, is_overnight: true, category: 'T2中央検査場' },
      { code: '22A8AW', start_time: '22:00', end_time: '06:00', duration_hours: 6, duration_minutes: 0, break_minutes: 120, is_overnight: true, category: 'T2中央検査場' },
      // === T3クリーンバス (1コード) ===
      { code: '05G5AA', start_time: '05:30', end_time: '10:30', duration_hours: 5, duration_minutes: 0, break_minutes: 0, is_overnight: false, category: 'T3クリーンバス' },
      // === T3際際バス (3コード) ===
      { code: '04J5JA', start_time: '04:45', end_time: '10:30', duration_hours: 5, duration_minutes: 45, break_minutes: 0, is_overnight: false, category: 'T3際際バス' },
      { code: '10A5AA', start_time: '10:00', end_time: '15:00', duration_hours: 5, duration_minutes: 0, break_minutes: 0, is_overnight: false, category: 'T3際際バス' },
      { code: '19A4AA', start_time: '19:00', end_time: '23:00', duration_hours: 4, duration_minutes: 0, break_minutes: 0, is_overnight: false, category: 'T3際際バス' },
      // === T2クリーンバス (1コード) ===
      { code: '05D5AA', start_time: '05:15', end_time: '10:15', duration_hours: 5, duration_minutes: 0, break_minutes: 0, is_overnight: false, category: 'T2クリーンバス' },
      // === T2際際バス (2コード) ===
      { code: '14A5AA', start_time: '14:00', end_time: '19:00', duration_hours: 5, duration_minutes: 0, break_minutes: 0, is_overnight: false, category: 'T2際際バス' },
      { code: '18G4GA', start_time: '18:30', end_time: '23:00', duration_hours: 4, duration_minutes: 30, break_minutes: 0, is_overnight: false, category: 'T2際際バス' },
    ])
    .select()

  if (dutyError) {
    console.error('❌ Error inserting duty codes:', dutyError)
    throw dutyError
  }
  console.log(`✅ Inserted ${dutyCodes?.length} duty codes`)

  const dutyCodeIds = dutyCodes?.map((d) => d.id) || []

  // 5. スタッフ150人を生成
  console.log('👥 Generating 150 staff...')
  const staffData = generateStaff()
  const staffToInsert = staffData.map((s) => ({
    employee_number: s.employee_number,
    name: s.name,
    email: s.email,
    role_id: defaultRoleId,
    employment_type: s.employment_type,
  }))

  const { data: insertedStaff, error: staffError } = await supabase
    .from('staff')
    .insert(staffToInsert)
    .select()

  if (staffError) {
    console.error('❌ Error inserting staff:', staffError)
    throw staffError
  }
  console.log(`✅ Inserted ${insertedStaff?.length} staff`)

  const staffIds = insertedStaff?.map((s) => s.id) || []
  const contractStaffCount = 30 // 最初の30人が契約社員

  // 6. 配属箇所要件を作成（1日43人ベース）- シフト生成の前に必要
  console.log('📋 Creating location requirements...')
  // 既存要件を削除
  await supabase.from('location_requirements').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Excel実データ通りの43スロット配分を作成
  // ヘルパー: location_nameからlocation_idを取得
  const getLocationId = (name: string) => locations?.find(l => l.location_name === name)?.id
  // ヘルパー: code+categoryからduty_code_idを取得
  const getDutyCodeId = (code: string, category: string) =>
    dutyCodes?.find(d => d.code === code && d.category === category)?.id

  // Excel【現状アサイン】シートに基づく43スロット定義
  const requirementDefs: Array<{ location: string; code: string; category: string; count: number }> = [
    // T3中央 (26スロット)
    { location: 'T3中央', code: '12A9A', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '04A5GA', category: 'T3中央', count: 2 },
    { location: 'T3中央', code: '04G4JA', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '22A0AY', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '22A9GY', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '23A1AO', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '05A7AA', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '06A9A', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '06G9AY', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '07A5AA', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '07A2GY', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '07G2AY', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '13A7GA', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '12A8AY', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '13A9A', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '13A9AX', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '13J5DA', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '14A9A', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '14A5AA', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '14D7JY', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '14D8G', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '14J8D', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '15A7J', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '15A5AA', category: 'T3中央', count: 1 },
    { location: 'T3中央', code: '16G6GG', category: 'T3中央', count: 1 },
    // T3北側 (2スロット)
    { location: 'T3北側', code: '06J1JT', category: 'T3北側', count: 1 },
    { location: 'T3北側', code: '06J9AW', category: 'T3北側', count: 1 },
    // T2中央検査場 (8スロット)
    { location: 'T2中央検査場', code: '06A6AA', category: 'T2中央検査場', count: 3 },
    { location: 'T2中央検査場', code: '09G2GY', category: 'T2中央検査場', count: 1 },
    { location: 'T2中央検査場', code: '14G4GA', category: 'T2中央検査場', count: 1 },
    { location: 'T2中央検査場', code: '19A4AA', category: 'T2中央検査場', count: 1 },
    { location: 'T2中央検査場', code: '19A1AO', category: 'T2中央検査場', count: 1 },
    { location: 'T2中央検査場', code: '22A8AW', category: 'T2中央検査場', count: 1 },
    // T3クリーンバス (1スロット)
    { location: 'T3クリーンバス', code: '05G5AA', category: 'T3クリーンバス', count: 1 },
    // T3際際バス (3スロット)
    { location: 'T3際際バス', code: '04J5JA', category: 'T3際際バス', count: 1 },
    { location: 'T3際際バス', code: '10A5AA', category: 'T3際際バス', count: 1 },
    { location: 'T3際際バス', code: '19A4AA', category: 'T3際際バス', count: 1 },
    // T2クリーンバス (1スロット)
    { location: 'T2クリーンバス', code: '05D5AA', category: 'T2クリーンバス', count: 1 },
    // T2際際バス (2スロット)
    { location: 'T2際際バス', code: '14A5AA', category: 'T2際際バス', count: 1 },
    { location: 'T2際際バス', code: '18G4GA', category: 'T2際際バス', count: 1 },
  ]

  const requirements: Array<{
    location_id: string
    duty_code_id: string
    required_staff_count: number
    required_responsible_count: number
  }> = []

  for (const def of requirementDefs) {
    const locationId = getLocationId(def.location)
    const dutyCodeId = getDutyCodeId(def.code, def.category)
    if (!locationId || !dutyCodeId) {
      console.warn(`⚠️ Skipping requirement: location=${def.location}, code=${def.code}, category=${def.category} (locationId=${locationId}, dutyCodeId=${dutyCodeId})`)
      continue
    }
    requirements.push({
      location_id: locationId,
      duty_code_id: dutyCodeId,
      required_staff_count: def.count,
      required_responsible_count: 0,
    })
  }

  const { error: reqError } = await supabase.from('location_requirements').insert(requirements)
  if (reqError) {
    console.error('❌ Error inserting requirements:', reqError)
    throw reqError
  }
  console.log(`✅ Inserted ${requirements.length} location requirements`)

  // 7. シフトを生成（今月と来月）- location_requirementsに基づく
  console.log('📅 Generating shifts based on location requirements...')
  const shiftsData = generateShiftsFromRequirements(staffIds, requirements, contractStaffCount)

  // バッチで挿入（1000件ずつ）
  const BATCH_SIZE = 1000
  let insertedShiftsCount = 0

  for (let i = 0; i < shiftsData.length; i += BATCH_SIZE) {
    const batch = shiftsData.slice(i, i + BATCH_SIZE)
    const { error: shiftError } = await supabase.from('shifts').insert(batch)
    if (shiftError) {
      console.error('❌ Error inserting shifts:', shiftError)
      throw shiftError
    }
    insertedShiftsCount += batch.length
  }

  console.log(`✅ Inserted ${insertedShiftsCount} shifts`)

  // 8. シフト希望を生成（今月と来月）
  console.log('📝 Generating shift requests for all staff...')
  const requestsData = generateShiftRequests(staffIds)

  // バッチで挿入（1000件ずつ）
  let insertedRequestsCount = 0

  for (let i = 0; i < requestsData.length; i += BATCH_SIZE) {
    const batch = requestsData.slice(i, i + BATCH_SIZE)
    const { error: requestError } = await supabase.from('shift_requests').insert(batch)
    if (requestError) {
      console.error('❌ Error inserting shift requests:', requestError)
      throw requestError
    }
    insertedRequestsCount += batch.length
  }

  console.log(`✅ Inserted ${insertedRequestsCount} shift requests`)

  // 統計情報を計算
  const requestStats = {
    total: requestsData.length,
    available: requestsData.filter(r => r.request_type === '◯').length,
    preferOff: requestsData.filter(r => r.request_type === '△').length,
    unavailable: requestsData.filter(r => r.request_type === '×').length,
  }

  console.log('✅ Demo data seeding completed!')

  return {
    staff: insertedStaff?.length || 0,
    contractStaff: contractStaffCount,
    partTimeStaff: (insertedStaff?.length || 0) - contractStaffCount,
    shifts: insertedShiftsCount,
    locations: locationIds.length,
    dutyCodes: dutyCodeIds.length,
    requirements: requirements.length,
    shiftRequests: requestStats.total,
    shiftRequestsAvailable: requestStats.available,
    shiftRequestsPreferOff: requestStats.preferOff,
    shiftRequestsUnavailable: requestStats.unavailable,
  }
}
