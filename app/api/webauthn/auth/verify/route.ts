import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { txId, ...authResponse } = body

  const [challengeRecord, credential] = await Promise.all([
    prisma.webAuthnChallenge.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.webAuthnCredential.findFirst({
      where: { userId: session.userId, credentialId: authResponse.id },
    }),
  ])

  if (!challengeRecord) return NextResponse.json({ error: 'No challenge' }, { status: 400 })
  if (!credential) return NextResponse.json({ error: 'Credential not found' }, { status: 400 })

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response: authResponse,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
      credential: {
        id: credential.credentialId,
        publicKey: Buffer.from(credential.publicKey, 'base64'),
        counter: credential.counter,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
  }

  if (!verification.verified) return NextResponse.json({ error: 'Not verified' }, { status: 400 })

  // Update counter
  await prisma.webAuthnCredential.update({
    where: { id: credential.id },
    data: { counter: verification.authenticationInfo.newCounter },
  })
  await prisma.webAuthnChallenge.delete({ where: { id: challengeRecord.id } })

  // Complete the transaction
  const tx = await prisma.transaction.findUnique({
    where: { id: txId },
    include: { sender: true, receiver: true },
  })
  if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  if (tx.senderId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (tx.status !== 'PENDING_BIOMETRIC') return NextResponse.json({ error: 'Invalid state' }, { status: 400 })

  const senderCents = Math.round(tx.sender.balance * 100)
  const amountCents = Math.round(tx.amount * 100)
  if (amountCents > senderCents) return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })

  await prisma.$transaction([
    prisma.user.update({ where: { id: tx.senderId }, data: { balance: (senderCents - amountCents) / 100 } }),
    prisma.user.update({ where: { id: tx.receiverId }, data: { balance: (Math.round(tx.receiver.balance * 100) + amountCents) / 100 } }),
    prisma.transaction.update({ where: { id: txId }, data: { status: 'COMPLETED', resolvedAt: new Date() } }),
  ])

  return NextResponse.json({ ok: true })
}
