import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET!
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET!

export interface UserPayload {
  userId: string
  email: string
}

export interface AdminPayload {
  adminId: string
  email: string
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch {
    return null
  }
}

export function signAdminToken(payload: AdminPayload): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '1d' })
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as AdminPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<UserPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('vaultis_token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('vaultis_admin_token')?.value
  if (!token) return null
  return verifyAdminToken(token)
}
