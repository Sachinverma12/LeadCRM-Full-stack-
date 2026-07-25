import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Helper: Check if user can access this lead
async function getAccessibleLead(leadId: string) {
  const user = await getCurrentUser()
  if (!user) return { user: null, lead: null, error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      _count: { select: { notes: true, activities: true } },
    },
  })

  if (!lead) return { user, lead: null, error: NextResponse.json({ error: 'Lead not found' }, { status: 404 }) }

  // Members can only access their assigned leads
  if (user.role !== 'ADMIN' && lead.assignedToId !== user.id) {
    return { user, lead: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user, lead, error: null }
}

// GET /api/leads/[id] — Fetch a single lead
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { lead, error } = await getAccessibleLead(id)
    if (error) return error

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Get lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/leads/[id] — Update a lead
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, lead, error } = await getAccessibleLead(id)
    if (error) return error

    const body = await req.json()
    const { name, email, company, message, status } = body

    // Validate allowed fields
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Validation failed', details: { name: 'Name cannot be empty' } }, { status: 422 })
      }
      if (name.trim().length > 255) {
        return NextResponse.json({ error: 'Validation failed', details: { name: 'Name must be 255 characters or less' } }, { status: 422 })
      }
      updateData.name = name.trim()
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        return NextResponse.json({ error: 'Validation failed', details: { email: 'A valid email is required' } }, { status: 422 })
      }
      if (email.trim().length > 254) {
        return NextResponse.json({ error: 'Validation failed', details: { email: 'Email must be 254 characters or less' } }, { status: 422 })
      }
      updateData.email = email.trim().toLowerCase()
    }

    if (company !== undefined) {
      updateData.company = company?.trim() || null
    }

    if (message !== undefined) {
      updateData.message = message?.trim() || null
    }

    // Status changes: validate against enum
    const VALID_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({
          error: 'Validation failed',
          details: { status: `Status must be one of: ${VALID_STATUSES.join(', ')}` },
        }, { status: 422 })
      }
      updateData.status = status
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { notes: true, activities: true } },
      },
    })

    // Auto-log activity for status changes
    const logEntries: Array<{ action: string; leadId: string; actorId?: string }> = []

    if (status && status !== lead.status) {
      logEntries.push({
        action: `Status changed from ${lead.status} to ${status}`,
        leadId: id,
        actorId: user!.id,
      })
    }

    const changedFields = Object.keys(updateData).filter(k => k !== 'status')
    if (changedFields.length > 0) {
      logEntries.push({
        action: `Updated fields: ${changedFields.join(', ')}`,
        leadId: id,
        actorId: user!.id,
      })
    }

    if (logEntries.length > 0) {
      await prisma.activityLog.createMany({ data: logEntries })
    }

    return NextResponse.json({ lead: updatedLead })
  } catch (error) {
    console.error('Update lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/leads/[id] — Delete a lead (ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete leads' }, { status: 403 })
    }

    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Delete in reverse dependency order
    await prisma.activityLog.deleteMany({ where: { leadId: id } })
    await prisma.note.deleteMany({ where: { leadId: id } })
    await prisma.lead.delete({ where: { id } })

    return NextResponse.json({ message: 'Lead deleted successfully' })
  } catch (error) {
    console.error('Delete lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

