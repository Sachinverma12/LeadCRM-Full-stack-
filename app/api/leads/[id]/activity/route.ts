import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

// Helper: Check if user can access this lead
async function getAccessibleLead(leadId: string) {
  const user = await getCurrentUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, assignedToId: true } })
  if (!lead) return { user: null, error: NextResponse.json({ error: 'Lead not found' }, { status: 404 }) }

  if (user.role !== 'ADMIN' && lead.assignedToId !== user.id) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user, error: null }
}

// GET /api/leads/[id]/activity — Fetch activity log for a lead
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await getAccessibleLead(id)
    if (error) return error

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { leadId: id },
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where: { leadId: id } }),
    ])

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

