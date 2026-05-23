import { NextRequest, NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { txId } = await req.json()

  const credentials = await prisma.webAuthnCredential.findMany({
    where: { userId: session.userId },
  })
  if (credentials.length === 0) {
    return NextResponse.json({ error: 'No biometric registered' }, { status: 400 })
  }

  const options = await generateAuthenticationOptions({
    rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
    allowCredentials: credentials.map(c => ({ id: c.credentialId })),
    userVerification: 'preferred',
  })

  await prisma.webAuthnChallenge.deleteMany({ where: { userId: session.userId } })
  await prisma.webAuthnChallenge.create({
    data: { userId: session.userId, challenge: options.challenge },
  })

  return NextResponse.json({ ...options, txId })
}
