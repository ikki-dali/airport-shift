# TICKET-013: Excel/CSV出力機能

## ステータス
📋 未着手

## 優先度
⭐⭐⭐⭐ 高

## 複雑度
Medium

## 概要
確定シフトをExcel/CSV形式で出力

## 成果物
- [ ] `/lib/exporters/excel-exporter.ts` - Excel出力ロジック
- [ ] `/lib/exporters/csv-exporter.ts` - CSV出力ロジック
- [ ] `/app/api/shifts/export/route.ts` - エクスポートAPI
- [ ] `/components/shifts/ExportButton.tsx` - 出力ボタン

## 依存関係
- TICKET-010: ドラッグ&ドロップ実装

## 機能要件

### Excel出力
- exceljsライブラリを使用
- 現行フォーマットに準じた形式
- 複数シート対応
  - シフト一覧シート
  - 配属箇所別シート
  - スタッフ別シート
- スタイリング
  - ヘッダー行の背景色
  - 罫線
  - セル幅の自動調整

### CSV出力
- シンプルなCSV形式
- UTF-8 BOM付き（Excel対応）
- カンマ区切り

### 出力形式

#### Excel - シフト一覧シート
```
| 日付       | スタッフ名 | 社員番号 | 配属箇所 | 勤務記号 | 開始時刻 | 終了時刻 | 勤務時間 | ステータス |
|-----------|-----------|---------|---------|---------|---------|---------|---------|-----------|
| 2025-12-01 | 山田太郎 | 0001    | T3中央  | 06G5DA  | 06:30   | 11:45   | 5:15    | 確定      |
| 2025-12-01 | 佐藤花子 | 0002    | T3北    | 06J0AW  | 06:45   | 16:45   | 10:00   | 確定      |
```

#### Excel - 配属箇所別シート
```
T3中央 - 2025年12月

| 日付       | 勤務記号 | スタッフ名 | 役職 | 開始時刻 | 終了時刻 |
|-----------|---------|-----------|------|---------|---------|
| 2025-12-01 | 06G5DA | 山田太郎  | リーダー | 06:30 | 11:45 |
| 2025-12-01 | 06G5DA | 鈴木次郎  | 一般 | 06:30 | 11:45 |
```

#### Excel - スタッフ別シート（月次カレンダー形式）
```
スタッフ: 山田太郎 (0001)

| 日付 | 1   | 2   | 3   | 4   | ... | 31  |
|-----|-----|-----|-----|-----|-----|-----|
| 配属 | T3中央 | T3北 | 休 | T3中央 | ... | T3中央 |
| 記号 | 06G5DA | 06J0AW | - | 06G5DA | ... | 06G5DA |
```

#### CSV形式
```csv
日付,スタッフ名,社員番号,配属箇所,勤務記号,開始時刻,終了時刻,勤務時間,ステータス
2025-12-01,山田太郎,0001,T3中央,06G5DA,06:30,11:45,5:15,確定
2025-12-01,佐藤花子,0002,T3北,06J0AW,06:45,16:45,10:00,確定
```

## 実装例

### excel-exporter.ts
```typescript
import ExcelJS from 'exceljs'

interface ShiftExportData {
  date: string
  staffName: string
  employeeNumber: string
  locationName: string
  dutyCode: string
  startTime: string
  endTime: string
  duration: string
  status: string
  roleName?: string
}

export async function generateExcel(
  shifts: ShiftExportData[],
  yearMonth: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()

  // シフト一覧シート
  const summarySheet = workbook.addWorksheet('シフト一覧')

  // ヘッダー行
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

  summarySheet.addRow(headers)

  // ヘッダーのスタイリング
  summarySheet.getRow(1).font = { bold: true }
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  // データ行
  shifts.forEach((shift) => {
    summarySheet.addRow([
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
  })

  // 列幅の自動調整
  summarySheet.columns.forEach((column) => {
    let maxLength = 0
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const length = cell.value ? cell.value.toString().length : 10
      if (length > maxLength) {
        maxLength = length
      }
    })
    column.width = maxLength < 10 ? 10 : maxLength + 2
  })

  // 配属箇所別シートの作成
  const locationGroups = groupByLocation(shifts)
  Object.entries(locationGroups).forEach(([locationName, locationShifts]) => {
    createLocationSheet(workbook, locationName, locationShifts, yearMonth)
  })

  // スタッフ別シートの作成
  const staffGroups = groupByStaff(shifts)
  Object.entries(staffGroups).forEach(([staffName, staffShifts]) => {
    createStaffSheet(workbook, staffName, staffShifts, yearMonth)
  })

  // Bufferとして返却
  return await workbook.xlsx.writeBuffer() as Buffer
}

function createLocationSheet(
  workbook: ExcelJS.Workbook,
  locationName: string,
  shifts: ShiftExportData[],
  yearMonth: string
) {
  const sheet = workbook.addWorksheet(locationName)

  sheet.addRow([`${locationName} - ${yearMonth}`])
  sheet.addRow([]) // 空行

  const headers = ['日付', '勤務記号', 'スタッフ名', '役職', '開始時刻', '終了時刻']
  sheet.addRow(headers)

  sheet.getRow(3).font = { bold: true }
  sheet.getRow(3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  shifts.forEach((shift) => {
    sheet.addRow([
      shift.date,
      shift.dutyCode,
      shift.staffName,
      shift.roleName || '',
      shift.startTime,
      shift.endTime,
    ])
  })
}

function createStaffSheet(
  workbook: ExcelJS.Workbook,
  staffName: string,
  shifts: ShiftExportData[],
  yearMonth: string
) {
  const sheet = workbook.addWorksheet(`${staffName.substring(0, 20)}...`) // シート名は31文字制限

  // カレンダー形式で表示
  sheet.addRow([`スタッフ: ${staffName} (${shifts[0]?.employeeNumber || ''})`])
  sheet.addRow([])

  // 日付ヘッダー
  const daysInMonth = new Date(
    parseInt(yearMonth.split('-')[0]),
    parseInt(yearMonth.split('-')[1]),
    0
  ).getDate()

  const dateHeader = ['', ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  sheet.addRow(dateHeader)

  // 配属箇所行
  const locationRow = ['配属']
  const dutyCodeRow = ['記号']

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${yearMonth}-${day.toString().padStart(2, '0')}`
    const shift = shifts.find((s) => s.date === date)

    locationRow.push(shift?.locationName || '休')
    dutyCodeRow.push(shift?.dutyCode || '-')
  }

  sheet.addRow(locationRow)
  sheet.addRow(dutyCodeRow)
}

