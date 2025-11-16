import { ShiftExportData } from './excel-exporter'

export function generateCSV(shifts: ShiftExportData[]): string {
  const headers = [
    '日付',
    'スタッフ名',
    '社員番号',
    '配属箇所',
    '勤務記号',
    '開始時刻',
    '終了時刻',
    '勤務時間',
    'ステータス',
  ]

  const rows = shifts.map((shift) => [
    shift.date,
    shift.staffName,
    shift.employeeNumber,
    shift.locationName,
    shift.dutyCode,
    shift.startTime,
    shift.endTime,
    shift.duration,
    shift.status,
  ])

  // CSVエスケープ処理
  const escapeCsvValue = (value: string): string => {
    // カンマ、ダブルクォート、改行を含む場合はダブルクォートで囲む
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // ダブルクォートは2つ重ねてエスケープ
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\n')

  // UTF-8 BOM付き（Excel対応）
  return '\uFEFF' + csvContent
}
