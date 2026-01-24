import ExcelJS from 'exceljs'

export interface ShiftExportData {
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
  createSummarySheet(workbook, shifts)

  // 配属箇所別シート
  const locationGroups = groupByLocation(shifts)
  Object.entries(locationGroups).forEach(([locationName, locationShifts]) => {
    createLocationSheet(workbook, locationName, locationShifts, yearMonth)
  })

  // スタッフ別シート
  const staffGroups = groupByStaff(shifts)
  Object.entries(staffGroups).forEach(([staffKey, staffShifts]) => {
    createStaffSheet(workbook, staffShifts, yearMonth)
  })

  // Bufferとして返却
  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer
}

function createSummarySheet(workbook: ExcelJS.Workbook, shifts: ShiftExportData[]) {
  const sheet = workbook.addWorksheet('シフト一覧')

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

  sheet.addRow(headers)

  // ヘッダーのスタイリング
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  // 罫線設定
  sheet.getRow(1).eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
  })

  // データ行
  shifts.forEach((shift) => {
    const row = sheet.addRow([
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

    // データ行にも罫線
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
  })

  // 列幅の自動調整
  sheet.columns.forEach((column, index) => {
    let maxLength = 10
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const length = cell.value ? cell.value.toString().length : 10
      if (length > maxLength) {
        maxLength = length
      }
    })
    column.width = Math.min(maxLength + 2, 50)
  })
}

function createLocationSheet(
  workbook: ExcelJS.Workbook,
  locationName: string,
  shifts: ShiftExportData[],
  yearMonth: string
) {
  // シート名は31文字制限
  const sheetName = locationName.length > 31 ? locationName.substring(0, 28) + '...' : locationName
  const sheet = workbook.addWorksheet(sheetName)

  // タイトル行
  sheet.addRow([`${locationName} - ${yearMonth}`])
  sheet.getRow(1).font = { bold: true, size: 14 }
  sheet.addRow([]) // 空行

  const headers = ['日付', '勤務記号', 'スタッフ名', '役職', '開始時刻', '終了時刻']
  sheet.addRow(headers)

  sheet.getRow(3).font = { bold: true }
  sheet.getRow(3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  // 罫線
  sheet.getRow(3).eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
  })

  // データ行
  shifts
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((shift) => {
      const row = sheet.addRow([
        shift.date,
        shift.dutyCode,
        shift.staffName,
        shift.roleName || '',
        shift.startTime,
        shift.endTime,
      ])

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })
    })

  // 列幅調整
  sheet.columns.forEach((column) => {
    let maxLength = 10
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const length = cell.value ? cell.value.toString().length : 10
      if (length > maxLength) {
        maxLength = length
      }
    })
    column.width = Math.min(maxLength + 2, 50)
  })
}

function createStaffSheet(
  workbook: ExcelJS.Workbook,
  shifts: ShiftExportData[],
  yearMonth: string
) {
  if (shifts.length === 0) return

  const staffName = shifts[0].staffName
  const employeeNumber = shifts[0].employeeNumber

  // シート名は31文字制限
  const sheetName =
    staffName.length > 20 ? `${staffName.substring(0, 17)}...` : `${staffName}`
  const sheet = workbook.addWorksheet(sheetName)

  // タイトル行
  sheet.addRow([`スタッフ: ${staffName} (${employeeNumber})`])
  sheet.getRow(1).font = { bold: true, size: 14 }
  sheet.addRow([])

  // カレンダー形式
  const [year, month] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()

  // 日付ヘッダー
  const dateHeader = ['', ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  sheet.addRow(dateHeader)

  sheet.getRow(3).font = { bold: true }
  sheet.getRow(3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  // 配属箇所行
  const locationRow = ['配属']
  const dutyCodeRow = ['記号']
  const timeRow = ['時間']

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${yearMonth}-${day.toString().padStart(2, '0')}`
    const shift = shifts.find((s) => s.date === date)

    locationRow.push(shift?.locationName || '休')
    dutyCodeRow.push(shift?.dutyCode || '-')
    timeRow.push(shift ? `${shift.startTime}-${shift.endTime}` : '-')
  }

  sheet.addRow(locationRow)
  sheet.addRow(dutyCodeRow)
  sheet.addRow(timeRow)

  // 列幅調整
  sheet.getColumn(1).width = 8
  for (let i = 2; i <= daysInMonth + 1; i++) {
    sheet.getColumn(i).width = 12
  }
}

function groupByLocation(shifts: ShiftExportData[]): Record<string, ShiftExportData[]> {
  return shifts.reduce(
    (acc, shift) => {
      if (!acc[shift.locationName]) {
        acc[shift.locationName] = []
      }
      acc[shift.locationName].push(shift)
      return acc
    },
    {} as Record<string, ShiftExportData[]>
  )
}

function groupByStaff(shifts: ShiftExportData[]): Record<string, ShiftExportData[]> {
  return shifts.reduce(
    (acc, shift) => {
      const key = `${shift.staffName}_${shift.employeeNumber}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(shift)
      return acc
    },
    {} as Record<string, ShiftExportData[]>
  )
}