function groupByLocation(shifts: ShiftExportData[]) {
  return shifts.reduce((acc, shift) => {
    if (!acc[shift.locationName]) {
      acc[shift.locationName] = []
    }
    acc[shift.locationName].push(shift)
    return acc
  }, {} as Record<string, ShiftExportData[]>)
}

function groupByStaff(shifts: ShiftExportData[]) {
  return shifts.reduce((acc, shift) => {
    if (!acc[shift.staffName]) {
      acc[shift.staffName] = []
    }
    acc[shift.staffName].push(shift)
    return acc
  }, {} as Record<string, ShiftExportData[]>)
}
```

### csv-exporter.ts
```typescript
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

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  // UTF-8 BOM付き
  return '\uFEFF' + csvContent
}
```

### API Route
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExcel } from '@/lib/exporters/excel-exporter'
import { generateCSV } from '@/lib/exporters/csv-exporter'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const yearMonth = searchParams.get('yearMonth')
  const format = searchParams.get('format') || 'excel'

  if (!yearMonth) {
    return NextResponse.json({ error: 'yearMonth is required' }, { status: 400 })
  }

  const supabase = await createClient()

  // シフトデータ取得
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select(`
      *,
      staff (name, employee_number),
      locations (location_name),
      duty_codes (code, start_time, end_time, duration_hours, duration_minutes)
    `)
    .gte('date', `${yearMonth}-01`)
    .lt('date', `${yearMonth}-32`)
    .eq('status', '確定')
    .order('date')
    .order('staff_id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // データ整形
  const exportData = shifts.map((shift) => ({
    date: shift.date,
    staffName: shift.staff.name,
    employeeNumber: shift.staff.employee_number,
    locationName: shift.locations.location_name,
    dutyCode: shift.duty_codes.code,
    startTime: shift.duty_codes.start_time,
    endTime: shift.duty_codes.end_time,
    duration: `${shift.duty_codes.duration_hours}:${shift.duty_codes.duration_minutes.toString().padStart(2, '0')}`,
    status: shift.status,
  }))

  if (format === 'excel') {
    const buffer = await generateExcel(exportData, yearMonth)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="shift_${yearMonth}.xlsx"`,
      },
    })
  } else if (format === 'csv') {
    const csvContent = generateCSV(exportData)

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="shift_${yearMonth}.csv"`,
      },
    })
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
}
```

### ExportButton.tsx
```typescript
'use client'

import { useState } from 'react'

interface ExportButtonProps {
  yearMonth: string
}

export function ExportButton({ yearMonth }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'excel' | 'csv') => {
    setIsExporting(true)

    try {
      const response = await fetch(
        `/api/shifts/export?yearMonth=${yearMonth}&format=${format}`
      )

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shift_${yearMonth}.${format === 'excel' ? 'xlsx' : 'csv'}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('エクスポートに失敗しました')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('excel')}
        disabled={isExporting}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        Excel出力
      </button>
      <button
        onClick={() => handleExport('csv')}
        disabled={isExporting}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        CSV出力
      </button>
    </div>
  )
}
```

## テスト項目
- [ ] Excelファイルが正しく生成される
- [ ] CSVファイルが正しく生成される
- [ ] 複数シートが正しく作成される
- [ ] スタイリングが適用される
- [ ] ダウンロードが正常に動作する
- [ ] 大量データ（1000件以上）でも正常に動作する
- [ ] 日本語が正しく表示される

## ブロッカー
⚠️ **現行のExcelフォーマットのサンプルが必要**

実際の出力フォーマットを確認してから実装する必要があります。

## 完了条件
- [ ] Excel出力が正常に動作する
- [ ] CSV出力が正常に動作する
- [ ] 現行フォーマットに準じた形式になっている
- [ ] パフォーマンスが良好

## 見積もり工数
8-10時間（フォーマット確認後）

## 並行開発可能
✅ TICKET-012（バリデーションロジック強化）と並行開発可能

## 開始予定日
2025-11-25

## 完了予定日
2025-11-26
