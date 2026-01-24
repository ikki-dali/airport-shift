'use server'

import OpenAI, { APIConnectionTimeoutError, RateLimitError, APIError } from 'openai'
import { createClient } from '@/lib/supabase/server'
import type { StaffWithRole } from './staff'
import type { Location } from './locations'
import type { DutyCode } from './duty-codes'
import { format } from 'date-fns'
import { logger } from '@/lib/errors/logger'
import { handleSupabaseError } from '@/lib/errors/helpers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30_000,   // 30秒タイムアウト
  maxRetries: 3,     // 3回リトライ（SDK内蔵のexponential backoff）
})

interface ShiftAssignment {
  date: string
  staff_id: string
  location_id: string
  duty_code_id: string
}

interface ShiftRequestData {
  staff_id: string
  date: string
  request_type: string
}

interface LocationRequirement {
  location_id: string
  duty_code_id: string
  required_staff_count: number
  required_responsible_count: number
  required_tags: string[] | null
  day_of_week: number | null
  specific_date: string | null
  locations?: { location_name: string }
  duty_codes?: { code: string }
}

export async function generateWeeklyShifts(
  weekStartStr: string,
  weekEndStr: string,
  staff: StaffWithRole[],
  locations: Location[],
  dutyCodes: DutyCode[],
  existingShifts: ShiftAssignment[] = [],
  shiftRequests: ShiftRequestData[] = [],
  locationRequirements: LocationRequirement[] = []
): Promise<{ success: boolean; message: string; shifts?: ShiftAssignment[] }> {
  try {
    // OpenAI APIキーのチェック
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        message: 'OpenAI APIキーが設定されていません。環境変数OPENAI_API_KEYを設定してください。',
      }
    }

    // 文字列から Date オブジェクトに変換
    const weekStart = new Date(weekStartStr)
    const weekEnd = new Date(weekEndStr)

    // プロンプトの作成
    const prompt = `あなたはシフト作成の専門家です。以下の条件で最適な週間シフトを作成してください。

【対象期間】
${format(weekStart, 'yyyy-MM-dd')} から ${format(weekEnd, 'yyyy-MM-dd')} までの7日間

【スタッフ情報】
${staff.map((s) => `スタッフ名: ${s.name}
  UUID: ${s.id}
  役職: ${s.roles?.name || 'なし'}`).join('\n\n')}

【配属箇所】
${locations.map((l) => {
  // この配置箇所の要件を取得
  const reqs = locationRequirements.filter(r => r.location_id === l.id)
  const reqInfo = reqs.length > 0
    ? reqs.map(r => {
        const dutyCode = dutyCodes.find(dc => dc.id === r.duty_code_id)
        return `  - ${dutyCode?.code || '不明'}: ${r.required_staff_count}人必要（責任者${r.required_responsible_count}人）`
      }).join('\n')
    : '  （要件未設定）'

  return `配属箇所名: ${l.location_name}
  UUID: ${l.id}
${reqInfo}`
}).join('\n\n')}

【勤務記号】
${dutyCodes.map((dc) => `勤務記号コード: ${dc.code}
  UUID: ${dc.id}
  時間: ${dc.start_time}-${dc.end_time} (${dc.duration_hours}時間${dc.duration_minutes}分)`).join('\n\n')}

【⚠️ 既存のシフト - 絶対に重複させないこと！】
${existingShifts.length > 0
  ? `以下のスタッフ・日付の組み合わせは既にシフトが登録されています。
これらのスタッフには、同じ日に新しいシフトを割り当ててはいけません：

` + existingShifts.map((s) => {
      const staffName = staff.find(st => st.id === s.staff_id)?.name || '不明'
      const locationName = locations.find(l => l.id === s.location_id)?.location_name || '不明'
      const dutyCode = dutyCodes.find(dc => dc.id === s.duty_code_id)?.code || '不明'
      return `❌ ${s.date}: ${staffName}（${locationName} ${dutyCode}で配置済み）`
    }).join('\n')
  : '（既存シフトなし - 全スタッフが利用可能）'
}

【⭐ スタッフの希望（最優先事項！）】
${shiftRequests.length > 0
  ? `以下のスタッフからシフト希望が提出されています。
