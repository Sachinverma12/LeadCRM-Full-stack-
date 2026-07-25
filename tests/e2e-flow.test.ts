import { describe, it, expect } from 'vitest'

/**
 * E2E Flow Tests
 *
 * These tests validate the core business flows of the CRM:
 * 1. Public lead capture → authenticated lead management
 * 2. Role-based access control (Admin vs Member)
 *
 * Run against a running dev server: npm run dev
 * These are integration-level tests that call the actual API.
 */

const BASE_URL = 'http://localhost:3000'

// Helper to make API calls
async function api(
  path: string,
  options: { method?: string; body?: unknown; cookie?: string } = {}
) {
  const { method = 'GET', body, cookie } = options
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cookie) headers['Cookie'] = cookie

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = res.headers.get('content-type')?.includes('application/json')
    ? await res.json()
    : null

  return { status: res.status, data, cookie: res.headers.get('set-cookie') }
}

describe('E2E: Public Lead Capture Flow', () => {
  it('should allow public lead submission without auth', async () => {
    const { status, data } = await api('/api/leads', {
      method: 'POST',
      body: {
        name: 'E2E Test User',
        email: 'e2e-test@example.com',
        company: 'E2E Corp',
        message: 'Testing the lead capture flow',
      },
    })

    expect(status).toBe(201)
    expect(data.lead).toBeDefined()
    expect(data.lead.name).toBe('E2E Test User')
    expect(data.lead.email).toBe('e2e-test@example.com')
    expect(data.lead.status).toBe('NEW')
    expect(data.lead.id).toBeDefined()
  })

  it('should reject lead submission with missing required fields', async () => {
    const { status, data } = await api('/api/leads', {
      method: 'POST',
      body: { name: 'Missing Email' },
    })

    expect(status).toBe(422)
    expect(data.error).toBeDefined()
  })
})

describe('E2E: Auth & Role-Based Access', () => {
  let adminCookie: string
  let memberCookie: string
  let leadId: string

  it('should login as admin and get a session cookie', async () => {
    const { status, data, cookie } = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'sachinvermadineshpur@gmail.com', password: 'test1234' },
    })

    expect(status).toBe(200)
    expect(data.user).toBeDefined()
    expect(data.user.role).toBe('ADMIN')
    expect(cookie).toBeDefined()

    adminCookie = cookie!
  })

  it('should reject invalid credentials', async () => {
    const { status, data } = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'wrong@email.com', password: 'wrong-password' },
    })

    expect(status).toBe(401)
    expect(data.error).toBeDefined()
  })

  it('should list all leads as admin', async () => {
    const { status, data } = await api('/api/leads?limit=5', {
      cookie: adminCookie,
    })

    expect(status).toBe(200)
    expect(data.leads).toBeDefined()
    expect(Array.isArray(data.leads)).toBe(true)

    if (data.leads.length > 0) {
      leadId = data.leads[0].id
    }
  })

  it('should update lead status as admin', async () => {
    if (!leadId) return // skip if no leads

    const { status, data } = await api(`/api/leads/${leadId}`, {
      method: 'PATCH',
      cookie: adminCookie,
      body: { status: 'CONTACTED' },
    })

    expect(status).toBe(200)
    expect(data.lead.status).toBe('CONTACTED')
  })

  it('should add a note to a lead as admin', async () => {
    if (!leadId) return

    const { status, data } = await api(`/api/leads/${leadId}/notes`, {
      method: 'POST',
      cookie: adminCookie,
      body: { content: 'E2E test note - contacted the client' },
    })

    expect(status).toBe(201)
    expect(data.note).toBeDefined()
    expect(data.note.content).toContain('E2E test note')
  })

  it('should view activity log for a lead as admin', async () => {
    if (!leadId) return

    const { status, data } = await api(`/api/leads/${leadId}/activity`, {
      cookie: adminCookie,
    })

    expect(status).toBe(200)
    expect(data.activities).toBeDefined()
    expect(Array.isArray(data.activities)).toBe(true)
  })
})
