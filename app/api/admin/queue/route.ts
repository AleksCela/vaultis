import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const queue = await prisma.transaction.findMany({
    where: { status: 'PENDING_ADMIN' },
    include: {
      sender: { select: { fullName: true, email: true, iban: true } },
      receiver: { select: { fullName: true, iban: true, country: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(queue)
}
