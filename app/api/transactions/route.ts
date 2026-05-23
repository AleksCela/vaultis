import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const txs = await prisma.transaction.findMany({
    where: {
      OR: [{ senderId: session.userId }, { receiverId: session.userId }],
    },
    include: {
      sender: { select: { fullName: true, iban: true } },
      receiver: { select: { fullName: true, iban: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(txs)
}
