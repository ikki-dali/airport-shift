'use server'

import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import type { StaffWithRole } from './staff'
import type { Location } from './locations'
import type { DutyCode } from './duty-codes'
import { format } from 'date-fns'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

export async function generateWeeklyShifts(
  weekStartStr: string,
  weekEndStr: string,
  staff: StaffWithRole[],
  locations: Location[],
  dutyCodes: DutyCode[],
  existingShifts: ShiftAssignment[] = [],
  shiftRequests: ShiftRequestData[] = []
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
${locations.map((l) => `配属箇所名: ${l.location_name}
  UUID: ${l.id}`).join('\n\n')}

【勤務記号】
${dutyCodes.map((dc) => `勤務記号コード: ${dc.code}
  UUID: ${dc.id}
  時間: ${dc.start_time}-${dc.end_time} (${dc.duration_hours}時間${dc.duration_minutes}分)`).join('\n\n')}

【既存のシフト（この週で既に登録済み）】
${existingShifts.length > 0
  ? existingShifts.map((s) => {
      const staffName = staff.find(st => st.id === s.staff_id)?.name || '不明'
      const locationName = locations.find(l => l.id === s.location_id)?.location_name || '不明'
      return `- ${s.date}: ${staffName} を ${locationName} に配置済み`
    }).join('\n')
  : '（既存シフトなし）'
}

【スタッフの希望（メール等で受け取った希望）】
${shiftRequests.length > 0
  ? shiftRequests.map((r) => {
      const staffName = staff.find(s => s.id === r.staff_id)?.name || '不明'
      return `- ${r.date}: ${staffName} は「${r.request_type}」を希望`
    }).join('\n')
  : '（希望なし）'
}

【制約条件】
1. 各スタッフは1日1シフトまで（既存シフトも含めて重複不可）
2. スタッフの希望を最優先に考慮すること：
   - 「休」希望の日にはそのスタッフを絶対にシフトに入れない
   - 「◯」希望の日にはできるだけそのスタッフをシフトに入れる
   - 「早朝」「早番」「遅番」「夜勤」希望の場合は、該当する時間帯の勤務記号を割り当てる
3. 連続勤務は最大6日まで
4. 週40時間を超えないように配分
5. 各配属箇所に毎日最低1人は配置
6. できるだけ公平に勤務を配分

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

効率的で公平なシフトを作成してください。`

    // OpenAI APIを呼び出し
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'あなたはシフト作成の専門家です。与えられた条件に基づいて、最適なシフトをJSON形式で出力します。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      return {
        success: false,
        message: 'AI応答が空でした。',
      }
    }

    // JSONをパース
    const parsedResponse = JSON.parse(responseText)
    const shifts: ShiftAssignment[] = parsedResponse.shifts || parsedResponse

    // バリデーション
    if (!Array.isArray(shifts) || shifts.length === 0) {
      return {
        success: false,
        message: 'AIが生成したシフトの形式が不正です。',
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

    // 各シフトのIDをバリデーション
    const invalidShifts: string[] = []
    const generatedShiftMap = new Map<string, number>() // 生成されたシフト内での重複チェック
    for (let i = 0; i < shifts.length; i++) {
      const shift = shifts[i]
      const errors: string[] = []
      const shiftKey = `${shift.staff_id}_${shift.date}`

      // 既存シフトとの重複チェック
      if (existingShiftMap.has(shiftKey)) {
        const staffName = staff.find(s => s.id === shift.staff_id)?.name || shift.staff_id
        errors.push(`${staffName} は ${shift.date} に既にシフトが登録されています`)
      }

      // 生成されたシフト内での重複チェック
      if (generatedShiftMap.has(shiftKey)) {
        const staffName = staff.find(s => s.id === shift.staff_id)?.name || shift.staff_id
        const prevIndex = generatedShiftMap.get(shiftKey)!
        errors.push(`${staffName} の ${shift.date} のシフトが重複（シフト${prevIndex + 1}と重複）`)
      } else {
        generatedShiftMap.set(shiftKey, i)
      }

      if (!validStaffIds.has(shift.staff_id)) {
        errors.push(`無効なスタッフID: ${shift.staff_id}`)
      }
      if (!validLocationIds.has(shift.location_id)) {
        errors.push(`無効な配属箇所ID: ${shift.location_id}`)
      }
      if (!validDutyCodeIds.has(shift.duty_code_id)) {
        errors.push(`無効な勤務記号ID: ${shift.duty_code_id}`)
      }

      if (errors.length > 0) {
        invalidShifts.push(`シフト${i + 1}: ${errors.join(', ')}`)
      }
    }

    if (invalidShifts.length > 0) {
      console.error('Invalid shifts detected:', invalidShifts)
      return {
        success: false,
        message: `AIが生成したシフトに無効なIDが含まれています:\n${invalidShifts.join('\n')}`,
      }
    }

    console.log('AI generated shifts validation passed:', shifts.length, 'shifts')

    return {
      success: true,
      message: `${shifts.length}件のシフトを生成しました。`,
      shifts,
    }
  } catch (error: any) {
    console.error('AI shift generation error:', error)
    return {
      success: false,
      message: `エラーが発生しました: ${error.message}`,
    }
  }
}

export async function createAIGeneratedShifts(shifts: ShiftAssignment[]) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from('shifts').insert(shifts).select()

    if (error) throw error

    return {
      success: true,
      message: `${data.length}件のシフトを作成しました。`,
      data,
    }
  } catch (error: any) {
    console.error('Error creating AI generated shifts:', error)
    return {
      success: false,
      message: `シフト作成エラー: ${error.message}`,
    }
  }
}
