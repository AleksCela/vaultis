import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const device = await prisma.deviceSession.findFirst({
    where: { id, userId: session.userId },
  })
  if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.deviceSession.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
