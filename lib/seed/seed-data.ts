import { createClient } from '@/lib/supabase/server'
import { DEFAULT_DUTY_CODES, parseDutyCode } from '@/lib/duty-code-parser'

interface SeedOptions {
  clearExisting?: boolean
}

export async function seedDatabase(options: SeedOptions = {}) {
  const { clearExisting = false } = options
  const supabase = await createClient()

  console.log('🌱 Seeding database...')

  // 既存データのクリア（オプション）
  if (clearExisting) {
    console.log('🗑️  Clearing existing data...')
    await supabase.from('shifts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('shift_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('location_requirements').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('staff_tags').delete().neq('staff_id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('staff').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('locations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('duty_codes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('tags').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('roles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('✅ Existing data cleared')
  }

  // 1. 役職マスタ
  console.log('📋 Seeding roles...')
  const roles = [
    { name: '一般社員', is_responsible: false, priority: 1 },
    { name: 'サブリーダー', is_responsible: true, priority: 2 },
    { name: 'リーダー', is_responsible: true, priority: 3 },
    { name: '管理者', is_responsible: true, priority: 4 },
  ]

  const { data: insertedRoles, error: rolesError } = await supabase
    .from('roles')
    .upsert(roles, { onConflict: 'name' })
    .select()

  if (rolesError) {
    console.error('❌ Error inserting roles:', rolesError)
    throw rolesError
  }

  console.log(`✅ Inserted ${insertedRoles?.length} roles`)

  // 役職IDのマッピングを作成
  const roleMap = new Map(insertedRoles?.map((r) => [r.name, r.id]) || [])

  // 2. タグマスタ
  console.log('🏷️  Seeding tags...')
  const tags = [
    { name: '保安検査', description: 'T3中央、T3北、T2中央での保安検査業務' },
    { name: 'バス案内', description: 'バス案内業務' },
    { name: '横特', description: '東方航空バゲージ業務' },
    { name: 'OSS', description: 'OSS業務' },
    { name: '番台', description: '番台業務' },
  ]

  const { data: insertedTags, error: tagsError } = await supabase
    .from('tags')
    .upsert(tags, { onConflict: 'name' })
    .select()

  if (tagsError) {
    console.error('❌ Error inserting tags:', tagsError)
    throw tagsError
  }

  console.log(`✅ Inserted ${insertedTags?.length} tags`)

  // タグIDのマッピングを作成
  const tagMap = new Map(insertedTags?.map((t) => [t.name, t.id]) || [])

  // 3. 勤務記号マスタ
  console.log('⏰ Seeding duty codes...')
  const dutyCodes = DEFAULT_DUTY_CODES.map(({ code, category }) => {
    const parsed = parseDutyCode(code)
    return {
      code: parsed.code,
      start_time: parsed.startTime,
      end_time: parsed.endTime,
      duration_hours: parsed.durationHours,
      duration_minutes: parsed.durationMinutes,
      break_minutes: parsed.breakMinutes,
      is_overnight: parsed.isOvernight,
      category,
    }
  })

  const { data: insertedDutyCodes, error: dutyCodesError } = await supabase
    .from('duty_codes')
    .upsert(dutyCodes, { onConflict: 'code' })
    .select()

  if (dutyCodesError) {
    console.error('❌ Error inserting duty codes:', dutyCodesError)
    throw dutyCodesError
  }

  console.log(`✅ Inserted ${insertedDutyCodes?.length} duty codes`)

  // 勤務記号IDのマッピングを作成
  const dutyCodeMap = new Map(insertedDutyCodes?.map((d) => [d.code, d.id]) || [])

  // 4. 配属箇所マスタ
  console.log('📍 Seeding locations...')
  const locations = [
    { business_type: '保安検査場案内業務', location_name: 'T3中央', code: 'T3C' },
    { business_type: '保安検査場案内業務', location_name: 'T3北', code: 'T3N' },
    { business_type: '保安検査場案内業務', location_name: 'T2中央', code: 'T2C' },
    { business_type: 'バス案内業務', location_name: 'バス案内', code: 'BUS' },
    { business_type: '横特業務', location_name: '東方航空バゲージ', code: 'TOU' },
  ]

  const { data: insertedLocations, error: locationsError } = await supabase
    .from('locations')
    .upsert(locations, { onConflict: 'code' })
    .select()

  if (locationsError) {
    console.error('❌ Error inserting locations:', locationsError)
    throw locationsError
  }

  console.log(`✅ Inserted ${insertedLocations?.length} locations`)

  // 配属箇所IDのマッピングを作成
  const locationMap = new Map(insertedLocations?.map((l) => [l.code, l.id]) || [])

  // 5. スタッフマスタ
  console.log('👥 Seeding staff...')
  const staffSamples = [
    { employee_number: '0001', name: '山田太郎', email: 'yamada@example.com', role: 'リーダー', tags: ['保安検査', 'バス案内'] },
    { employee_number: '0002', name: '佐藤花子', email: 'sato@example.com', role: 'サブリーダー', tags: ['保安検査'] },
    { employee_number: '0003', name: '鈴木次郎', email: 'suzuki@example.com', role: '一般社員', tags: ['保安検査'] },
    { employee_number: '0004', name: '田中美咲', email: 'tanaka@example.com', role: '一般社員', tags: ['バス案内'] },
    { employee_number: '0005', name: '高橋健太', email: 'takahashi@example.com', role: '一般社員', tags: ['保安検査'] },
    { employee_number: '0006', name: '伊藤舞', email: 'ito@example.com', role: 'サブリーダー', tags: ['バス案内', 'OSS'] },
    { employee_number: '0007', name: '渡辺大輔', email: 'watanabe@example.com', role: '一般社員', tags: ['保安検査'] },
    { employee_number: '0008', name: '中村優子', email: 'nakamura@example.com', role: '一般社員', tags: ['横特'] },
    { employee_number: '0009', name: '小林誠', email: 'kobayashi@example.com', role: '一般社員', tags: ['保安検査'] },
    { employee_number: '0010', name: '加藤明美', email: 'kato@example.com', role: '一般社員', tags: ['バス案内'] },
    { employee_number: '0011', name: '吉田隆史', email: 'yoshida@example.com', role: 'リーダー', tags: ['保安検査', '番台'] },
    { employee_number: '0012', name: '山本彩', email: 'yamamoto@example.com', role: '一般社員', tags: ['保安検査'] },
    { employee_number: '0013', name: '佐々木翔', email: 'sasaki@example.com', role: '一般社員', tags: ['バス案内'] },
    { employee_number: '0014', name: '森田里奈', email: 'morita@example.com', role: '一般社員', tags: ['保安検査'] },
    { employee_number: '0015', name: '林拓也', email: 'hayashi@example.com', role: 'サブリーダー', tags: ['保安検査', 'バス案内'] },
  ]

  const staffToInsert = staffSamples.map((s) => ({
    employee_number: s.employee_number,
    name: s.name,
    email: s.email,
    role_id: roleMap.get(s.role),
  }))

  const { data: insertedStaff, error: staffError } = await supabase
    .from('staff')
    .upsert(staffToInsert, { onConflict: 'employee_number' })
    .select()

  if (staffError) {
    console.error('❌ Error inserting staff:', staffError)
    throw staffError
  }

  console.log(`✅ Inserted ${insertedStaff?.length} staff`)

  // スタッフIDのマッピングを作成
  const staffMap = new Map(insertedStaff?.map((s) => [s.employee_number, s.id]) || [])

  // 6. スタッフタグの関連付け
  console.log('🔗 Seeding staff tags...')
  const staffTagsToInsert: { staff_id: string; tag_id: string }[] = []

  staffSamples.forEach((s) => {
    const staffId = staffMap.get(s.employee_number)
    if (staffId) {
      s.tags.forEach((tagName) => {
        const tagId = tagMap.get(tagName)
        if (tagId) {
          staffTagsToInsert.push({ staff_id: staffId, tag_id: tagId })
        }
      })
    }
  })

  const { error: staffTagsError } = await supabase
    .from('staff_tags')
    .upsert(staffTagsToInsert, { onConflict: 'staff_id,tag_id' })

  if (staffTagsError) {
    console.error('❌ Error inserting staff tags:', staffTagsError)
    throw staffTagsError
  }

  console.log(`✅ Inserted ${staffTagsToInsert.length} staff tag relations`)

  // 7. 配属箇所要件
  console.log('📋 Seeding location requirements...')
  const locationRequirementsRaw = [
    // T3中央 - 06G5DA（通常日）
    {
      location_id: locationMap.get('T3C'),
      duty_code_id: dutyCodeMap.get('06G5DA'),
      required_staff_count: 5,
      required_responsible_count: 1,
      required_tags: ['保安検査'],
      day_of_week: null as number | null,
    },
    // T3中央 - 06G5DA（月曜日）
    {
      location_id: locationMap.get('T3C'),
      duty_code_id: dutyCodeMap.get('06G5DA'),
      required_staff_count: 8,
      required_responsible_count: 2,
      required_tags: ['保安検査'],
      day_of_week: 1 as number | null,
    },
    // T3北 - 06G5DA
    {
      location_id: locationMap.get('T3N'),
      duty_code_id: dutyCodeMap.get('06G5DA'),
      required_staff_count: 4,
      required_responsible_count: 1,
      required_tags: ['保安検査'],
      day_of_week: null as number | null,
    },
    // T2中央 - 06G5DA
    {
      location_id: locationMap.get('T2C'),
      duty_code_id: dutyCodeMap.get('06G5DA'),
      required_staff_count: 3,
      required_responsible_count: 1,
      required_tags: ['保安検査'],
      day_of_week: null as number | null,
    },
    // バス案内 - 07G4D
    {
      location_id: locationMap.get('BUS'),
      duty_code_id: dutyCodeMap.get('07G4D'),
      required_staff_count: 2,
      required_responsible_count: 0,
      required_tags: ['バス案内'],
      day_of_week: null as number | null,
    },
    // 横特 - 08G4D
    {
      location_id: locationMap.get('TOU'),
      duty_code_id: dutyCodeMap.get('08G4D'),
      required_staff_count: 2,
      required_responsible_count: 0,
      required_tags: ['横特'],
      day_of_week: null as number | null,
    },
  ]

  // undefined値を持つエントリを除外し、型を保証
  const locationRequirements = locationRequirementsRaw.filter(
    (r): r is typeof r & { location_id: string; duty_code_id: string } =>
      r.location_id != null && r.duty_code_id != null
  )

  const { data: insertedRequirements, error: requirementsError } = await supabase
    .from('location_requirements')
    .insert(locationRequirements)
    .select()

  if (requirementsError) {
    console.error('❌ Error inserting location requirements:', requirementsError)
    throw requirementsError
  }

  console.log(`✅ Inserted ${insertedRequirements?.length} location requirements`)

  // 8. サンプルシフトリクエスト（2025年12月分）
  console.log('📅 Seeding sample shift requests...')
  const shiftRequests: {
    staff_id: string
    date: string
    request_type: string
    note: string | null
  }[] = []

  // 各スタッフに対して12月の希望を生成
  const year = 2025
  const month = 12

  insertedStaff?.forEach((staff, index) => {
    // ランダムに5-10日の希望を生成
    const requestCount = Math.floor(Math.random() * 6) + 5
    const requestDates = new Set<number>()

    while (requestDates.size < requestCount) {
      requestDates.add(Math.floor(Math.random() * 31) + 1)
    }

    requestDates.forEach((day) => {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      // スタッフごとに異なる希望パターンを設定
      let requestType: string
      const rand = Math.random()
      
      if (index % 3 === 0) {
        // 1/3のスタッフは休み希望が多い
        requestType = rand < 0.5 ? '休' : rand < 0.7 ? '◯' : '早番'
      } else if (index % 3 === 1) {
        // 1/3のスタッフは早番希望が多い
        requestType = rand < 0.4 ? '早番' : rand < 0.6 ? '◯' : rand < 0.8 ? '遅番' : '休'
      } else {
        // 残り1/3は特に制限なし
        requestType = rand < 0.3 ? '◯' : rand < 0.5 ? '休' : rand < 0.7 ? '早番' : '遅番'
      }

      shiftRequests.push({
        staff_id: staff.id,
        date,
        request_type: requestType,
        note: null,
      })
    })
  })

  // シフトリクエストを挿入
  if (shiftRequests.length > 0) {
    const { error: shiftRequestsError } = await supabase
      .from('shift_requests')
      .insert(shiftRequests)

    if (shiftRequestsError) {
      console.error('❌ Error inserting shift requests:', shiftRequestsError)
      throw shiftRequestsError
    }

    console.log(`✅ Inserted ${shiftRequests.length} shift requests`)
  }

  console.log('✅ Database seeding completed!')

  return {
    roles: insertedRoles?.length || 0,
    tags: insertedTags?.length || 0,
    dutyCodes: insertedDutyCodes?.length || 0,
    locations: insertedLocations?.length || 0,
    staff: insertedStaff?.length || 0,
    staffTags: staffTagsToInsert.length,
    locationRequirements: insertedRequirements?.length || 0,
    shiftRequests: shiftRequests.length,
  }
}
