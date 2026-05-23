import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signAdminToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const admin = await prisma.adminUser.findUnique({ where: { email } })
  if (!admin) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const valid = await bcrypt.compare(password, admin.passwordHash)
  if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const token = signAdminToken({ adminId: admin.id, email: admin.email })
  const res = NextResponse.json({ ok: true })
  res.cookies.set('vaultis_admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return res
}
