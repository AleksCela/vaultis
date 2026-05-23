import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { txId } = await req.json()
  const tx = await prisma.transaction.findUnique({ where: { id: txId } })

  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (tx.senderId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.transaction.update({
    where: { id: txId },
    data: { status: 'CANCELLED', resolvedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
