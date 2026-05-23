import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [user, credCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, fullName: true, iban: true, balance: true, country: true, createdAt: true },
    }),
    prisma.webAuthnCredential.count({ where: { userId: session.userId } }),
  ])
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ...user, hasWebAuthn: credCount > 0 })
}
