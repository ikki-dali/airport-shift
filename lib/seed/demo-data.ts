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

// シフト希望タイプ（◯=出勤可能、△=できれば休み、×=出勤不可）
const REQUEST_TYPES = ['◯', '△', '×'] as const

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
    const preferenceRatio = [0.7, 0.2, 0.1] // ◯70%, △20%, ×10%

    // スタッフごとに好む時間帯を設定（4〜7個をランダムに）
    const preferredSlotCount = 4 + (staffSeed % 4) // 4-7個
    const shuffledSlots = [...TIME_SLOT_GROUPS].sort(() =>
      Math.sin(staffSeed + staffIndex) - 0.5
    )
    const preferredSlots = shuffledSlots.slice(0, preferredSlotCount)

    let currentDate = thisMonthStart
    while (currentDate <= nextMonthEnd) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const yearMonthStr = format(currentDate, 'yyyy-MM')
      const dayOfMonth = currentDate.getDate()
      const dayOfWeek = currentDate.getDay()

      // 希望提出率を決定（約80%の日に希望を出す）
      const submitRate = 0.8
      if (Math.random() > submitRate) {
        currentDate = addDays(currentDate, 1)
        continue
      }

      // 希望タイプを決定
      let requestType: string
      const rand = Math.random()
      if (rand < preferenceRatio[0]) {
        requestType = '◯'
      } else if (rand < preferenceRatio[0] + preferenceRatio[1]) {
        requestType = '△'
      } else {
        requestType = '×'
      }

      // 土日は休み希望が増える
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        if (Math.random() < 0.4) {
          requestType = '×'
        }
      }

      // 時間帯を決定
      let note: string | null = null
      if (requestType === '◯') {
        // 出勤可能な場合、時間帯を指定
        const isAllSlots = preferredSlots.length === TIME_SLOT_GROUPS.length
        if (!isAllSlots) {
          // 日によって時間帯を少し変動させる
          const dailyVariation = Math.random() < 0.3
          let daySlots = [...preferredSlots]

          if (dailyVariation) {
            // 時々、追加の時間帯もOKにする
            const extraSlot = TIME_SLOT_GROUPS.find(s => !daySlots.includes(s))
            if (extraSlot) daySlots.push(extraSlot)
          }

          daySlots.sort()
          note = `[時間帯:${daySlots.join(',')}]`
        }
      } else if (requestType === '△') {
        // できれば休みだが、時間帯制限付きで出勤可能
        const limitedSlots = preferredSlots.slice(0, 2 + (dayOfMonth % 2))
        limitedSlots.sort()
        note = `[時間帯:${limitedSlots.join(',')}]`
      }

      requests.push({
        staff_id: staffId,
        date: dateStr,
        request_type: requestType,
        note,
        year_month: yearMonthStr,
      })

      currentDate = addDays(currentDate, 1)
    }
  })

  return requests
}

// シフトを生成（今月と来月）
function generateShifts(
  staffIds: string[],
  locationIds: string[],
  dutyCodeIds: string[],
  contractStaffCount: number,
): Array<{
  staff_id: string
  location_id: string
  duty_code_id: string
  date: string
  status: '確定' | '予定'
}> {
  const shifts: Array<{
    staff_id: string
    location_id: string
    duty_code_id: string
    date: string
    status: '確定' | '予定'
  }> = []

  const today = new Date()
  const thisMonthStart = startOfMonth(today)
  const nextMonthEnd = endOfMonth(addMonths(today, 1))

  // スタッフごとの月間勤務日数を追跡
  const staffWorkDays: Map<string, number> = new Map()
  staffIds.forEach((id) => staffWorkDays.set(id, 0))

  // 各日にシフトを割り当て
  let currentDate = thisMonthStart
  while (currentDate <= nextMonthEnd) {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const dayOfMonth = currentDate.getDate()

    // 1日の配置人数を決定（43人ベース、日によって変動）
    let dailyStaffCount: number
    if (dayOfMonth % 7 === 0) {
      // 7の倍数の日は人手不足（デモ用：赤ハイライト確認）
      dailyStaffCount = Math.floor(DAILY_REQUIRED_STAFF * 0.7) // 30人程度
    } else if (dayOfMonth % 5 === 0) {
      // 5の倍数の日はやや不足
      dailyStaffCount = Math.floor(DAILY_REQUIRED_STAFF * 0.9) // 39人程度
    } else {
      // 通常日は充足
      dailyStaffCount = DAILY_REQUIRED_STAFF + Math.floor(Math.random() * 3) // 43-45人
    }

    // シフトに入れるスタッフを選択
    // 契約社員は週5程度、パートは週2-4程度入るように調整
    const availableStaff = [...staffIds].sort(() => Math.random() - 0.5)
    const selectedStaff: string[] = []

    for (const staffId of availableStaff) {
      if (selectedStaff.length >= dailyStaffCount) break

      const currentWorkDays = staffWorkDays.get(staffId) || 0
      const staffIndex = staffIds.indexOf(staffId)
      const isContract = staffIndex < contractStaffCount

      // 契約社員は月22日程度（週5）、パートは月12日程度（週2-4）
      const maxWorkDays = isContract ? 22 : 12
      const workProbability = isContract ? 0.75 : 0.4

      // よく入る人、あまり入らない人の偏りを再現
      const staffVariance = (staffIndex % 10) / 10 // 0-0.9の偏り
      const adjustedProbability = workProbability * (0.7 + staffVariance * 0.6)

      if (currentWorkDays < maxWorkDays && Math.random() < adjustedProbability) {
        selectedStaff.push(staffId)
        staffWorkDays.set(staffId, currentWorkDays + 1)
      }
    }

    // シフトを作成
    selectedStaff.forEach((staffId, index) => {
      const locationId = locationIds[index % locationIds.length]
      const dutyCodeId = dutyCodeIds[index % dutyCodeIds.length]

      // 一部を承認待ち状態にする（デモ用：バッジ確認）
      const isPending = dayOfMonth % 3 === 0 && index % 5 === 0
      const status: '確定' | '予定' = isPending ? '予定' : '確定'

      shifts.push({
        staff_id: staffId,
        location_id: locationId,
        duty_code_id: dutyCodeId,
        date: dateStr,
        status,
      })
    })

    currentDate = addDays(currentDate, 1)
  }

  return shifts
}

