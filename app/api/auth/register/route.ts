import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { generateIban } from '@/lib/iban'

export async function POST(req: NextRequest) {
  const { fullName, email, password, pin } = await req.json()

  if (!fullName || !email || !password || !pin) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const pinHash = await bcrypt.hash(pin, 10)
  const iban = generateIban()

  const user = await prisma.user.create({
    data: { fullName, email, passwordHash, iban, pin: pinHash },
  })

  const token = signToken({ userId: user.id, email: user.email })
  const res = NextResponse.json({ ok: true })
  res.cookies.set('vaultis_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
