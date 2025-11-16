import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExcel, ShiftExportData } from '@/lib/exporters/excel-exporter'
import { generateCSV } from '@/lib/exporters/csv-exporter'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const yearMonth = searchParams.get('yearMonth')
  const format = searchParams.get('format') || 'excel'

  if (!yearMonth) {
    return NextResponse.json({ error: 'yearMonth is required' }, { status: 400 })
  }

  const supabase = await createClient()

  // シフトデータ取得（確定済みのみ）
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select(
      `
      *,
      staff:staff_id (
        name,
        employee_number,
        role_id,
        roles (
          name
        )
      ),
      location:location_id (
        location_name
      ),
      duty_code:duty_code_id (
        code,
        start_time,
        end_time,
        duration_hours,
        duration_minutes
      )
    `
    )
    .gte('date', `${yearMonth}-01`)
    .lt('date', `${yearMonth}-32`)
    .eq('status', '確定')
    .order('date')
    .order('staff_id')

  if (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!shifts || shifts.length === 0) {
    return NextResponse.json({ error: '確定済みシフトが見つかりません' }, { status: 404 })
  }

  // データ整形
  const exportData: ShiftExportData[] = shifts.map((shift: any) => {
    const durationHours = shift.duty_code.duration_hours
    const durationMinutes = shift.duty_code.duration_minutes
    const durationString = `${durationHours}:${durationMinutes.toString().padStart(2, '0')}`

    return {
      date: shift.date,
      staffName: shift.staff.name,
      employeeNumber: shift.staff.employee_number,
      locationName: shift.location.location_name,
      dutyCode: shift.duty_code.code,
      startTime: shift.duty_code.start_time,
      endTime: shift.duty_code.end_time,
      duration: durationString,
      status: shift.status,
      roleName: shift.staff.roles?.name,
    }
  })

  try {
    if (format === 'excel') {
      const buffer = await generateExcel(exportData, yearMonth)

      return new NextResponse(buffer as any, {
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
  } catch (error: any) {
    console.error('Export generation error:', error)
    return NextResponse.json(
      { error: `エクスポート生成エラー: ${error.message}` },
      { status: 500 }
    )
  }
}
