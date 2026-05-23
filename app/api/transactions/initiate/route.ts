import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runFraudEngine } from '@/lib/fraud/engine'

const STATUS_MAP: Record<string, string> = {
  ALLOW: 'COMPLETED',
  STEP_UP_PIN: 'PENDING_STEP_UP',
  STEP_UP_BIOMETRIC: 'PENDING_BIOMETRIC',
  COOLING_OFF: 'COOLING_OFF',
  ADMIN_QUEUE: 'PENDING_ADMIN',
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { receiverIban, amount, description, deviceHash, deviceCountry } = await req.json()

  if (!receiverIban || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const sender = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 })

  // Cents-safe balance check
  const amountCents = Math.round(amount * 100)
  const balanceCents = Math.round(sender.balance * 100)
  if (amountCents > balanceCents) {
    return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
  }

  const receiver = await prisma.user.findUnique({ where: { iban: receiverIban } })
  if (!receiver) return NextResponse.json({ error: 'Recipient IBAN not found' }, { status: 404 })
  if (receiver.id === sender.id) return NextResponse.json({ error: 'Cannot send to yourself' }, { status: 400 })

  const hour = new Date().getHours()
  const fraudResult = await runFraudEngine({
    senderId: sender.id,
    receiverIban,
    amount,
    deviceHash: deviceHash || null,
    deviceCountry: deviceCountry || null,
    hour,
  })

  // Upsert device session if consent given and deviceHash present
  if (deviceHash) {
    await prisma.deviceSession.upsert({
      where: { id: 'noop' },
      create: {
        userId: sender.id,
        deviceHash,
        countryCode: deviceCountry || null,
        consentGiven: true,
        lastSeen: new Date(),
      },
      update: {},
    }).catch(() => {
      // Upsert by hash+userId — findFirst + create pattern
    })

    const existing = await prisma.deviceSession.findFirst({
      where: { userId: sender.id, deviceHash },
    })
    if (!existing) {
      await prisma.deviceSession.create({
        data: {
          userId: sender.id,
          deviceHash,
          countryCode: deviceCountry || null,
          consentGiven: true,
        },
      })
    } else {
      await prisma.deviceSession.update({
        where: { id: existing.id },
        data: { lastSeen: new Date(), countryCode: deviceCountry || existing.countryCode },
      })
    }
  }

  const status = STATUS_MAP[fraudResult.action] ?? 'PENDING_ADMIN'
  const cooldownEndsAt =
    fraudResult.action === 'COOLING_OFF'
      ? new Date(Date.now() + 30 * 60 * 1000)
      : null

  const tx = await prisma.transaction.create({
    data: {
      senderId: sender.id,
      receiverId: receiver.id,
      amount,
      description: description || null,
      status,
      riskScore: fraudResult.score,
      riskFlags: JSON.stringify(fraudResult.flags),
      riskAction: fraudResult.action,
      cooldownEndsAt,
    },
  })

  // Save risk event
  await prisma.riskEvent.create({
    data: {
      userId: sender.id,
      transactionId: tx.id,
      score: fraudResult.score,
      flags: JSON.stringify(fraudResult.flags),
      action: fraudResult.action,
    },
  })

  // If ALLOW, deduct immediately
  if (fraudResult.action === 'ALLOW') {
    const newBalanceCents = balanceCents - amountCents
    const receiverBalanceCents = Math.round(receiver.balance * 100) + amountCents
    await prisma.$transaction([
      prisma.user.update({
        where: { id: sender.id },
        data: { balance: newBalanceCents / 100 },
      }),
      prisma.user.update({
        where: { id: receiver.id },
        data: { balance: receiverBalanceCents / 100 },
      }),
      prisma.transaction.update({
        where: { id: tx.id },
        data: { resolvedAt: new Date() },
      }),
    ])
  }

  return NextResponse.json({
    txId: tx.id,
    action: fraudResult.action,
    score: fraudResult.score,
    status,
  })
}