export async function seedDemoData() {
  const supabase = createServiceClient()

  console.log('🎭 Seeding demo data...')

  // 1. 既存データをクリア
  console.log('🗑️  Clearing existing data...')
  await supabase.from('shifts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('shift_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  // staff_tagsテーブルは存在しないためスキップ（staffテーブルにtags text[]カラムで統合済み）
  // await supabase.from('staff_tags').delete().neq('staff_id', '00000000-0000-0000-0000-000000000000')
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

  // 3. 勤務地を取得（または作成）
  let { data: locations } = await supabase.from('locations').select('id, location_name, code')
  if (!locations || locations.length === 0) {
    const { data: newLocations } = await supabase
      .from('locations')
      .upsert([
        { business_type: '保安検査場案内業務', location_name: '第1ターミナル', code: 'T1' },
        { business_type: '保安検査場案内業務', location_name: '第2ターミナル', code: 'T2' },
        { business_type: '保安検査場案内業務', location_name: '第3ターミナル北', code: 'T3N' },
        { business_type: '保安検査場案内業務', location_name: '第3ターミナル南', code: 'T3S' },
        { business_type: 'バス案内業務', location_name: 'バスゲート', code: 'BUS' },
      ], { onConflict: 'code' })
      .select()
    locations = newLocations
  }
  const locationIds = locations?.map((l) => l.id) || []

  // 4. 勤務記号を取得（または作成）
  let { data: dutyCodes } = await supabase.from('duty_codes').select('id, code')
  if (!dutyCodes || dutyCodes.length === 0) {
    const { data: newDutyCodes } = await supabase
      .from('duty_codes')
      .upsert([
        { code: '06G5DA', start_time: '06:00', end_time: '15:00', duration_hours: 8, duration_minutes: 0, break_minutes: 60, category: '早番' },
        { code: '07G4D', start_time: '07:00', end_time: '16:00', duration_hours: 8, duration_minutes: 0, break_minutes: 60, category: '早番' },
        { code: '10G5DA', start_time: '10:00', end_time: '19:00', duration_hours: 8, duration_minutes: 0, break_minutes: 60, category: '日勤' },
        { code: '14G4D', start_time: '14:00', end_time: '23:00', duration_hours: 8, duration_minutes: 0, break_minutes: 60, category: '遅番' },
      ], { onConflict: 'code' })
      .select()
    dutyCodes = newDutyCodes
  }
  const dutyCodeIds = dutyCodes?.map((d) => d.id) || []

  // 5. スタッフ150人を生成
  console.log('👥 Generating 150 staff...')
  const staffData = generateStaff()
  const staffToInsert = staffData.map((s) => ({
    employee_number: s.employee_number,
    name: s.name,
    email: s.email,
    role_id: defaultRoleId,
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

  // 6. シフトを生成（今月と来月）
  console.log('📅 Generating shifts for this month and next month...')
  const shiftsData = generateShifts(staffIds, locationIds, dutyCodeIds, contractStaffCount)

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

  // 7. 配属箇所要件を更新（1日43人ベース）
  console.log('📋 Updating location requirements...')
  // 既存要件を削除
  await supabase.from('location_requirements').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // 新しい要件を作成（各勤務地×勤務記号に均等配分）
  const requirements: Array<{
    location_id: string
    duty_code_id: string
    required_staff_count: number
    required_responsible_count: number
  }> = []

  // 43人を配分（5勤務地 × 4勤務記号 = 20スロット、各2-3人）
  const slotsCount = locationIds.length * dutyCodeIds.length
  const baseCount = Math.floor(DAILY_REQUIRED_STAFF / slotsCount)
  const remainder = DAILY_REQUIRED_STAFF % slotsCount
  let slotIndex = 0

  locationIds.forEach((locationId) => {
    dutyCodeIds.forEach((dutyCodeId) => {
      const extraPerson = slotIndex < remainder ? 1 : 0
      requirements.push({
        location_id: locationId,
        duty_code_id: dutyCodeId,
        required_staff_count: Math.max(1, baseCount + extraPerson), // 最小1人
        required_responsible_count: 0,
      })
      slotIndex++
    })
  })

  const { error: reqError } = await supabase.from('location_requirements').insert(requirements)
  if (reqError) {
    console.error('❌ Error inserting requirements:', reqError)
    throw reqError
  }
  console.log(`✅ Inserted ${requirements.length} location requirements`)

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

  // 統計情報
  const pendingShifts = shiftsData.filter((s) => s.status === '予定').length
  const confirmedShifts = shiftsData.filter((s) => s.status === '確定').length

  return {
    staff: insertedStaff?.length || 0,
    contractStaff: contractStaffCount,
    partTimeStaff: (insertedStaff?.length || 0) - contractStaffCount,
    shifts: insertedShiftsCount,
    confirmedShifts,
    pendingShifts,
    locations: locationIds.length,
    dutyCodes: dutyCodeIds.length,
    requirements: requirements.length,
    shiftRequests: requestStats.total,
    shiftRequestsAvailable: requestStats.available,
    shiftRequestsPreferOff: requestStats.preferOff,
    shiftRequestsUnavailable: requestStats.unavailable,
  }
}
