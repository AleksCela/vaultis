import { prisma } from '@/lib/prisma'

export interface FraudInput {
  senderId: string
  receiverIban: string
  amount: number
  deviceHash: string | null
  deviceCountry: string | null
  hour: number
}

export interface FraudFlag {
  code: string
  label: string
  weight: number
}

export interface FraudResult {
  score: number
  flags: FraudFlag[]
  action: string
}

const HIGH_RISK_COUNTRIES = ['RU', 'KP', 'IR', 'BY', 'SY', 'MM', 'LY', 'SD', 'VE', 'CU']

const FLAGS: Record<string, FraudFlag> = {
  UNKNOWN_DEVICE:       { code: 'UNKNOWN_DEVICE',       label: 'Unrecognized device',                           weight: 20 },
  HIGH_RISK_COUNTRY:    { code: 'HIGH_RISK_COUNTRY',    label: 'Transfer to high-risk country',                 weight: 30 },
  LOCATION_MISMATCH:    { code: 'LOCATION_MISMATCH',    label: 'Your location differs from recipient country',   weight: 15 },
  AMOUNT_ABOVE_AVERAGE: { code: 'AMOUNT_ABOVE_AVERAGE', label: 'Amount above your usual transfers',             weight: 15 },
  DRAINING_BALANCE:     { code: 'DRAINING_BALANCE',     label: 'Transfer exceeds 80% of your balance',          weight: 20 },
  NEW_BENEFICIARY:      { code: 'NEW_BENEFICIARY',      label: 'First transfer to this recipient',              weight: 10 },
  HIGH_VELOCITY:        { code: 'HIGH_VELOCITY',        label: '3+ transfers in the last 10 minutes',           weight: 25 },
  UNUSUAL_HOUR:         { code: 'UNUSUAL_HOUR',         label: 'Unusual hour for your account activity',        weight: 10 },
  LARGE_ROUND_NUMBER:   { code: 'LARGE_ROUND_NUMBER',   label: 'Large round-number amount (fraud pattern)',      weight: 10 },
}

function getAction(score: number): string {
  if (score <= 30) return 'ALLOW'
  if (score <= 55) return 'STEP_UP_PIN'
  if (score <= 75) return 'STEP_UP_BIOMETRIC'
  if (score <= 89) return 'COOLING_OFF'
  return 'ADMIN_QUEUE'
}

export async function runFraudEngine(input: FraudInput): Promise<FraudResult> {
  const { senderId, receiverIban, amount, deviceHash, deviceCountry, hour } = input

  const [sender, receiver, recentTxs, lastTenCompleted, velocityTxs] = await Promise.all([
    prisma.user.findUnique({ where: { id: senderId } }),
    prisma.user.findUnique({ where: { iban: receiverIban } }),
    prisma.transaction.findMany({
      where: { senderId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.transaction.findMany({
      where: { senderId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.transaction.findMany({
      where: {
        senderId,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    }),
  ])

  const appliedFlags: FraudFlag[] = []

  // UNKNOWN_DEVICE
  if (deviceHash) {
    const session = await prisma.deviceSession.findFirst({
      where: { userId: senderId, deviceHash },
    })
    if (!session) appliedFlags.push(FLAGS.UNKNOWN_DEVICE)
  } else {
    appliedFlags.push(FLAGS.UNKNOWN_DEVICE)
  }

  // HIGH_RISK_COUNTRY
  if (receiver && HIGH_RISK_COUNTRIES.includes(receiver.country)) {
    appliedFlags.push(FLAGS.HIGH_RISK_COUNTRY)
  }

  // LOCATION_MISMATCH
  if (deviceCountry && receiver && deviceCountry !== receiver.country) {
    appliedFlags.push(FLAGS.LOCATION_MISMATCH)
  }

  // AMOUNT_ABOVE_AVERAGE
  if (lastTenCompleted.length === 0) {
    if (amount > 500) appliedFlags.push(FLAGS.AMOUNT_ABOVE_AVERAGE)
  } else {
    const avg = lastTenCompleted.reduce((sum, tx) => sum + tx.amount, 0) / lastTenCompleted.length
    if (amount > avg * 2) appliedFlags.push(FLAGS.AMOUNT_ABOVE_AVERAGE)
  }

  // DRAINING_BALANCE
  if (sender && amount > sender.balance * 0.8) {
    appliedFlags.push(FLAGS.DRAINING_BALANCE)
  }

  // NEW_BENEFICIARY
  if (receiver) {
    const prior = await prisma.transaction.findFirst({
      where: { senderId, receiverId: receiver.id, status: 'COMPLETED' },
    })
    if (!prior) appliedFlags.push(FLAGS.NEW_BENEFICIARY)
  }

  // HIGH_VELOCITY
  if (velocityTxs.length >= 3) appliedFlags.push(FLAGS.HIGH_VELOCITY)

  // UNUSUAL_HOUR
  if (recentTxs.length === 0) {
    if (hour >= 0 && hour <= 5) appliedFlags.push(FLAGS.UNUSUAL_HOUR)
  } else {
    const hours = recentTxs.map(tx => new Date(tx.createdAt).getHours())
    const minHour = Math.min(...hours)
    const maxHour = Math.max(...hours)
    if (hour < minHour || hour > maxHour) appliedFlags.push(FLAGS.UNUSUAL_HOUR)
  }

  // LARGE_ROUND_NUMBER
  if (amount >= 1000 && amount % 500 === 0) appliedFlags.push(FLAGS.LARGE_ROUND_NUMBER)

  const score = appliedFlags.reduce((sum, f) => sum + f.weight, 0)
  const cappedScore = Math.min(score, 100)
  const action = getAction(cappedScore)

  return { score: cappedScore, flags: appliedFlags, action }
}
