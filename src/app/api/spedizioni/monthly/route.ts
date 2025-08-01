import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // Format: YYYY-MM
    const sede = searchParams.get('sede')

    if (!month || !sede) {
      return NextResponse.json(
        { error: 'Month and sede parameters are required' },
        { status: 400 }
      )
    }

    // Calculate start and end dates for the month
    const startDate = new Date(`${month}-01T00:00:00.000Z`)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 1)

    const spedizioni = await prisma.spedizione.findMany({
      where: {
        sede: sede,
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(spedizioni)
  } catch (error) {
    console.error('Error fetching monthly spedizioni:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}