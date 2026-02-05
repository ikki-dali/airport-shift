import { NextResponse } from 'next/server'
import { seedDemoData } from '@/lib/seed/demo-data'

export async function POST() {
  // 本番環境では無効化（データ削除リスク防止）
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_SEED_ENDPOINT) {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    )
  }

  try {
    const result = await seedDemoData()

    return NextResponse.json({
      success: true,
      message: 'Demo data seeding completed successfully',
      result,
    })
  } catch (error) {
    console.error('Demo seeding error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
