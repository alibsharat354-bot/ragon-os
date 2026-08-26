'use client'
import { useEffect, useState } from 'react'
import { getAll, getSettings } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/shared/stat-card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils'
import { DollarSign, TrendingUp, AlertCircle, Users, FolderKanban, Target, BarChart2, CheckSquare, Clock, Bell, Zap } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

export default function CommandCenter() {
  const [data, setData] = useState({
    revenue: 0, expenses: 0, profit: 0, outstanding: 0,
    activeClients: 0, activeProjects: 0, openLeads: 0, pipelineValue: 0,
    todayTasks: [] as any[], overdueTasks: [] as any[], overdueInvoices: [] as any[],
    activeProjectsList: [] as any[], recentActivity: [] as any[], revenueChart: [] as any[],
    revenueTarget: 10000,
  })

  function load() {
    const payments = getAll<any>('payments')
    const expenses = getAll<any>('expenses')
    const clients = getAll<any>('clients')
    const projects = getAll<any>('projects')
    const leads = getAll<any>('leads')
    const tasks = getAll<any>('tasks')
    const invoices = getAll<any>('invoices')
    const activity = getAll<any>('activity_log')
    const settings = getSettings()

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    const today = now.toISOString().split('T')[0]

    const monthPayments = payments.filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd)
    const monthExpenses = expenses.filter(e => e.date >= monthStart && e.date <= monthEnd)
    const revenue = monthPayments.reduce((s: number, p: any) => s + Number(p.amount), 0)
    const exp = monthExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0)
    const outstanding = invoices.filter(i => ['Sent','Pending','Overdue'].includes(i.status)).reduce((s: number, i: any) => s + Number(i.amount), 0)
    const pipelineValue = leads.filter(l => !['Won','Lost'].includes(l.status)).reduce((s: number, l: any) => s + Number(l.potential_value||0), 0)

    // 6-month chart
    const chart = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = d.toISOString().split('T')[0]
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
      const label = d.toLocaleString('default', { month: 'short' })
      const r = payments.filter(p => p.payment_date >= start && p.payment_date <= end).reduce((s: number, p: any) => s + Number(p.amount), 0)
      const e = expenses.filter(ex => ex.date >= start && ex.date <= end).reduce((s: number, ex: any) => s + Number(ex.amount), 0)
      chart.push({ month: label, revenue: r, expenses: e })
    }

    setData({
      revenue, expenses: exp, profit: revenue - exp, outstanding,
      activeClients: clients.filter(c => c.status === 'Active').length,
      activeProjects: projects.filter(p => ['Planning','Production','Editing','Review','Revision'].includes(p.status)).length,
      openLeads: leads.filter(l => !['Won','Lost'].includes(l.status)).length,
      pipelineValue,
      todayTasks: tasks.filter(t => t.due_date === today && t.status !== 'Completed'),
      overdueTasks: tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'Completed').slice(0, 5),
      overdueInvoices: invoices.filter(i => i.status === 'Overdue'),
      activeProjectsList: projects.filter(p => ['Production','Editing','Review'].includes(p.status)).slice(0, 5),
      recentActivity: activity.slice(0, 8),
      revenueChart: chart,
      revenueTarget: Number(settings.monthly_revenue_target) || 10000,
    })
  }

  useEffect(() => {
    load()
    window.addEventListener('ragon-data-update', load)
    return () => window.removeEventListener('ragon-data-update', load)
  }, [])

  const revenueProgress = Math.min(100, (data.revenue / data.revenueTarget) * 100)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  return (
    <div>
      <Header title="Command Center" />
      <div className="p-5 space-y-5 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Good {greeting}, Raza 👋</h2>
            <p className="text-sm text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Monthly Revenue Target</p>
            <p className="text-sm font-semibold text-slate-200">{formatCurrency(data.revenue)} / {formatCurrency(data.revenueTarget)}</p>
            <div className="mt-1 h-1.5 w-48 rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${revenueProgress}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{revenueProgress.toFixed(0)}% of target</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <StatCard title="Revenue (Month)" value={formatCurrency(data.revenue)} icon={DollarSign} color="emerald" />
          <StatCard title="Profit (Month)" value={formatCurrency(data.profit)} icon={TrendingUp} color={data.profit >= 0 ? 'emerald' : 'red'} subtitle={`Expenses: ${formatCurrency(data.expenses)}`} />
          <StatCard title="Outstanding" value={formatCurrency(data.outstanding)} icon={AlertCircle} color="yellow" />
          <StatCard title="Pipeline Value" value={formatCurrency(data.pipelineValue)} icon={BarChart2} color="indigo" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <StatCard title="Active Clients" value={data.activeClients} icon={Users} color="cyan" />
          <StatCard title="Active Projects" value={data.activeProjects} icon={FolderKanban} color="violet" />
          <StatCard title="Open Leads" value={data.openLeads} icon={Target} color="indigo" />
          <StatCard title="Tasks Today" value={data.todayTasks.length} icon={CheckSquare} color={data.todayTasks.length > 0 ? 'yellow' : 'emerald'} />
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            {(data.overdueTasks.length > 0 || data.overdueInvoices.length > 0) && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="h-4 w-4 text-red-400" />
                  <p className="text-sm font-semibold text-red-400">Needs Attention</p>
                </div>
                <div className="space-y-2">
                  {data.overdueTasks.map((t: any) => (
                    <Link href="/tasks" key={t.id} className="flex items-center justify-between rounded-md bg-slate-900 px-3 py-2 hover:bg-slate-800">
                      <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-red-400" /><span className="text-sm text-slate-300">{t.title}</span></div>
                      <span className="text-xs text-red-400">{formatDate(t.due_date)}</span>
                    </Link>
                  ))}
                  {data.overdueInvoices.map((inv: any) => (
                    <Link href="/invoices" key={inv.id} className="flex items-center justify-between rounded-md bg-slate-900 px-3 py-2 hover:bg-slate-800">
                      <div className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-red-400" /><span className="text-sm text-slate-300">{inv.invoice_number} — {formatCurrency(inv.amount)}</span></div>
                      <Badge status="Overdue">Overdue</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-800 bg-slate-900">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-slate-500" /><p className="text-sm font-semibold text-slate-200">Today&apos;s Tasks</p></div>
                <Link href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
              </div>
              <div className="divide-y divide-slate-800">
                {data.todayTasks.length === 0
                  ? <p className="px-4 py-6 text-center text-sm text-slate-600">No tasks due today</p>
                  : data.todayTasks.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-slate-300">{t.title}</span>
                      <Badge status={t.priority}>{t.priority}</Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900">
              <div className="px-4 py-3 border-b border-slate-800"><p className="text-sm font-semibold text-slate-200">Revenue vs Expenses (6 months)</p></div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={data.revenueChart}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                      <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} formatter={(v: unknown) => formatCurrency(Number(v))} />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#rev)" name="Revenue" />
                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#exp)" name="Expenses" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2"><FolderKanban className="h-4 w-4 text-slate-500" /><p className="text-sm font-semibold text-slate-200">Active Projects</p></div>
                <Link href="/projects" className="text-xs text-indigo-400 hover:text-indigo-300">All →</Link>
              </div>
              <div className="divide-y divide-slate-800">
                {data.activeProjectsList.length === 0
                  ? <p className="px-4 py-6 text-center text-sm text-slate-600">No active projects</p>
                  : data.activeProjectsList.map((p: any) => (
                    <div key={p.id} className="px-4 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-300 truncate">{p.name}</span>
                        <Badge status={p.status}>{p.status}</Badge>
                      </div>
                      {p.deadline && <p className="text-xs text-slate-600">Due {formatDate(p.deadline)}</p>}
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-slate-500" /><p className="text-sm font-semibold text-slate-200">Recent Activity</p></div>
                <Link href="/activity" className="text-xs text-indigo-400 hover:text-indigo-300">All →</Link>
              </div>
              <div className="divide-y divide-slate-800">
                {data.recentActivity.length === 0
                  ? <p className="px-4 py-6 text-center text-sm text-slate-600">No recent activity</p>
                  : data.recentActivity.map((a: any) => (
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
