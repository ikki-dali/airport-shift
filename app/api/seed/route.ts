import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed/seed-data'

export async function POST(request: Request) {
  // 本番環境では無効化（データ削除リスク防止）
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_SEED_ENDPOINT) {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { clearExisting = false } = body

    const result = await seedDatabase({ clearExisting })

    return NextResponse.json({
      success: true,
      message: 'Database seeding completed successfully',
      result,
    })
  } catch (error) {
    console.error('Seeding error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
