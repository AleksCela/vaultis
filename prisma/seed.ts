import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

const dbPath = process.env.DATABASE_URL?.replace('file:', '') ?? './dev.db'
const adapter = new PrismaBetterSqlite3({ url: path.resolve(dbPath) })
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

function makeIban(country: string): string {
  const digits2 = Math.floor(Math.random() * 90 + 10).toString()
  const digits16 = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('')
  return `${country}${digits2}${digits16}`
}

async function main() {
  console.log('🌱 Seeding database…')

  // Admin
  await prisma.adminUser.upsert({
    where: { email: 'admin@vaultis.al' },
    update: {},
    create: {
      email: 'admin@vaultis.al',
      passwordHash: await bcrypt.hash('Admin123!', 12),
    },
  })
  console.log('✓ Admin user created')

  const PIN_HASH = await bcrypt.hash('1234', 10)
  const PASS_HASH = await bcrypt.hash('Demo123!', 12)

  const USERS = [
    { email: 'ardit@demo.al', fullName: 'Ardit Hoxha', country: 'AL' },
    { email: 'giulia@demo.it', fullName: 'Giulia Romano', country: 'IT' },
    { email: 'hans@demo.de', fullName: 'Hans Müller', country: 'DE' },
    { email: 'ivan@demo.ru', fullName: 'Ivan Petrov', country: 'RU' },
    { email: 'sara@demo.us', fullName: 'Sara Johnson', country: 'US' },
  ]

  const created: Record<string, { id: string; iban: string; balance: number }> = {}

  for (const u of USERS) {
    const iban = makeIban('AL')
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        fullName: u.fullName,
        passwordHash: PASS_HASH,
        pin: PIN_HASH,
        iban,
        balance: 30000,
        country: u.country,
      },
    })
    created[u.email] = { id: user.id, iban: user.iban, balance: user.balance }
    console.log(`✓ User ${u.email} (${user.iban})`)
  }

  // Sample transactions at various risk levels
  const ardit = created['ardit@demo.al']
  const giulia = created['giulia@demo.it']
  const hans = created['hans@demo.de']
  const ivan = created['ivan@demo.ru']
  const sara = created['sara@demo.us']

  const sampleTxs = [
    // Low risk: normal transfer between AL users
    {
      senderId: ardit.id, receiverId: giulia.id,
      amount: 150, description: 'Dinner split',
      status: 'COMPLETED', riskScore: 10,
      riskFlags: JSON.stringify([{ code: 'NEW_BENEFICIARY', label: 'First transfer to this recipient', weight: 10 }]),
      riskAction: 'ALLOW',
    },
    // Medium: slightly above average
    {
      senderId: giulia.id, receiverId: hans.id,
      amount: 800, description: 'Invoice #42',
      status: 'COMPLETED', riskScore: 35,
      riskFlags: JSON.stringify([
        { code: 'NEW_BENEFICIARY', label: 'First transfer to this recipient', weight: 10 },
        { code: 'AMOUNT_ABOVE_AVERAGE', label: 'Amount above your usual transfers', weight: 15 },
        { code: 'UNKNOWN_DEVICE', label: 'Unrecognized device', weight: 20 },
      ]),
      riskAction: 'STEP_UP_PIN',
    },
    // High risk: Ivan (RU)
    {
      senderId: ardit.id, receiverId: ivan.id,
      amount: 2000, description: 'Business payment',
      status: 'PENDING_ADMIN', riskScore: 90,
      riskFlags: JSON.stringify([
        { code: 'HIGH_RISK_COUNTRY', label: 'Transfer to high-risk country', weight: 30 },
        { code: 'UNKNOWN_DEVICE', label: 'Unrecognized device', weight: 20 },
        { code: 'LARGE_ROUND_NUMBER', label: 'Large round-number amount (fraud pattern)', weight: 10 },
        { code: 'NEW_BENEFICIARY', label: 'First transfer to this recipient', weight: 10 },
        { code: 'DRAINING_BALANCE', label: 'Transfer exceeds 80% of your balance', weight: 20 },
      ]),
      riskAction: 'ADMIN_QUEUE',
    },
    // Cooling off
    {
      senderId: hans.id, receiverId: sara.id,
      amount: 5000, description: 'Consulting fee',
      status: 'COMPLETED', riskScore: 65,
      riskFlags: JSON.stringify([
        { code: 'AMOUNT_ABOVE_AVERAGE', label: 'Amount above your usual transfers', weight: 15 },
        { code: 'DRAINING_BALANCE', label: 'Transfer exceeds 80% of your balance', weight: 20 },
        { code: 'UNKNOWN_DEVICE', label: 'Unrecognized device', weight: 20 },
        { code: 'NEW_BENEFICIARY', label: 'First transfer to this recipient', weight: 10 },
      ]),
      riskAction: 'COOLING_OFF',
    },
    // Simple completed
    {
      senderId: sara.id, receiverId: ardit.id,
      amount: 300, description: 'Refund',
      status: 'COMPLETED', riskScore: 20,
      riskFlags: JSON.stringify([
        { code: 'UNKNOWN_DEVICE', label: 'Unrecognized device', weight: 20 },
      ]),
      riskAction: 'ALLOW',
    },
    // Blocked
    {
      senderId: ivan.id, receiverId: sara.id,
      amount: 15000, description: '',
      status: 'BLOCKED', riskScore: 95,
      riskFlags: JSON.stringify([
        { code: 'DRAINING_BALANCE', label: 'Transfer exceeds 80% of your balance', weight: 20 },
        { code: 'UNKNOWN_DEVICE', label: 'Unrecognized device', weight: 20 },
        { code: 'LARGE_ROUND_NUMBER', label: 'Large round-number amount (fraud pattern)', weight: 10 },
        { code: 'HIGH_VELOCITY', label: '3+ transfers in the last 10 minutes', weight: 25 },
        { code: 'NEW_BENEFICIARY', label: 'First transfer to this recipient', weight: 10 },
        { code: 'UNUSUAL_HOUR', label: 'Unusual hour for your account activity', weight: 10 },
      ]),
      riskAction: 'ADMIN_QUEUE',
      adminNote: 'Rejected: exceeds daily limit and suspicious pattern',
    },
    {
      senderId: giulia.id, receiverId: ardit.id,
      amount: 200, description: 'Thank you',
      status: 'COMPLETED', riskScore: 0,
      riskFlags: JSON.stringify([]),
      riskAction: 'ALLOW',
    },
    {
      senderId: ardit.id, receiverId: hans.id,
      amount: 500, description: 'Project payment',
      status: 'COMPLETED', riskScore: 25,
      riskFlags: JSON.stringify([
        { code: 'NEW_BENEFICIARY', label: 'First transfer to this recipient', weight: 10 },
        { code: 'UNUSUAL_HOUR', label: 'Unusual hour for your account activity', weight: 10 },
        { code: 'UNKNOWN_DEVICE', label: 'Unrecognized device', weight: 20 },
      ]),
      riskAction: 'ALLOW',
    },
  ]

  for (const tx of sampleTxs) {
    const created = await prisma.transaction.create({
      data: {
        senderId: tx.senderId,
        receiverId: tx.receiverId,
        amount: tx.amount,
        description: tx.description || null,
        status: tx.status,
        riskScore: tx.riskScore,
        riskFlags: tx.riskFlags,
        riskAction: tx.riskAction,
        adminNote: (tx as { adminNote?: string }).adminNote || null,
        resolvedAt: tx.status === 'COMPLETED' || tx.status === 'BLOCKED' ? new Date() : null,
      },
    })
    await prisma.riskEvent.create({
      data: {
        userId: tx.senderId,
        transactionId: created.id,
        score: tx.riskScore,
        flags: tx.riskFlags,
        action: tx.riskAction,
      },
    })
  }

  // Deduct balances for COMPLETED transactions
  const completedTxs = sampleTxs.filter(t => t.status === 'COMPLETED')
  for (const tx of completedTxs) {
    const senderCents = Math.round(30000 * 100)
    const amountCents = Math.round(tx.amount * 100)
    await prisma.user.update({
      where: { id: tx.senderId },
      data: { balance: { decrement: tx.amount } },
    })
    await prisma.user.update({
      where: { id: tx.receiverId },
      data: { balance: { increment: tx.amount } },
    })
  }

  console.log(`✓ ${sampleTxs.length} sample transactions created`)
  console.log('\n🎉 Seed complete!')
  console.log('\nTest accounts:')
  console.log('  Admin: admin@vaultis.al / Admin123!')
  console.log('  User:  ardit@demo.al / Demo123! (PIN: 1234)')
  console.log('  User:  ivan@demo.ru / Demo123! (triggers HIGH_RISK_COUNTRY)')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
