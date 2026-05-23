import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ txId: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { txId } = await params
  const { note } = await req.json().catch(() => ({ note: undefined }))

  const tx = await prisma.transaction.findUnique({ where: { id: txId } })
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (tx.status !== 'PENDING_ADMIN') return NextResponse.json({ error: 'Not in queue' }, { status: 400 })

  await prisma.transaction.update({
    where: { id: txId },
    data: { status: 'BLOCKED', adminNote: note || null, resolvedAt: new Date() },
  })

  console.log('[AUDIT]', session.adminId, 'REJECT', txId, new Date().toISOString())
  // TODO: Replace with DB audit table in production
  return NextResponse.json({ ok: true })
}
