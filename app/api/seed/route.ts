import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed/seed-data'

export async function POST(request: Request) {
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
