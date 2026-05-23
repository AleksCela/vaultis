import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const events = await prisma.riskEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // Pseudonymize: return only first 8 chars of userId
  const pseudonymized = events.map(e => ({
    ...e,
    userId: e.userId.slice(0, 8),
  }))

  return NextResponse.json(pseudonymized)
}
