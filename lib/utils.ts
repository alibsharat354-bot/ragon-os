import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRelativeDate(date: string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor(diff / (1000 * 60))

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Client/Lead statuses
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
    // Project statuses
    Planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Production: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Editing: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    Review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Revision: 'bg-red-500/10 text-red-400 border-red-500/20',
    Delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    // Invoice statuses
    Draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    Sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
    Cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    // Task statuses
    Todo: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    // Priority
    Low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return colors[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}

export function getCurrentMonth(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export function isOverdue(date: string | null): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}
