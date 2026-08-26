'use client'
import { useEffect, useState } from 'react'
import { getAll } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { formatCurrency } from '@/lib/utils'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316']

export default function AnalyticsPage() {
  const [chart, setChart] = useState<any[]>([])
  const [funnel, setFunnel] = useState<any[]>([])
  const [bySource, setBySource] = useState<any[]>([])
  const [summary, setSummary] = useState({ totalRevenue:0, totalExpenses:0, totalLeads:0, activeClients:0, wonDeals:0 })

  useEffect(()=>{
    const payments = getAll<any>('payments')
    const expenses = getAll<any>('expenses')
    const leads = getAll<any>('leads')
    const clients = getAll<any>('clients')

    const now = new Date()
    const months = []
    for (let i=5;i>=0;i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1)
      const start = d.toISOString().split('T')[0]
      const end = new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().split('T')[0]
      const label = d.toLocaleString('default',{month:'short'})
      const r = payments.filter(p=>p.payment_date>=start&&p.payment_date<=end).reduce((s:number,p:any)=>s+Number(p.amount),0)
      const e = expenses.filter(ex=>ex.date>=start&&ex.date<=end).reduce((s:number,ex:any)=>s+Number(ex.amount),0)
      months.push({ month:label, revenue:r, expenses:e, profit:r-e })
    }
    setChart(months)

    const stages = ['New','Qualified','Contacted','Replied','Interested','Call','Proposal','Negotiation','Won']
    setFunnel(stages.map(s=>({ stage:s, count:leads.filter(l=>l.status===s).length })))

    const catMap:Record<string,number> = {}
    payments.forEach(p=>{ catMap[p.category]=(catMap[p.category]||0)+Number(p.amount) })
    setBySource(Object.entries(catMap).map(([name,value])=>({ name, value })))

    setSummary({
      totalRevenue: payments.reduce((s:number,p:any)=>s+Number(p.amount),0),
      totalExpenses: expenses.reduce((s:number,e:any)=>s+Number(e.amount),0),
      totalLeads: leads.length,
      activeClients: clients.filter(c=>c.status==='Active').length,
      wonDeals: leads.filter(l=>l.status==='Won').length,
    })
  },[])

  const profit = summary.totalRevenue - summary.totalExpenses

  return (
    <div>
      <Header title="Analytics"/>
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'Total Revenue', value:formatCurrency(summary.totalRevenue), color:'text-emerald-400' },
            { label:'Total Expenses', value:formatCurrency(summary.totalExpenses), color:'text-red-400' },
            { label:'Net Profit', value:formatCurrency(profit), color:profit>=0?'text-indigo-400':'text-red-400' },
            { label:'Total Leads', value:summary.totalLeads, color:'text-blue-400' },
            { label:'Active Clients', value:summary.activeClients, color:'text-cyan-400' },
            { label:'Won Deals', value:summary.wonDeals, color:'text-violet-400' },
          ].map(s=>(
            <div key={s.label} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm font-semibold text-slate-200 mb-4">Revenue, Expenses & Profit (6 months)</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.12}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`}/>
              <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:8,fontSize:12}} formatter={(v:unknown)=>formatCurrency(Number(v))}/>
              <Legend wrapperStyle={{fontSize:11,color:'#94a3b8'}}/>
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#gR)" name="Revenue"/>
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gE)" name="Expenses"/>
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#gP)" name="Profit"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-semibold text-slate-200 mb-4">Lead Funnel</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel} layout="vertical">
                <XAxis type="number" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis dataKey="stage" type="category" tick={{fill:'#94a3b8',fontSize:11}} axisLine={false} tickLine={false} width={80}/>
                <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:6,fontSize:11}}/>
                <Bar dataKey="count" fill="#6366f1" radius={[0,4,4,0]} name="Leads"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-semibold text-slate-200 mb-4">Revenue by Source</p>
            {bySource.length>0?(
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={bySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${((percent??0)*100).toFixed(0)}%`} labelLine={{stroke:'#475569'}}>
                    {bySource.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:6,fontSize:11}} formatter={(v:unknown)=>formatCurrency(Number(v))}/>
                </PieChart>
              </ResponsiveContainer>
            ):<p className="text-center text-sm text-slate-600 mt-10">No revenue recorded yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
