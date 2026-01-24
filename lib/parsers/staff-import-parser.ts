import ExcelJS from 'exceljs'

export interface ParsedStaffRow {
  rowNumber: number
  employee_number: string
  name: string
  email?: string
  phone?: string
  roleName?: string
  tagNames?: string[]
  error?: string
}

export interface StaffImportParseResult {
  rows: ParsedStaffRow[]
  errors: string[]
  warnings: string[]
}

// ヘッダー名 → フィールドのマッピング
const HEADER_MAP: Record<string, keyof Omit<ParsedStaffRow, 'rowNumber' | 'error' | 'tagNames'>> = {
  '社員番号': 'employee_number',
  '氏名': 'name',
  '名前': 'name',
  'メール': 'email',
  'メールアドレス': 'email',
  'email': 'email',
  '電話番号': 'phone',
  '電話': 'phone',
  'phone': 'phone',
  '役職': 'roleName',
  'タグ': 'roleName', // tagNamesは特別処理
}

// タグ列のヘッダー候補
const TAG_HEADERS = ['タグ', 'tags', 'tag']

/**
 * Excel/CSVファイルからスタッフデータをパースする
 */
export async function parseStaffImportFile(file: File): Promise<StaffImportParseResult> {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcel(file)
  } else if (fileName.endsWith('.csv')) {
    return parseCSV(file)
  }

  return {
    rows: [],
    errors: ['対応していないファイル形式です。Excel (.xlsx) または CSV (.csv) をアップロードしてください。'],
    warnings: [],
  }
}

/**
 * Excelファイルのパース
 */
async function parseExcel(file: File): Promise<StaffImportParseResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(Buffer.from(arrayBuffer) as any)

    if (workbook.worksheets.length === 0) {
      return { rows: [], errors: ['シートが見つかりません'], warnings: [] }
    }

    const sheet = workbook.worksheets[0]
    const data: string[][] = []
    sheet.eachRow((row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : []
      data.push(values.map((v) => (v != null ? String(v).trim() : '')))
    })

    if (data.length === 0) {
      return { rows: [], errors: ['データが空です'], warnings: [] }
    }

    return parseRows(data, errors, warnings)
  } catch (e: any) {
    return { rows: [], errors: [`Excelファイルの読み込みに失敗しました: ${e.message}`], warnings: [] }
  }
}

/**
 * CSVファイルのパース
 */
async function parseCSV(file: File): Promise<StaffImportParseResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')

    if (lines.length === 0) {
      return { rows: [], errors: ['データが空です'], warnings: [] }
    }

    const data = lines.map((line) => parseCSVLine(line))
    return parseRows(data, errors, warnings)
  } catch (e: any) {
    return { rows: [], errors: [`CSVファイルの読み込みに失敗しました: ${e.message}`], warnings: [] }
  }
}

/**
 * CSVの1行をパース（クォート対応）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/**
 * ヘッダー行+データ行の共通パース処理
 */
function parseRows(
  data: string[][],
  errors: string[],
  warnings: string[]
): StaffImportParseResult {
  const headerRow = data[0]
  const columnMap = mapHeaders(headerRow)

  // 必須列チェック
  if (columnMap.employee_number === -1) {
    errors.push('「社員番号」列が見つかりません。ヘッダー行を確認してください。')
  }
  if (columnMap.name === -1) {
    errors.push('「氏名」列が見つかりません。ヘッダー行を確認してください。')
  }
  if (errors.length > 0) {
    return { rows: [], errors, warnings }
  }

  const rows: ParsedStaffRow[] = []
  const seenEmployeeNumbers = new Set<string>()

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const rowNumber = i + 1

    // 全セル空の行はスキップ
    if (row.every((cell) => cell === '')) continue

    const employee_number = row[columnMap.employee_number] || ''
    const name = row[columnMap.name] || ''

    // 必須フィールドチェック
    if (!employee_number) {
      rows.push({ rowNumber, employee_number: '', name, error: '社員番号が空です' })
      continue
    }
    if (!name) {
      rows.push({ rowNumber, employee_number, name: '', error: '氏名が空です' })
      continue
    }

    // ファイル内重複チェック
    if (seenEmployeeNumbers.has(employee_number)) {
      warnings.push(`${rowNumber}行目: 社員番号「${employee_number}」がファイル内で重複しています（スキップ）`)
      rows.push({ rowNumber, employee_number, name, error: 'ファイル内重複' })
      continue
    }
    seenEmployeeNumbers.add(employee_number)

    const parsedRow: ParsedStaffRow = {
      rowNumber,
      employee_number,
      name,
    }

    // オプショナルフィールド
    if (columnMap.email !== -1 && row[columnMap.email]) {
      parsedRow.email = row[columnMap.email]
    }
    if (columnMap.phone !== -1 && row[columnMap.phone]) {
      parsedRow.phone = row[columnMap.phone]
    }
    if (columnMap.roleName !== -1 && row[columnMap.roleName]) {
      parsedRow.roleName = row[columnMap.roleName]
    }
    if (columnMap.tagNames !== -1 && row[columnMap.tagNames]) {
      parsedRow.tagNames = row[columnMap.tagNames]
        .split(/[,、]/)
        .map((t) => t.trim())
        .filter((t) => t !== '')
    }

    rows.push(parsedRow)
  }

  if (rows.length === 0) {
    errors.push('有効なデータ行がありません')
  }

  return { rows, errors, warnings }
}

/**
 * ヘッダー行からカラムインデックスをマッピング
 */
function mapHeaders(headerRow: string[]): {
  employee_number: number
  name: number
  email: number
  phone: number
  roleName: number
  tagNames: number
} {
  const result = {
    employee_number: -1,
    name: -1,
    email: -1,
    phone: -1,
    roleName: -1,
    tagNames: -1,
  }

  headerRow.forEach((header, index) => {
    const normalized = header.toLowerCase().trim()

    if (normalized === '社員番号' || normalized === 'employee_number') {
      result.employee_number = index
    } else if (normalized === '氏名' || normalized === '名前' || normalized === 'name') {
      result.name = index
    } else if (normalized === 'メール' || normalized === 'メールアドレス' || normalized === 'email') {
      result.email = index
    } else if (normalized === '電話番号' || normalized === '電話' || normalized === 'phone') {
      result.phone = index
    } else if (normalized === '役職' || normalized === 'role') {
      result.roleName = index
    } else if (TAG_HEADERS.includes(normalized)) {
      result.tagNames = index
    }
  })

  return result
}
