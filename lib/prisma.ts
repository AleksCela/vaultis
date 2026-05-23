import * as Prisma from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const globalForPrisma = globalThis as unknown as { prisma: Prisma.PrismaClient }

function createPrismaClient() {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') ?? './dev.db'
  const resolvedPath = path.resolve(dbPath)
  const adapter = new PrismaBetterSqlite3({ url: resolvedPath })
  return new Prisma.PrismaClient({ adapter, log: ['error'] } as ConstructorParameters<typeof Prisma.PrismaClient>[0])
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
