'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Users, Clock, Target, ArrowUpRight, ArrowDownRight, Inbox } from 'lucide-react'
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

interface Lead {
  id: string
  name: string
  email: string
  company: string | null
  status: string
  createdAt: string
  assignedTo: { id: string; name: string; email: string } | null
}

interface DashboardStats {
  totalLeads: number
  newLeads: number
  contactedLeads: number
  wonLeads: number
}

// Animated counter component
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (value === 0) return
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])

  return <>{count}</>
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    wonLeads: 0,
  })
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(res => res.json()),
      fetch('/api/leads?limit=5&page=1').then(res => res.json()),
      fetch('/api/leads?limit=1&page=1&status=NEW').then(res => res.json()),
    ])
      .then(([userData, allLeadsData, newLeadsData]) => {
        setUserName(userData.user?.name || 'User')
        setRecentLeads(allLeadsData.leads || [])

        // Fetch stats for different statuses
        Promise.all([
          fetch('/api/leads?limit=1&page=1&status=NEW'),
          fetch('/api/leads?limit=1&page=1&status=CONTACTED'),
          fetch('/api/leads?limit=1&page=1&status=WON'),
        ])
          .then(responses => Promise.all(responses.map(r => r.json())))
          .then(([newData, contactedData, wonData]) => {
            setStats({
              totalLeads: allLeadsData.pagination?.total || 0,
              newLeads: newData.pagination?.total || 0,
              contactedLeads: contactedData.pagination?.total || 0,
              wonLeads: wonData.pagination?.total || 0,
            })
            setLoading(false)
          })
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl animate-in fade-in duration-500">
        <div className="mb-8">
          <div className="h-8 w-64 bg-slate-700/50 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-96 bg-slate-700/30 rounded-lg animate-pulse" />
        </div>
        <CardSkeleton count={4} />
        <div className="mt-8 bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/30">
            <div className="h-5 w-32 bg-slate-700/50 rounded animate-pulse" />
          </div>
          <TableSkeleton rows={4} cols={5} />
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'blue', trend: '+12%' },
    { label: 'New', value: stats.newLeads, icon: TrendingUp, color: 'green', trend: '+8%' },
    { label: 'Contacted', value: stats.contactedLeads, icon: Clock, color: 'yellow', trend: '-3%' },
    { label: 'Won', value: stats.wonLeads, icon: Target, color: 'emerald', trend: '+5%' },
  ]

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-500/20 text-blue-300',
      CONTACTED: 'bg-yellow-500/20 text-yellow-300',
      QUALIFIED: 'bg-purple-500/20 text-purple-300',
      PROPOSAL: 'bg-orange-500/20 text-orange-300',
      WON: 'bg-emerald-500/20 text-emerald-300',
      LOST: 'bg-red-500/20 text-red-300',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-slate-500/20 text-slate-300'}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-white mb-1">Welcome back, {userName}</h1>
      <p className="text-slate-400 mb-8">Here is what is happening with your leads today.</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, index) => {
          const isUp = card.trend.startsWith('+')
          return (
            <div
              key={card.label}
              className="group bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/50"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <card.icon className={`w-5 h-5 text-${card.color}-400`} />
                <span className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  isUp ? "text-emerald-400" : "text-red-400"
                )}>
                  {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {card.trend}
                </span>
              </div>
              <p className="text-3xl font-bold text-white">
                <AnimatedCounter value={card.value} />
              </p>
              <p className="text-sm text-slate-400 mt-1">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Leads Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Recent Leads</h2>
        </div>
        <div className="overflow-x-auto">
          {recentLeads.length === 0 ? (
            <EmptyState
              icon={<Inbox className="w-8 h-8 text-slate-500" />}
              title="No leads yet"
              description="Leads submitted from the public form will appear here."
              action={
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors text-sm font-medium"
                >
                  View Public Form
                </Link>
              }
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Assigned To</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                  {recentLeads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                    className="text-sm text-slate-300 hover:bg-slate-700/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-white">{lead.name}</td>
                    <td className="px-6 py-4">{lead.email}</td>
                    <td className="px-6 py-4">{getStatusBadge(lead.status)}</td>
                    <td className="px-6 py-4">{lead.assignedTo?.name || <span className="text-slate-500">—</span>}</td>
                    <td className="px-6 py-4 text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

