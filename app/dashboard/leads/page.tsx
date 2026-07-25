'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, ChevronLeft, ChevronRight, RefreshCw, Inbox, Building2, Mail, User, CalendarDays, ArrowUpDown } from 'lucide-react'
import { TableSkeleton } from '@/components/ui/skeleton'
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

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const STATUSES = ['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch leads
  const fetchLeads = async (page: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '10')
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/leads?${params}`)
      const data = await res.json()
      setLeads(data.leads || [])
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 })
    } catch {
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchLeads(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, debouncedSearch])

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          {!loading && (
            <p className="text-sm text-slate-400 mt-0.5">
              {pagination.total} lead{pagination.total !== 1 ? 's' : ''} total
              {search && ` · searching "${search}"`}
              {statusFilter !== 'ALL' && ` · ${statusFilter} filter`}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all duration-200 focus:bg-slate-800/70"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none cursor-pointer transition-all duration-200 hover:bg-slate-800/70"
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => fetchLeads(pagination.page)}
          className="px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
          title="Refresh"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : leads.length === 0 ? (
            <EmptyState
              icon={<Inbox className="w-8 h-8 text-slate-500" />}
              title={search || statusFilter !== 'ALL' ? "No leads match your search" : "No leads yet"}
              description={
                search || statusFilter !== 'ALL'
                  ? "Try adjusting your filters or search terms."
                  : "Leads submitted from the public form will appear here."
              }
              action={
                search || statusFilter !== 'ALL' ? (
                  <button
                    onClick={() => {
                      setSearch('')
                      setStatusFilter('ALL')
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors text-sm font-medium"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors text-sm font-medium"
                  >
                    View Public Form
                  </Link>
                )
              }
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3">
                    <span className="inline-flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                      Name <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Assigned To</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {leads.map((lead, index) => (
                  <tr
                    key={lead.id}
                    onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                    className="text-sm text-slate-300 hover:bg-slate-700/30 transition-all duration-150 cursor-pointer group"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-4 font-medium text-white group-hover:text-blue-300 transition-colors">{lead.name}</td>
                    <td className="px-6 py-4">{lead.email}</td>
                    <td className="px-6 py-4">{lead.company || <span className="text-slate-500">—</span>}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4">{lead.assignedTo?.name || <span className="text-slate-500">—</span>}</td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700/50">
            <p className="text-sm text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLeads(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchLeads(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 space-y-3">
                <div className="h-5 w-3/4 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-slate-700/30 rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-slate-700/30 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
            <EmptyState
              icon={<Inbox className="w-8 h-8 text-slate-500" />}
              title={search || statusFilter !== 'ALL' ? "No leads match your search" : "No leads yet"}
              description={
                search || statusFilter !== 'ALL'
                  ? "Try adjusting your filters or search terms."
                  : "Leads submitted from the public form will appear here."
              }
              action={
                search || statusFilter !== 'ALL' ? (
                  <button
                    onClick={() => {
                      setSearch('')
                      setStatusFilter('ALL')
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors text-sm font-medium"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors text-sm font-medium"
                  >
                    View Public Form
                  </Link>
                )
              }
            />
          </div>
        ) : (
          leads.map(lead => (
            <div
              key={lead.id}
              onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
              className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 hover:border-slate-600/50 hover:bg-slate-800/70 transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white">{lead.name}</h3>
                <StatusBadge status={lead.status} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </div>
                {lead.company && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{lead.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{lead.assignedTo?.name || <span className="text-slate-500">Unassigned</span>}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {pagination.totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-2 py-3">
            <p className="text-sm text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLeads(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchLeads(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

