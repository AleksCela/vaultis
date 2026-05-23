import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { txId, pin } = await req.json()

  const [tx, user] = await Promise.all([
    prisma.transaction.findUnique({ where: { id: txId }, include: { sender: true, receiver: true } }),
    prisma.user.findUnique({ where: { id: session.userId } }),
  ])

  if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  if (tx.senderId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (tx.status !== 'PENDING_STEP_UP') return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const valid = await bcrypt.compare(pin, user.pin)
  if (!valid) return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })

  // Complete transaction
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
