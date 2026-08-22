'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { formatCurrency } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

export default function AnalyticsPage() {
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; expenses: number; profit: number }[]>([])
  const [leadFunnel, setLeadFunnel] = useState<{ stage: string; count: number }[]>([])
  const [revenueByService, setRevenueByService] = useState<{ name: string; value: number }[]>([])
  const [clientRevenue, setClientRevenue] = useState<{ name: string; revenue: number }[]>([])
  const [summary, setSummary] = useState({ totalRevenue: 0, totalExpenses: 0, totalLeads: 0, totalClients: 0, avgDealSize: 0, wonDeals: 0 })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()

    // 6-month revenue data
    const months: typeof revenueData = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = d.toISOString().split('T')[0]
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
      const label = d.toLocaleString('default', { month: 'short' })
      const [{ data: p }, { data: e }] = await Promise.all([
        supabase.from('payments').select('amount').eq('user_id', user.id).gte('payment_date', start).lte('payment_date', end),
        supabase.from('expenses').select('amount').eq('user_id', user.id).gte('date', start).lte('date', end),
      ])
      const rev = (p || []).reduce((s, x) => s + x.amount, 0)
      const exp = (e || []).reduce((s, x) => s + x.amount, 0)
      months.push({ month: label, revenue: rev, expenses: exp, profit: rev - exp })
    }
    setRevenueData(months)

    // Lead funnel
    const { data: leads } = await supabase.from('leads').select('status').eq('user_id', user.id)
    const stages = ['New', 'Qualified', 'Contacted', 'Replied', 'Interested', 'Call', 'Proposal', 'Negotiation', 'Won']
    const funnel = stages.map(stage => ({ stage, count: (leads || []).filter(l => l.status === stage).length }))
    setLeadFunnel(funnel)

    // Revenue by payment category
    const { data: payments } = await supabase.from('payments').select('category, amount').eq('user_id', user.id)
    const catMap: Record<string, number> = {}
    ;(payments || []).forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + p.amount })
    setRevenueByService(Object.entries(catMap).map(([name, value]) => ({ name, value })))

    // Client revenue (top 5)
    const { data: clientPayments } = await supabase.from('payments').select('amount, clients(name)').eq('user_id', user.id).not('client_id', 'is', null)
    const clientMap: Record<string, number> = {}
    ;(clientPayments || []).forEach((p: { amount: number; clients?: { name: string } | null | { name: string }[] }) => {
      const clients = p.clients
      const name = Array.isArray(clients) ? (clients[0]?.name || 'Unknown') : (clients?.name || 'Unknown')
      clientMap[name] = (clientMap[name] || 0) + p.amount
    })
    setClientRevenue(
      Object.entries(clientMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name, revenue]) => ({ name, revenue }))
    )

    // Summary stats
    const [{ data: allPayments }, { data: allExpenses }, { data: allLeads }, { data: allClients }, { data: wonLeads }] = await Promise.all([
      supabase.from('payments').select('amount').eq('user_id', user.id),
      supabase.from('expenses').select('amount').eq('user_id', user.id),
      supabase.from('leads').select('id').eq('user_id', user.id),
      supabase.from('clients').select('id').eq('user_id', user.id).eq('status', 'Active'),
      supabase.from('leads').select('potential_value').eq('user_id', user.id).eq('status', 'Won'),
    ])
    const totalRev = (allPayments || []).reduce((s, p) => s + p.amount, 0)
    const totalExp = (allExpenses || []).reduce((s, e) => s + e.amount, 0)
    const wonCount = (wonLeads || []).length
    const wonAvg = wonCount > 0 ? (wonLeads || []).reduce((s, l) => s + (l.potential_value || 0), 0) / wonCount : 0
    setSummary({ totalRevenue: totalRev, totalExpenses: totalExp, totalLeads: allLeads?.length || 0, totalClients: allClients?.length || 0, avgDealSize: wonAvg, wonDeals: wonCount })

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="flex items-center justify-center h-screen"><p className="text-slate-500 text-sm">Loading analytics...</p></div>

  return (
    <div>
      <Header title="Analytics" />
      <div className="p-5 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Revenue (All Time)', value: formatCurrency(summary.totalRevenue), color: 'text-emerald-400' },
            { label: 'Total Expenses (All Time)', value: formatCurrency(summary.totalExpenses), color: 'text-red-400' },
            { label: 'Net Profit (All Time)', value: formatCurrency(summary.totalRevenue - summary.totalExpenses), color: summary.totalRevenue - summary.totalExpenses >= 0 ? 'text-indigo-400' : 'text-red-400' },
            { label: 'Total Leads', value: summary.totalLeads, color: 'text-blue-400' },
            { label: 'Active Clients', value: summary.totalClients, color: 'text-cyan-400' },
            { label: 'Won Deals', value: summary.wonDeals, color: 'text-violet-400' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue / Expenses chart */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm font-semibold text-slate-200 mb-4">Revenue, Expenses & Profit (6 months)</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#gRev)" name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gExp)" name="Expenses" />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#gPro)" name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Lead Funnel */}
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-semibold text-slate-200 mb-4">Lead Funnel</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leadFunnel} layout="vertical">
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="stage" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, fontSize: 11 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by category */}
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-semibold text-slate-200 mb-4">Revenue by Source</p>
            {revenueByService.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={revenueByService} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: '#475569' }}>
                    {revenueByService.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, fontSize: 11 }} formatter={(v: unknown) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-sm text-slate-600 mt-8">No revenue recorded yet</p>}
          </div>
        </div>

        {/* Client Revenue */}
        {clientRevenue.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-semibold text-slate-200 mb-4">Top Clients by Revenue</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={clientRevenue}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, fontSize: 11 }} formatter={(v: unknown) => formatCurrency(Number(v))} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
