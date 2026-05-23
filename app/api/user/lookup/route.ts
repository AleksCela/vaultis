import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const iban = req.nextUrl.searchParams.get('iban')
  if (!iban) return NextResponse.json({ error: 'Missing iban' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { iban: iban.replace(/\s/g, '').toUpperCase() },
    select: { fullName: true, iban: true },
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}
