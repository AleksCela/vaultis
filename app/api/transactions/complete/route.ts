import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { txId } = await req.json()
  const tx = await prisma.transaction.findUnique({
    where: { id: txId },
    include: { sender: true, receiver: true },
  })

  if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  if (tx.senderId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (tx.status === 'COMPLETED' || tx.status === 'BLOCKED' || tx.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Transaction already resolved' }, { status: 400 })
  }

  // Re-check balance at completion time (cents math)
  const senderBalanceCents = Math.round(tx.sender.balance * 100)
  const amountCents = Math.round(tx.amount * 100)
  if (amountCents > senderBalanceCents) {
    return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
  }

  const receiverBalanceCents = Math.round(tx.receiver.balance * 100) + amountCents

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tx.senderId },
      data: { balance: (senderBalanceCents - amountCents) / 100 },
    }),
    prisma.user.update({
      where: { id: tx.receiverId },
      data: { balance: receiverBalanceCents / 100 },
    }),
    prisma.transaction.update({
      where: { id: txId },
      data: { status: 'COMPLETED', resolvedAt: new Date() },
    }),
  ])

  return NextResponse.json({ ok: true })
}
