import { NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { webAuthnCredentials: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const options = await generateRegistrationOptions({
    rpName: 'Vaultis',
    rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
    userName: user.email,
    userDisplayName: user.fullName,
    attestationType: 'none',
    excludeCredentials: user.webAuthnCredentials.map(c => ({
      id: c.credentialId,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })

  // Delete old challenges and save new one
  await prisma.webAuthnChallenge.deleteMany({ where: { userId: user.id } })
  await prisma.webAuthnChallenge.create({
    data: { userId: user.id, challenge: options.challenge },
  })

  return NextResponse.json(options)
}
