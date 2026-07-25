import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

// PATCH /api/leads/[id]/assign — Reassign a lead to another user (ADMIN only)
export async function PATCH(
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
      return NextResponse.json({ error: 'Only admins can assign leads' }, { status: 403 })
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { assignedTo: { select: { id: true, name: true } } },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const { assignedToId } = await req.json()

    // Validate assignedToId
    if (!assignedToId || typeof assignedToId !== 'string') {
      return NextResponse.json({
        error: 'Validation failed',
        details: { assignedToId: 'A valid user ID is required' },
      }, { status: 422 })
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: assignedToId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { assignedToId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { notes: true, activities: true } },
      },
    })

    // Auto-log activity
    const previousAssignee = lead.assignedTo?.name || 'Unassigned'
    const action = lead.assignedToId
      ? `Reassigned from ${previousAssignee} to ${targetUser.name}`
      : `Assigned to ${targetUser.name}`

    await prisma.activityLog.create({
      data: {
        action,
        leadId: id,
        actorId: user.id,
      },
    })

    return NextResponse.json({ lead: updatedLead })
  } catch (error) {
    console.error('Assign lead error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

