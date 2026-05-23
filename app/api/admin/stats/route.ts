import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [totalUsers, totalTransactions, pendingQueue, blockedCount, riskEventsToday] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: 'PENDING_ADMIN' } }),
    prisma.transaction.count({ where: { status: 'BLOCKED' } }),
    prisma.riskEvent.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
  ])

  return NextResponse.json({ totalUsers, totalTransactions, pendingQueue, blockedCount, riskEventsToday })
}
