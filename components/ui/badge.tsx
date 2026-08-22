'use client'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'status'
  status?: string
}

export function Badge({ children, className, status }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        status ? getStatusColor(status) : 'bg-slate-800 text-slate-300 border-slate-700',
        className
      )}
    >
      {children}
    </span>
  )
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Lead: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Prospect: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    Paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Completed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    Lost: 'bg-red-500/10 text-red-400 border-red-500/20',
    Won: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    New: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Qualified: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Contacted: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    Replied: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    Interested: 'bg-green-500/10 text-green-400 border-green-500/20',
    Call: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Proposal: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Negotiation: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    Planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Production: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Editing: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    Review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Revision: 'bg-red-500/10 text-red-400 border-red-500/20',
    Delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    Sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
    Cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    Todo: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return colors[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}
