import { NextRequest, NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const challengeRecord = await prisma.webAuthnChallenge.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  })
  if (!challengeRecord) return NextResponse.json({ error: 'No challenge found' }, { status: 400 })

  // Clean up stale challenges (older than 5 min)
  await prisma.webAuthnChallenge.deleteMany({
    where: {
      userId: session.userId,
      createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
    },
  })

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
    })
  } catch (err) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: 'Not verified' }, { status: 400 })
  }

  const { credential } = verification.registrationInfo

  await prisma.webAuthnCredential.create({
    data: {
      userId: session.userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64'),
      counter: credential.counter,
    },
  })

  await prisma.webAuthnChallenge.delete({ where: { id: challengeRecord.id } })

  return NextResponse.json({ ok: true })
}
