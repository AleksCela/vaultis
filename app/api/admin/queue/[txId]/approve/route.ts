import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ txId: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { txId } = await params
  const { note } = await req.json().catch(() => ({ note: undefined }))

  const tx = await prisma.transaction.findUnique({
    where: { id: txId },
    include: { sender: true, receiver: true },
  })
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (tx.status !== 'PENDING_ADMIN') return NextResponse.json({ error: 'Not in queue' }, { status: 400 })

  const senderCents = Math.round(tx.sender.balance * 100)
  const amountCents = Math.round(tx.amount * 100)
  if (amountCents > senderCents) {
    await prisma.transaction.update({
      where: { id: txId },
      data: { status: 'BLOCKED', adminNote: 'Insufficient funds at approval time', resolvedAt: new Date() },
    })
    return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: tx.senderId }, data: { balance: (senderCents - amountCents) / 100 } }),
    prisma.user.update({ where: { id: tx.receiverId }, data: { balance: (Math.round(tx.receiver.balance * 100) + amountCents) / 100 } }),
    prisma.transaction.update({
      where: { id: txId },
      data: { status: 'COMPLETED', adminNote: note || null, resolvedAt: new Date() },
    }),
  ])

  console.log('[AUDIT]', session.adminId, 'APPROVE', txId, new Date().toISOString())
  // TODO: Replace with DB audit table in production
  return NextResponse.json({ ok: true })
}
