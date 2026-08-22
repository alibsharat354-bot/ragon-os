'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/shared/stat-card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils'
import {
  DollarSign, TrendingUp, AlertCircle, Users, FolderKanban,
  Target, BarChart2, CheckSquare, Clock, Bell, Zap
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import type { DashboardStats, Task, Invoice, ActivityLog, Project } from '@/types'
import Link from 'next/link'

export default function CommandCenter() {
  const [stats, setStats] = useState<DashboardStats>({
    revenueThisMonth: 0, profitThisMonth: 0, outstandingPayments: 0,
    activeClients: 0, activeProjects: 0, openLeads: 0, pipelineValue: 0, expensesThisMonth: 0
  })
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [activeProjects, setActiveProjects] = useState<Project[]>([])
  const [revenueChart, setRevenueChart] = useState<{ month: string; revenue: number; expenses: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ monthly_revenue_target: number; full_name: string | null } | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    const today = now.toISOString().split('T')[0]

    const [
      profileRes,
      paymentsRes,
      expensesRes,
      clientsRes,
      projectsRes,
      leadsRes,
      overdueInvoicesRes,
      pendingInvoicesRes,
      todayTasksRes,
      overdueTasksRes,
      activityRes,
      activeProjectsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('monthly_revenue_target, full_name').eq('id', user.id).single(),
      supabase.from('payments').select('amount').eq('user_id', user.id).gte('payment_date', monthStart).lte('payment_date', monthEnd),
      supabase.from('expenses').select('amount').eq('user_id', user.id).gte('date', monthStart).lte('date', monthEnd),
      supabase.from('clients').select('id').eq('user_id', user.id).eq('status', 'Active'),
      supabase.from('projects').select('id').eq('user_id', user.id).in('status', ['Planning', 'Production', 'Editing', 'Review', 'Revision']),
      supabase.from('leads').select('id, potential_value').eq('user_id', user.id).not('status', 'in', '("Won","Lost")'),
      supabase.from('invoices').select('id, invoice_number, amount, due_date, client_id, clients(name)').eq('user_id', user.id).eq('status', 'Overdue').order('due_date'),
      supabase.from('invoices').select('amount').eq('user_id', user.id).in('status', ['Sent', 'Pending', 'Overdue']),
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', 'Todo').eq('due_date', today),
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', 'Todo').lt('due_date', today).not('due_date', 'is', null).order('due_date').limit(5),
      supabase.from('activity_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
      supabase.from('projects').select('*, clients(name)').eq('user_id', user.id).in('status', ['Production', 'Editing', 'Review']).order('deadline').limit(5),
    ])

    const revenue = (paymentsRes.data || []).reduce((s, p) => s + p.amount, 0)
    const expenses = (expensesRes.data || []).reduce((s, e) => s + e.amount, 0)
    const outstanding = (pendingInvoicesRes.data || []).reduce((s, i) => s + i.amount, 0)
    const pipelineValue = (leadsRes.data || []).reduce((s, l) => s + (l.potential_value || 0), 0)

    setProfile(profileRes.data)
    setStats({
      revenueThisMonth: revenue,
      profitThisMonth: revenue - expenses,
      outstandingPayments: outstanding,
      activeClients: clientsRes.data?.length || 0,
      activeProjects: projectsRes.data?.length || 0,
      openLeads: leadsRes.data?.length || 0,
      pipelineValue,
      expensesThisMonth: expenses,
    })
    setOverdueInvoices((overdueInvoicesRes.data || []) as unknown as Invoice[])
    setTodayTasks(todayTasksRes.data || [])
    setOverdueTasks(overdueTasksRes.data || [])
    setRecentActivity(activityRes.data || [])
    setActiveProjects((activeProjectsRes.data || []) as Project[])

    // Build 6-month revenue chart
    const months: { month: string; revenue: number; expenses: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = d.toISOString().split('T')[0]
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
      const label = d.toLocaleString('default', { month: 'short' })
      const [pRes, eRes] = await Promise.all([
        supabase.from('payments').select('amount').eq('user_id', user.id).gte('payment_date', start).lte('payment_date', end),
        supabase.from('expenses').select('amount').eq('user_id', user.id).gte('date', start).lte('date', end),
      ])
      months.push({
        month: label,
        revenue: (pRes.data || []).reduce((s, p) => s + p.amount, 0),
        expenses: (eRes.data || []).reduce((s, e) => s + e.amount, 0),
      })
    }
    setRevenueChart(months)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const revenueProgress = profile?.monthly_revenue_target
    ? Math.min(100, (stats.revenueThisMonth / profile.monthly_revenue_target) * 100)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-slate-500">
          <Zap className="h-4 w-4 animate-pulse text-indigo-500" />
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Command Center" />
      <div className="p-5 space-y-5 max-w-7xl">
        {/* Welcome + Revenue Target */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Good {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Raza'} 👋
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {profile?.monthly_revenue_target && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Monthly Revenue Target</p>
              <p className="text-sm font-semibold text-slate-200">
                {formatCurrency(stats.revenueThisMonth)} / {formatCurrency(profile.monthly_revenue_target)}
              </p>
              <div className="mt-1 h-1.5 w-48 rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${revenueProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{revenueProgress.toFixed(0)}% of target</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard title="Revenue (Month)" value={formatCurrency(stats.revenueThisMonth)} icon={DollarSign} color="emerald" subtitle="Recorded payments" />
          <StatCard title="Profit (Month)" value={formatCurrency(stats.profitThisMonth)} icon={TrendingUp} color={stats.profitThisMonth >= 0 ? 'emerald' : 'red'} subtitle={`Expenses: ${formatCurrency(stats.expensesThisMonth)}`} />
          <StatCard title="Outstanding" value={formatCurrency(stats.outstandingPayments)} icon={AlertCircle} color="yellow" subtitle="Unpaid invoices" />
          <StatCard title="Pipeline Value" value={formatCurrency(stats.pipelineValue)} icon={BarChart2} color="indigo" subtitle={`${stats.openLeads} open leads`} />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <StatCard title="Active Clients" value={stats.activeClients} icon={Users} color="cyan" />
          <StatCard title="Active Projects" value={stats.activeProjects} icon={FolderKanban} color="violet" />
          <StatCard title="Open Leads" value={stats.openLeads} icon={Target} color="indigo" />
          <StatCard title="Tasks Today" value={todayTasks.length} icon={CheckSquare} color={todayTasks.length > 0 ? 'yellow' : 'emerald'} />
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Left col — tasks & invoices */}
          <div className="col-span-2 space-y-4">
            {/* Overdue alerts */}
            {(overdueTasks.length > 0 || overdueInvoices.length > 0) && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="h-4 w-4 text-red-400" />
                  <p className="text-sm font-semibold text-red-400">Needs Attention</p>
                </div>
                <div className="space-y-2">
                  {overdueTasks.map(t => (
                    <Link href="/tasks" key={t.id} className="flex items-center justify-between rounded-md bg-slate-900 px-3 py-2 hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300">{t.title}</span>
                      </div>
                      <span className="text-xs text-red-400">{formatDate(t.due_date)}</span>
                    </Link>
                  ))}
                  {overdueInvoices.map(inv => (
                    <Link href="/invoices" key={inv.id} className="flex items-center justify-between rounded-md bg-slate-900 px-3 py-2 hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300">{inv.invoice_number} — {formatCurrency(inv.amount)}</span>
                      </div>
                      <Badge status="Overdue">Overdue</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Tasks */}
            <div className="rounded-lg border border-slate-800 bg-slate-900">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-200">Today&apos;s Tasks</p>
                </div>
                <Link href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
              </div>
              <div className="divide-y divide-slate-800">
                {todayTasks.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-600">No tasks due today</p>
                ) : todayTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-3.5 w-3.5 rounded border border-slate-600 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{t.title}</span>
                    </div>
                    <Badge status={t.priority}>{t.priority}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="rounded-lg border border-slate-800 bg-slate-900">
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-sm font-semibold text-slate-200">Revenue vs Expenses (6 months)</p>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={revenueChart}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(v: unknown) => formatCurrency(Number(v))}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#rev)" name="Revenue" />
                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#exp)" name="Expenses" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right col — projects + activity */}
          <div className="space-y-4">
            {/* Active Projects */}
            <div className="rounded-lg border border-slate-800 bg-slate-900">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-200">Active Projects</p>
                </div>
                <Link href="/projects" className="text-xs text-indigo-400 hover:text-indigo-300">All →</Link>
              </div>
              <div className="divide-y divide-slate-800">
                {activeProjects.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-600">No active projects</p>
                ) : activeProjects.map(p => (
                  <div key={p.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-300 truncate">{p.name}</span>
                      <Badge status={p.status}>{p.status}</Badge>
                    </div>
                    {p.client && <p className="text-xs text-slate-500">{(p.client as { name: string }).name}</p>}
                    {p.deadline && (
                      <p className="text-xs text-slate-600 mt-0.5">Due {formatDate(p.deadline)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-lg border border-slate-800 bg-slate-900">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-200">Recent Activity</p>
                </div>
                <Link href="/activity" className="text-xs text-indigo-400 hover:text-indigo-300">All →</Link>
              </div>
              <div className="divide-y divide-slate-800">
                {recentActivity.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-600">No recent activity</p>
                ) : recentActivity.map(a => (
                  <div key={a.id} className="px-4 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-slate-300">{a.action}</p>
                        {a.entity_name && <p className="text-xs text-slate-500 truncate">{a.entity_name}</p>}
                      </div>
                      <span className="text-xs text-slate-600 flex-shrink-0">{formatRelativeDate(a.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
