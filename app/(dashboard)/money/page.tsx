'use client'
import { useEffect, useState } from 'react'
import { getAll, insert, logActivity } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Label, Select } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const INCOME_CATS = ['Client Payment','Fiverr','Upwork','UGC','Other']
const EXPENSE_CATS = ['Studio','Models','Editors','Contractors','Software','Equipment','Ads','Other']

export default function MoneyPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0,7))
  const [showIncome, setShowIncome] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [iForm, setIForm] = useState({ amount:'', category:'Client Payment', date:new Date().toISOString().split('T')[0], notes:'' })
  const [eForm, setEForm] = useState({ amount:'', category:'Other', description:'', date:new Date().toISOString().split('T')[0] })

  function getRange(ym:string):[string,string] {
    const [y,m] = ym.split('-').map(Number)
    return [new Date(y,m-1,1).toISOString().split('T')[0], new Date(y,m,0).toISOString().split('T')[0]]
  }

  function load() {
    const [start,end] = getRange(monthFilter)
    setPayments(getAll<any>('payments').filter(p=>p.payment_date>=start&&p.payment_date<=end))
    setExpenses(getAll<any>('expenses').filter(e=>e.date>=start&&e.date<=end))
  }

  useEffect(() => { load(); window.addEventListener('ragon-data-update',load); return ()=>window.removeEventListener('ragon-data-update',load) }, [monthFilter])

  function saveIncome() {
    insert('payments',{ amount:Number(iForm.amount), category:iForm.category, payment_date:iForm.date, notes:iForm.notes||null })
    logActivity('Payment recorded','payment',`${formatCurrency(Number(iForm.amount))} — ${iForm.category}`)
    setShowIncome(false); setIForm({ amount:'', category:'Client Payment', date:new Date().toISOString().split('T')[0], notes:'' })
    load(); window.dispatchEvent(new Event('ragon-data-update'))
  }

  function saveExpense() {
    insert('expenses',{ amount:Number(eForm.amount), category:eForm.category, description:eForm.description, date:eForm.date })
    logActivity('Expense recorded','expense',`${formatCurrency(Number(eForm.amount))} — ${eForm.description}`)
    setShowExpense(false); setEForm({ amount:'', category:'Other', description:'', date:new Date().toISOString().split('T')[0] })
    load(); window.dispatchEvent(new Event('ragon-data-update'))
  }

  const totalIncome = payments.reduce((s:number,p:any)=>s+Number(p.amount),0)
  const totalExpenses = expenses.reduce((s:number,e:any)=>s+Number(e.amount),0)
  const profit = totalIncome - totalExpenses
  const margin = totalIncome > 0 ? ((profit/totalIncome)*100).toFixed(0) : '0'

  const incomeByCategory = INCOME_CATS.map(cat=>({ name:cat.split(' ')[0], value:payments.filter(p=>p.category===cat).reduce((s:number,p:any)=>s+Number(p.amount),0) })).filter(c=>c.value>0)
  const expenseByCategory = EXPENSE_CATS.map(cat=>({ name:cat, value:expenses.filter(e=>e.category===cat).reduce((s:number,e:any)=>s+Number(e.amount),0) })).filter(c=>c.value>0)

  return (
    <div>
      <Header title="Money" />
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Month:</label>
            <input type="month" value={monthFilter} onChange={e=>setMonthFilter(e.target.value)} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
          </div>
          <div className="flex gap-2">
            <Button onClick={()=>setShowIncome(true)} variant="secondary"><Plus className="h-4 w-4"/>Record Income</Button>
            <Button onClick={()=>setShowExpense(true)} variant="destructive"><Plus className="h-4 w-4"/>Record Expense</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-emerald-400"/><p className="text-xs text-emerald-400 font-medium">Revenue</p></div><p className="text-2xl font-bold text-emerald-300">{formatCurrency(totalIncome)}</p></div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4"><div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-red-400"/><p className="text-xs text-red-400 font-medium">Expenses</p></div><p className="text-2xl font-bold text-red-300">{formatCurrency(totalExpenses)}</p></div>
          <div className={`rounded-lg border p-4 ${profit>=0?'border-indigo-500/20 bg-indigo-500/5':'border-red-500/20 bg-red-500/5'}`}><div className="flex items-center gap-2 mb-1"><DollarSign className={`h-4 w-4 ${profit>=0?'text-indigo-400':'text-red-400'}`}/><p className={`text-xs font-medium ${profit>=0?'text-indigo-400':'text-red-400'}`}>Profit</p></div><p className={`text-2xl font-bold ${profit>=0?'text-indigo-300':'text-red-300'}`}>{formatCurrency(profit)}</p></div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-500 mb-1">Profit Margin</p><p className="text-2xl font-bold text-slate-200">{margin}%</p></div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="rounded-lg border border-slate-800 bg-slate-900">
            <div className="px-4 py-3 border-b border-slate-800"><p className="text-sm font-semibold text-slate-200">Income ({payments.length} records)</p></div>
            {incomeByCategory.length>0&&<div className="px-4 py-3 border-b border-slate-800"><ResponsiveContainer width="100%" height={100}><BarChart data={incomeByCategory}><XAxis dataKey="name" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:6,fontSize:11}} formatter={(v:unknown)=>formatCurrency(Number(v))}/><Bar dataKey="value" fill="#6366f1" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>}
            <div className="divide-y divide-slate-800 max-h-64 overflow-y-auto">
              {payments.length===0?<p className="px-4 py-6 text-center text-sm text-slate-600">No income recorded</p>
              :payments.map(p=>(
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                  <div><p className="text-sm font-medium text-emerald-400">{formatCurrency(p.amount)}</p><p className="text-xs text-slate-500">{p.category}{p.notes?` • ${p.notes}`:''}</p></div>
                  <span className="text-xs text-slate-600">{formatDate(p.payment_date)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900">
            <div className="px-4 py-3 border-b border-slate-800"><p className="text-sm font-semibold text-slate-200">Expenses ({expenses.length} records)</p></div>
            {expenseByCategory.length>0&&<div className="px-4 py-3 border-b border-slate-800"><ResponsiveContainer width="100%" height={100}><BarChart data={expenseByCategory}><XAxis dataKey="name" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:6,fontSize:11}} formatter={(v:unknown)=>formatCurrency(Number(v))}/><Bar dataKey="value" fill="#ef4444" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>}
            <div className="divide-y divide-slate-800 max-h-64 overflow-y-auto">
              {expenses.length===0?<p className="px-4 py-6 text-center text-sm text-slate-600">No expenses recorded</p>
              :expenses.map(e=>(
                <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                  <div><p className="text-sm font-medium text-red-400">{formatCurrency(e.amount)}</p><p className="text-xs text-slate-500">{e.category} • {e.description}</p></div>
                  <span className="text-xs text-slate-600">{formatDate(e.date)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={showIncome} onClose={()=>setShowIncome(false)} title="Record Income">
        <div className="space-y-3">
          <div><Label>Amount ($) *</Label><Input type="number" value={iForm.amount} onChange={e=>setIForm(f=>({...f,amount:e.target.value}))}/></div>
          <div><Label>Category</Label><Select value={iForm.category} onChange={e=>setIForm(f=>({...f,category:e.target.value}))}>{INCOME_CATS.map(c=><option key={c}>{c}</option>)}</Select></div>
          <div><Label>Date</Label><Input type="date" value={iForm.date} onChange={e=>setIForm(f=>({...f,date:e.target.value}))}/></div>
          <div><Label>Notes</Label><Input value={iForm.notes} onChange={e=>setIForm(f=>({...f,notes:e.target.value}))}/></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={()=>setShowIncome(false)}>Cancel</Button><Button onClick={saveIncome}>Save</Button></div>
        </div>
      </Modal>

      <Modal open={showExpense} onClose={()=>setShowExpense(false)} title="Record Expense">
        <div className="space-y-3">
          <div><Label>Description *</Label><Input value={eForm.description} onChange={e=>setEForm(f=>({...f,description:e.target.value}))}/></div>
          <div><Label>Amount ($) *</Label><Input type="number" value={eForm.amount} onChange={e=>setEForm(f=>({...f,amount:e.target.value}))}/></div>
          <div><Label>Category</Label><Select value={eForm.category} onChange={e=>setEForm(f=>({...f,category:e.target.value}))}>{EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}</Select></div>
          <div><Label>Date</Label><Input type="date" value={eForm.date} onChange={e=>setEForm(f=>({...f,date:e.target.value}))}/></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={()=>setShowExpense(false)}>Cancel</Button><Button onClick={saveExpense}>Save</Button></div>
        </div>
      </Modal>
    </div>
  )
}
