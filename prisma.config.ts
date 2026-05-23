import 'dotenv/config'
import { defineConfig } from 'prisma/config'
import path from 'path'

const dbPath = process.env.DATABASE_URL?.replace('file:', '') ?? './dev.db'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
  datasource: {
    url: `file:${path.resolve(dbPath)}`,
  },
})
