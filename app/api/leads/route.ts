import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { checkRateLimit } from '@/lib/rate-limit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/leads — Public: Submit a new lead (no auth required)
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 submissions per hour per IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(`lead:${ip}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      )
    }

    const { name, email, company, message } = await req.json()

    // Validation
    const errors: Record<string, string> = {}
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.name = 'Name is required'
    } else if (name.trim().length > 255) {
      errors.name = 'Name must be 255 characters or less'
    }
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      errors.email = 'A valid email is required'
    } else if (email.trim().length > 254) {
      errors.email = 'Email must be 254 characters or less'
    }
    if (company !== undefined && company !== null && typeof company === 'string' && company.trim().length > 255) {
      errors.company = 'Company must be 255 characters or less'
    }
    if (message !== undefined && message !== null && typeof message === 'string' && message.trim().length > 5000) {
      errors.message = 'Message must be 5000 characters or less'
    }
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 422 })
    }

    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company: company?.trim() || null,
        message: message?.trim() || null,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: `Lead created by public form`,
        leadId: lead.id,
      },
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error('Create lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/leads — Protected: List leads (paginated, filterable)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    // Members can only see their assigned leads
    if (user.role === 'MEMBER') {
      where.assignedToId = user.id
    }

    if (status) {
      where.status = status
    }

    if (assignedTo && user.role === 'ADMIN') {
      where.assignedToId = assignedTo
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: { select: { notes: true, activities: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ])

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List leads error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
