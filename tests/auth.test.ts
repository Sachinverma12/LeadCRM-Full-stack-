import { describe, it, expect, beforeAll } from 'vitest'
import { signToken, verifyToken } from '../lib/auth'

describe('Auth: JWT Token', () => {
  it('should sign and verify a valid token', async () => {
    const token = await signToken({ userId: 'user-1', role: 'ADMIN' })
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')

    const payload = await verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload!.userId).toBe('user-1')
    expect(payload!.role).toBe('ADMIN')
  })

  it('should return null for an invalid token', async () => {
    const payload = await verifyToken('invalid-token-here')
    expect(payload).toBeNull()
  })

  it('should return null for an expired token', async () => {
    // Manually create a token with immediate expiry
    const { SignJWT } = await import('jose')
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback-secret-change-in-production'
    )
    const expiredToken = await new SignJWT({ userId: 'user-1', role: 'ADMIN' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('0s')
      .sign(secret)

    // Wait a tiny bit for expiry
    await new Promise(r => setTimeout(r, 100))

    const payload = await verifyToken(expiredToken)
    expect(payload).toBeNull()
  })

  it('should include role in token payload', async () => {
    const token = await signToken({ userId: 'user-2', role: 'MEMBER' })
    const payload = await verifyToken(token)
    expect(payload!.role).toBe('MEMBER')
    expect(payload!.userId).toBe('user-2')
  })
})
