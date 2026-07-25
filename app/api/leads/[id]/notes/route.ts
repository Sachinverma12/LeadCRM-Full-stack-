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

// GET /api/leads/[id]/notes — Fetch all notes for a lead
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await getAccessibleLead(id)
    if (error) return error

    const notes = await prisma.note.findMany({
      where: { leadId: id },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Get notes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/leads/[id]/notes — Create a note on a lead
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, error } = await getAccessibleLead(id)
    if (error) return error

    const { content } = await req.json()

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: { content: 'Note content is required' },
      }, { status: 422 })
    }

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        leadId: id,
        authorId: user!.id,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    })

    // Auto-log activity
    await prisma.activityLog.create({
      data: {
        action: 'Note added',
        leadId: id,
        actorId: user!.id,
      },
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

