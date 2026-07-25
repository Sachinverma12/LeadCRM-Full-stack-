'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Trash2, UserPlus, MessageSquare, Activity, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/ui/status-badge'
import { ConfirmModal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AssignedTo {
  id: string
  name: string
  email: string
}

interface Lead {
  id: string
  name: string
  email: string
  company: string | null
  message: string | null
  status: string
  assignedTo: AssignedTo | null
  createdAt: string
  updatedAt: string
  _count: { notes: number; activities: number }
}

interface Note {
  id: string
  content: string
  author: { id: string; name: string; email: string }
  createdAt: string
}

interface ActivityEntry {
  id: string
  action: string
  actor: { id: string; name: string; email: string } | null
  createdAt: string
}

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [lead, setLead] = useState<Lead | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editMessage, setEditMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const [selectedUserId, setSelectedUserId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const [deleting, setDeleting] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(data => {
        setCurrentUser(data.user)
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`/api/leads/${id}`).then(res => {
        if (!res.ok) throw new Error('Failed to load lead')
        return res.json()
      }),
      fetch(`/api/leads/${id}/notes`).then(res => {
        if (!res.ok) throw new Error('Failed to load notes')
        return res.json()
      }),
      fetch(`/api/leads/${id}/activity?limit=50`).then(res => {
        if (!res.ok) throw new Error('Failed to load activity')
        return res.json()
      }),
    ])
      .then(([leadData, notesData, activityData]) => {
        setLead(leadData.lead)
        setEditName(leadData.lead.name)
        setEditEmail(leadData.lead.email)
        setEditCompany(leadData.lead.company || '')
        setEditMessage(leadData.lead.message || '')
        setNotes(notesData.notes)
        setActivities(activityData.activities)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => setUsers(data.users || []))
        .catch(() => {})
    }
  }, [currentUser])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          company: editCompany || null,
          message: editMessage || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const data = await res.json()
      setLead(data.lead)
      setEditing(false)
      toast.success('Lead updated successfully', {
        icon: <CheckCircle2 className="w-4 h-4" />,
      })
    } catch {
      toast.error('Failed to save changes', {
        icon: <AlertCircle className="w-4 h-4" />,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      const data = await res.json()
      setLead(data.lead)
      toast.success(`Status changed to ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setAddingNote(true)
    try {
      const res = await fetch(`/api/leads/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      const data = await res.json()
      setNotes(prev => [data.note, ...prev])
      setNewNote('')
      toast.success('Note added')
    } catch {
      toast.error('Failed to add note')
    } finally {
      setAddingNote(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedUserId) return
    setAssigning(true)
    try {
      const res = await fetch(`/api/leads/${id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: selectedUserId }),
      })
      if (!res.ok) throw new Error('Failed to assign')
      const data = await res.json()
      setLead(data.lead)
      setSelectedUserId('')
      toast.success('Lead assigned successfully')
    } catch {
      toast.error('Failed to assign lead')
    } finally {
      setAssigning(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Lead deleted')
      router.push('/dashboard/leads')
    } catch {
      toast.error('Failed to delete lead')
      setDeleting(false)
    }
    setDeleteModalOpen(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl animate-in fade-in duration-500">
        <div className="h-4 w-32 bg-slate-700/50 rounded-lg animate-pulse mb-6" />
        <div className="mb-6">
          <div className="h-8 w-64 bg-slate-700/50 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-48 bg-slate-700/30 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-6 space-y-4">
              <div className="h-5 w-32 bg-slate-700/50 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            </div>
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-6 space-y-4">
              <div className="h-5 w-20 bg-slate-700/50 rounded animate-pulse" />
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-20" />
                ))}
              </div>
            </div>
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-6 space-y-4">
              <div className="h-5 w-24 bg-slate-700/50 rounded animate-pulse" />
              <Skeleton className="h-10" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-6 space-y-4">
              <div className="h-5 w-24 bg-slate-700/50 rounded animate-pulse" />
              <Skeleton className="h-8" />
              <Skeleton className="h-10" />
            </div>
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-6 space-y-4">
              <div className="h-5 w-20 bg-slate-700/50 rounded animate-pulse" />
              <Skeleton className="h-24" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="max-w-4xl">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-8 text-center">
          <p className="text-slate-400">{error || 'Lead not found'}</p>
          <Link href="/dashboard/leads" className="inline-block mt-4 text-sm text-blue-400 hover:text-blue-300">
            Back to Leads
          </Link>
        </div>
      </div>
    )
  }

  const isAdmin = currentUser?.role === 'ADMIN'
  const canEdit = isAdmin || lead.assignedTo?.id === currentUser?.id

  return (
    <div className="max-w-4xl">
      {/* Back link */}
      <Link
        href="/dashboard/leads"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{lead.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-slate-400">{lead.email}</span>
            <span className="text-slate-600">|</span>
            <StatusBadge status={lead.status} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-sm disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        description={`Are you sure you want to delete ${lead.name}'s lead? This action cannot be undone and will remove all associated notes and activity history.`}
        confirmText="Delete"
        loading={deleting}
        variant="destructive"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Lead info + Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Info Card */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Lead Information</h2>
              {canEdit && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Company</label>
                  <input
                    type="text"
                    value={editCompany}
                    onChange={e => setEditCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Message</label>
                  <textarea
                    value={editMessage}
                    onChange={e => setEditMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditName(lead.name)
                      setEditEmail(lead.email)
                      setEditCompany(lead.company || '')
                      setEditMessage(lead.message || '')
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Name</p>
                  <p className="text-sm text-white">{lead.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-white">{lead.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Company</p>
                  <p className="text-sm text-white">{lead.company || <span className="text-slate-500">—</span>}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Created</p>
                  <p className="text-sm text-white">{new Date(lead.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Message</p>
                  <p className="text-sm text-white">{lead.message || <span className="text-slate-500">No message provided</span>}</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Card */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Status</h2>
            <div className="flex items-center gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => canEdit && handleStatusChange(s)}
                  disabled={!canEdit}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    lead.status === s
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : canEdit
                      ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                      : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-white">Notes ({notes.length})</h2>
            </div>

            {canEdit && (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                </button>
              </div>
            )}

            {notes.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No notes yet</p>
            ) : (
              <div className="space-y-3">
                {notes.map(note => (
                  <div key={note.id} className="bg-slate-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-200">{note.author.name}</span>
                      <span className="text-xs text-slate-500">{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-300">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Assign + Activity */}
        <div className="space-y-6">
          {/* Assign Card */}
          {isAdmin && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-white">Assignment</h2>
              </div>
              <div className="mb-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Currently Assigned To</p>
                <p className="text-sm text-white">{lead.assignedTo?.name || <span className="text-slate-500">Unassigned</span>}</p>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value="">Select a user...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={assigning || !selectedUserId}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors text-sm disabled:opacity-50"
                >
                  {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
                </button>
              </div>
            </div>
          )}

          {/* Assign info for non-admins */}
          {!isAdmin && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-white">Assignment</h2>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Assigned To</p>
              <p className="text-sm text-white">{lead.assignedTo?.name || <span className="text-slate-500">Unassigned</span>}</p>
            </div>
          )}

          {/* Activity Log */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-white">Activity</h2>
            </div>
            {activities.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No activity yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities.map(entry => (
                  <div key={entry.id} className="border-l-2 border-slate-600 pl-3 py-1">
                    <p className="text-sm text-slate-300">{entry.action}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{entry.actor?.name || 'System'}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
