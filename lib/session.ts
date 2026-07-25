import { cookies } from 'next/headers'
import { verifyToken } from './auth'
import { prisma } from './prisma'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  return prisma.user.findUnique({ where: { id: payload.userId } })
}