希望を出したスタッフは必ず最優先で配置してください！

${shiftRequests.map((r) => {
      const staffName = staff.find(s => s.id === r.staff_id)?.name || '不明'
      const staffId = r.staff_id
      if (r.request_type === '◯' || r.request_type === '出勤希望') {
        return `⭐⭐⭐ ${r.date}: ${staffName}（UUID: ${staffId}）は「${r.request_type}」- この日は必ずシフトに入れること！`
      } else if (r.request_type === '休' || r.request_type === '休み希望') {
        return `❌ ${r.date}: ${staffName}（UUID: ${staffId}）は「${r.request_type}」- この日は絶対にシフトに入れないこと！`
      } else {
        return `⭐ ${r.date}: ${staffName}（UUID: ${staffId}）は「${r.request_type}」を希望`
      }
    }).join('\n')}`
  : '（希望なし）'
}

【🔥 最重要制約 - 絶対に守ること！】
1. 🔥🔥🔥 **シフト希望を出したスタッフのみ配置すること（最優先！）**：
   - シフト希望を提出していないスタッフは、**絶対に**シフトに入れない
   - 上記【⭐ スタッフの希望】に記載されているスタッフのみが配置対象
   - 希望がないスタッフで枠を埋めることは厳禁
   - 必要人数が不足する場合でも、希望を出していないスタッフを使わない

2. ⚠️ **既存シフトとの重複は絶対禁止**：
   - 上記【既存のシフト】に記載されたスタッフ・日付の組み合わせには、絶対に新しいシフトを割り当てない
   - 各スタッフは1日1シフトまで
   - 例：山田太郎が2025-11-17に既存シフトがある場合、2025-11-17には山田太郎を使わない

3. ⭐⭐⭐ **スタッフの希望を絶対に反映すること**：
   - 「休」または「休み希望」の日には、そのスタッフを**絶対に**シフトに入れない
   - 「◯」または「出勤希望」の日には、そのスタッフを**必ず**シフトに入れる（優先度：最高）
   - 「早朝」「早番」「遅番」「夜勤」希望の場合は、該当する時間帯の勤務記号を割り当てる

4. **配置箇所の必要人数を可能な限り満たすこと**：
   - シフト希望を出したスタッフの範囲内で、できるだけ必要人数を満たす
   - ただし、希望を出していないスタッフを使って枠を埋めることは絶対にしない
   - 例：「バス案内 06A6AA: 2人必要」で希望者が1人しかいない場合は、1人だけ配置する

5. 連続勤務は最大6日まで（厳守）
6. 週40時間を超えないように配分（厳守）
7. できるだけ公平に勤務を配分

【シフト作成の手順】
ステップ1: 「◯」「出勤希望」を出しているスタッフを配置
  - その際、人手が足りていない配置箇所を優先的に埋める
  - できるだけ長時間勤務（1日通しで働ける勤務記号、例: 8時間勤務）を優先的に割り当てる
ステップ2: その他の希望（「早朝」「早番」「遅番」「夜勤」など）を出しているスタッフを配置
  - 該当する時間帯の勤務記号を割り当てる
ステップ3: 最終確認
  - 「休」「休み希望」のスタッフが誤って入っていないか確認
  - シフト希望を出していないスタッフが入っていないか確認

【重要事項】
- staff_id, location_id, duty_code_idには、必ず上記で示された「UUID」の値を使用してください
- 勤務記号コード（例: 06A6AA）ではなく、その勤務記号の「UUID」を duty_code_id に設定してください

【出力形式】
以下のJSON形式で出力してください。shiftsキーの配列として返してください：
{
  "shifts": [
    {
      "date": "2025-11-17",
      "staff_id": "スタッフのUUID（上記のスタッフ情報から選択）",
      "location_id": "配属箇所のUUID（上記の配属箇所から選択）",
      "duty_code_id": "勤務記号のUUID（上記の勤務記号から選択）"
    }
  ]
}

🔥 最終確認（必ず実施）：
- 「休」「休み希望」のスタッフが誤って入っていないか確認
- シフト希望を出していないスタッフが入っていないか確認（これは絶対NG！）
- 「◯」「出勤希望」を出したスタッフが全員配置されているか確認
- 既存シフトとの重複がないか確認
- 連続勤務が6日を超えていないか確認
- 週40時間を超えていないか確認`

    // OpenAI APIを呼び出し
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `あなたはシフト作成の専門家です。与えられた条件に基づいて、最適なシフトをJSON形式で出力します。

🔥 最優先ミッション：
1. シフト希望を出したスタッフのみを配置すること（最重要！）
2. 既存のシフトとの重複は絶対に避けること
3. スタッフの希望を最優先で反映すること

重要な注意事項：
- **シフト希望を提出していないスタッフは絶対に配置しないでください**
- 希望を出したスタッフのみが配置対象です
- 必要人数が不足する場合でも、希望のないスタッフで埋めることは厳禁です
- 既存のシフトとの重複は絶対に避けてください
- 同じスタッフが同じ日に複数のシフトに入ることはできません
- 既存シフトに記載されているスタッフ・日付の組み合わせは使用禁止です
- スタッフの希望（「◯」や「休」）を必ず反映してください
- 連続勤務は最大6日まで、週40時間を超えないように厳守してください`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // 低めに設定して、より確実に制約を守らせる
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      return {
        success: false,
        message: 'AI応答が空でした。',
      }
    }

    // JSONをパース
    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseText)
    } catch (parseError: unknown) {
      logger.error('Failed to parse AI response', { action: 'generateWeeklyShifts' }, parseError)
      return {
        success: false,
        message: 'AI応答の解析に失敗しました。再度お試しください。',
      }
    }

    const shifts: ShiftAssignment[] = parsedResponse.shifts || parsedResponse

    // バリデーション
    if (!Array.isArray(shifts)) {
      logger.error('Invalid shifts format (not array)', { action: 'generateWeeklyShifts', parsedResponse })
      return {
        success: false,
        message: 'AIが生成したシフトの形式が不正です。再度お試しください。',
      }
    }

    if (shifts.length === 0) {
      logger.warn('AI generated 0 shifts', { action: 'generateWeeklyShifts', shiftRequestsCount: shiftRequests.length })
      return {
        success: false,
        message: `AIがシフトを生成できませんでした。\n\n考えられる原因:\n- この期間にシフト希望を提出しているスタッフがいない（希望提出: ${shiftRequests.length}件）\n- 制約条件（既存シフト、連続勤務、週40時間など）が厳しすぎて配置できない\n- 希望を出したスタッフが全員「休」希望を出している\n\nシフト希望の提出状況を確認してください。`,
      }
    }

    // 有効なIDのセットを作成
    const validStaffIds = new Set(staff.map((s) => s.id))
    const validLocationIds = new Set(locations.map((l) => l.id))
    const validDutyCodeIds = new Set(dutyCodes.map((dc) => dc.id))

    // 既存シフトの重複チェック用マップ（staff_id + date をキーに）
    const existingShiftMap = new Map<string, boolean>()
    existingShifts.forEach((s) => {
      existingShiftMap.set(`${s.staff_id}_${s.date}`, true)
    })

    // 有効なシフトと無効なシフトを分離
    const validShifts: ShiftAssignment[] = []
    const skippedShifts: string[] = []
    const generatedShiftMap = new Map<string, boolean>() // 生成されたシフト内での重複チェック

    for (let i = 0; i < shifts.length; i++) {
      const shift = shifts[i]
      const shiftKey = `${shift.staff_id}_${shift.date}`
      let shouldSkip = false
      const skipReasons: string[] = []

      // 既存シフトとの重複チェック
      if (existingShiftMap.has(shiftKey)) {
        const staffName = staff.find(s => s.id === shift.staff_id)?.name || shift.staff_id
        skipReasons.push(`${staffName} は ${shift.date} に既にシフト登録済み`)
        shouldSkip = true
      }

      // 生成されたシフト内での重複チェック
      if (generatedShiftMap.has(shiftKey)) {
        const staffName = staff.find(s => s.id === shift.staff_id)?.name || shift.staff_id
        skipReasons.push(`${staffName} の ${shift.date} が重複`)
        shouldSkip = true
      }

      // 無効なIDチェック
      if (!validStaffIds.has(shift.staff_id)) {
        skipReasons.push(`無効なスタッフID`)
        shouldSkip = true
      }
      if (!validLocationIds.has(shift.location_id)) {
        skipReasons.push(`無効な配属箇所ID`)
        shouldSkip = true
      }
      if (!validDutyCodeIds.has(shift.duty_code_id)) {
        skipReasons.push(`無効な勤務記号ID`)
        shouldSkip = true
      }

      if (shouldSkip) {
        skippedShifts.push(`シフト${i + 1}: ${skipReasons.join(', ')}`)
      } else {
        validShifts.push(shift)
        generatedShiftMap.set(shiftKey, true)
      }
    }

    // 有効なシフトが1つもない場合はエラー
    if (validShifts.length === 0) {
      logger.error('No valid shifts generated', { action: 'generateWeeklyShifts', skippedCount: skippedShifts.length })
      return {
        success: false,
        message: `生成された全てのシフトが無効でした:\n${skippedShifts.slice(0, 5).join('\n')}${skippedShifts.length > 5 ? '\n...' : ''}`,
      }
    }

    // スキップしたシフトがあればログに出力
    if (skippedShifts.length > 0) {
      logger.info(`Skipped ${skippedShifts.length} invalid/duplicate shifts`, { action: 'generateWeeklyShifts', skippedShifts })
    }

    logger.info(`AI generated ${validShifts.length} valid shifts`, { action: 'generateWeeklyShifts', validCount: validShifts.length, skippedCount: skippedShifts.length })

    return {
      success: true,
      message: skippedShifts.length > 0
        ? `${validShifts.length}件の有効なシフトを生成しました（${skippedShifts.length}件の重複/無効シフトをスキップ）`
        : `${validShifts.length}件のシフトを生成しました`,
      shifts: validShifts,
    }
  } catch (error: unknown) {
    if (error instanceof APIConnectionTimeoutError) {
      logger.error('OpenAI API timeout', { action: 'generateWeeklyShifts' }, error)
      return {
        success: false,
        message: 'AI応答がタイムアウトしました。しばらく待ってから再度お試しください。',
      }
    }

    if (error instanceof RateLimitError) {
      logger.error('OpenAI API rate limit', { action: 'generateWeeklyShifts' }, error)
      return {
        success: false,
        message: 'AI APIのレート制限に達しました。しばらく待ってから再度お試しください。',
      }
    }

    if (error instanceof APIError) {
      logger.error('OpenAI API error', { action: 'generateWeeklyShifts', status: error.status }, error)
      return {
        success: false,
        message: 'AI APIエラーが発生しました。しばらく待ってから再度お試しください。',
      }
    }

    logger.error('Unexpected error in AI shift generation', { action: 'generateWeeklyShifts' }, error)
    return {
      success: false,
      message: 'シフト生成中に予期しないエラーが発生しました。',
    }
  }
}

export async function createAIGeneratedShifts(shifts: ShiftAssignment[]) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from('shifts').insert(shifts).select()

    if (error) {
      handleSupabaseError(error, { action: 'createAIGeneratedShifts', entity: 'シフト' })
    }

    return {
      success: true,
      message: `${data.length}件のシフトを作成しました。`,
      data,
    }
  } catch (error: unknown) {
    logger.error('Error creating AI generated shifts', { action: 'createAIGeneratedShifts' }, error)
    return {
      success: false,
      message: 'シフトの保存中にエラーが発生しました。',
    }
  }
}
