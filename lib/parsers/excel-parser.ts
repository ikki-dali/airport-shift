import * as XLSX from 'xlsx'

export interface ParsedRequest {
  staffId: string
  staffName: string
  date: string
  requestType: '◯' | '休' | '早朝' | '早番' | '遅番' | '夜勤'
}

export interface ParseResult {
  yearMonth: string
  requests: ParsedRequest[]
  errors: string[]
  warnings: string[]
  detectedStaffCount: number
  totalRequestCount: number
}

interface StaffInfo {
  id: string
  name: string
  employee_number: string
}

export async function parseExcelFile(
  file: File,
  staffList: StaffInfo[]
): Promise<ParseResult> {
  const requests: ParsedRequest[] = []
  const errors: string[] = []
  const warnings: string[] = []
  const detectedStaff = new Set<string>()

  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    if (workbook.SheetNames.length === 0) {
      errors.push('シートが見つかりません')
      return {
        yearMonth: '',
        requests,
        errors,
        warnings,
        detectedStaffCount: 0,
        totalRequestCount: 0,
      }
    }

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]

    if (data.length === 0) {
      errors.push('データが空です')
      return {
        yearMonth: '',
        requests,
        errors,
        warnings,
        detectedStaffCount: 0,
        totalRequestCount: 0,
      }
    }

    // ヘッダー行の解析
    const headerRow = data[0] as any[]
    const dateColumns: { index: number; date: string; month: number; day: number }[] = []

    // 日付列の検出（12/1, 12/2 などの形式）
    headerRow.forEach((cell, index) => {
      const cellStr = String(cell || '').trim()
      const match = cellStr.match(/^(\d{1,2})\/(\d{1,2})$/)
      if (match) {
        const month = parseInt(match[1], 10)
        const day = parseInt(match[2], 10)
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          dateColumns.push({ index, date: cellStr, month, day })
        }
      }
    })

    if (dateColumns.length === 0) {
      errors.push('日付列が見つかりません（形式: M/D）')
      return {
        yearMonth: '',
        requests,
        errors,
        warnings,
        detectedStaffCount: 0,
        totalRequestCount: 0,
      }
    }

    // 年月の推定（最初の日付から）
    const firstMonth = dateColumns[0].month
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    // 現在月より前の月なら来年、以降なら今年と推定
    const year = firstMonth < currentMonth ? currentYear + 1 : currentYear
    const yearMonth = `${year}-${String(firstMonth).padStart(2, '0')}`

    // 有効な希望タイプ
    const validTypes = ['◯', '○', '休', '早朝', '早番', '遅番', '夜勤']

    // データ行の解析
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[]

      if (!row || row.length === 0) continue

      // スタッフ情報の抽出
      // パターン1: 社員番号 | 氏名 | ...
      // パターン2: 氏名 | ...
      let staff: StaffInfo | undefined
      let staffIdentifier = ''

      // 1列目をチェック
      const col0 = String(row[0] || '').trim()
      const col1 = String(row[1] || '').trim()

      // 社員番号（4桁数字）がある場合
      if (/^\d{4}$/.test(col0)) {
        staff = staffList.find((s) => s.employee_number === col0)
        staffIdentifier = col1 || col0
      } else {
        // 氏名で検索
        staff = staffList.find((s) => s.name === col0)
        staffIdentifier = col0
      }

      if (!staff) {
        if (staffIdentifier && staffIdentifier !== '氏名' && staffIdentifier !== '社員番号') {
          warnings.push(`スタッフが見つかりません: ${staffIdentifier}`)
        }
        continue
      }

      detectedStaff.add(staff.id)

      // 各日付の希望を解析
      dateColumns.forEach(({ index, month, day }) => {
        const requestValue = String(row[index] || '').trim()

        if (requestValue) {
          // 全角○を半角◯に統一
          const normalizedValue = requestValue.replace('○', '◯')

          if (validTypes.includes(normalizedValue)) {
            const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

            requests.push({
              staffId: staff.id,
              staffName: staff.name,
              date: fullDate,
              requestType: normalizedValue as ParsedRequest['requestType'],
            })
          } else {
            // 空白や"-"などは無視
            if (normalizedValue !== '-' && normalizedValue !== '') {
              warnings.push(
                `不正な希望タイプ: "${requestValue}" (${staff.name}, ${month}/${day})`
              )
            }
          }
        }
      })
    }

    return {
      yearMonth,
      requests,
      errors,
      warnings,
      detectedStaffCount: detectedStaff.size,
      totalRequestCount: requests.length,
    }
  } catch (error) {
    errors.push(`ファイル読み込みエラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    return {
      yearMonth: '',
      requests,
      errors,
      warnings,
      detectedStaffCount: 0,
      totalRequestCount: 0,
    }
  }
}
