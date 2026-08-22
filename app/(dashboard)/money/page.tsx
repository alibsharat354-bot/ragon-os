'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { logActivity } from '@/lib/activity'
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Payment { id: string; amount: number; payment_date: string; category: string; notes: string | null; method: string | null }
interface Expense { id: string; amount: number; date: string; category: string; description: string; notes: string | null }

const INCOME_CATS = ['Client Payment', 'Fiverr', 'Upwork', 'UGC', 'Other']
const EXPENSE_CATS = ['Studio', 'Models', 'Editors', 'Contractors', 'Software', 'Equipment', 'Ads', 'Other']

export default function MoneyPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [incomeForm, setIncomeForm] = useState({ amount: '', category: 'Client Payment', date: new Date().toISOString().split('T')[0], method: '', notes: '' })
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'Other', description: '', date: new Date().toISOString().split('T')[0], notes: '' })
  const [loading, setLoading] = useState(false)
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))

  const load = useCallback(async () => {
    const supabase = createClient()
    const [start, end] = getMonthRange(monthFilter)
    const [{ data: p }, { data: e }] = await Promise.all([
      supabase.from('payments').select('*').gte('payment_date', start).lte('payment_date', end).order('payment_date', { ascending: false }),
      supabase.from('expenses').select('*').gte('date', start).lte('date', end).order('date', { ascending: false }),
    ])
    setPayments(p || [])
    setExpenses(e || [])
  }, [monthFilter])

  useEffect(() => { load() }, [load])

  function getMonthRange(ym: string): [string, string] {
    const [y, m] = ym.split('-').map(Number)
    const start = new Date(y, m - 1, 1).toISOString().split('T')[0]
    const end = new Date(y, m, 0).toISOString().split('T')[0]
    return [start, end]
  }

  async function saveIncome() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('payments').insert({ user_id: user.id, amount: Number(incomeForm.amount), category: incomeForm.category, payment_date: incomeForm.date, method: incomeForm.method || null, notes: incomeForm.notes || null }).select().single()
    if (data) logActivity('Payment recorded', 'payment', data.id, `${formatCurrency(Number(incomeForm.amount))} — ${incomeForm.category}`)
    setShowIncomeModal(false)
    setIncomeForm({ amount: '', category: 'Client Payment', date: new Date().toISOString().split('T')[0], method: '', notes: '' })
    setLoading(false)
    load()
  }

  async function saveExpense() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('expenses').insert({ user_id: user.id, amount: Number(expenseForm.amount), category: expenseForm.category, description: expenseForm.description, date: expenseForm.date, notes: expenseForm.notes || null }).select().single()
    if (data) logActivity('Expense recorded', 'expense', data.id, `${formatCurrency(Number(expenseForm.amount))} — ${expenseForm.description}`)
    setShowExpenseModal(false)
    setExpenseForm({ amount: '', category: 'Other', description: '', date: new Date().toISOString().split('T')[0], notes: '' })
    setLoading(false)
    load()
  }

  const totalIncome = payments.reduce((s, p) => s + p.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const profit = totalIncome - totalExpenses
  const margin = totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(0) : '0'

  // Category breakdown for chart
  const incomeByCategory = INCOME_CATS.map(cat => ({
    name: cat.split(' ')[0],
    value: payments.filter(p => p.category === cat).reduce((s, p) => s + p.amount, 0)
  })).filter(c => c.value > 0)

  const expenseByCategory = EXPENSE_CATS.map(cat => ({
    name: cat,
    value: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
  })).filter(c => c.value > 0)

  return (
    <div>
      <Header title="Money" />
      <div className="p-5 space-y-5">
        {/* Month filter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Month:</label>
            <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowIncomeModal(true)} variant="secondary"><Plus className="h-4 w-4" />Record Income</Button>
            <Button onClick={() => setShowExpenseModal(true)} variant="destructive"><Plus className="h-4 w-4" />Record Expense</Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <p className="text-xs text-emerald-400 font-medium">Revenue</p>
            </div>
            <p className="text-2xl font-bold text-emerald-300">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <p className="text-xs text-red-400 font-medium">Expenses</p>
            </div>
            <p className="text-2xl font-bold text-red-300">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className={`rounded-lg border p-4 ${profit >= 0 ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className={`h-4 w-4 ${profit >= 0 ? 'text-indigo-400' : 'text-red-400'}`} />
              <p className={`text-xs font-medium ${profit >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>Profit</p>
            </div>
            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-indigo-300' : 'text-red-300'}`}>{formatCurrency(profit)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-500 mb-1">Profit Margin</p>
            <p className="text-2xl font-bold text-slate-200">{margin}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Income */}
          <div className="rounded-lg border border-slate-800 bg-slate-900">
            <div className="px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-semibold text-slate-200">Income ({payments.length} records)</p>
            </div>
            {incomeByCategory.length > 0 && (
              <div className="px-4 py-3 border-b border-slate-800">
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={incomeByCategory}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, fontSize: 11 }} formatter={(v: unknown) => formatCurrency(Number(v))} />
                    <Bar dataKey="value" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="divide-y divide-slate-800 max-h-64 overflow-y-auto">
              {payments.length === 0 ? <p className="px-4 py-6 text-center text-sm text-slate-600">No income recorded</p>
                : payments.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-emerald-400">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-slate-500">{p.category}{p.notes ? ` • ${p.notes}` : ''}</p>
                  </div>
                  <span className="text-xs text-slate-600">{formatDate(p.payment_date)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses */}
          <div className="rounded-lg border border-slate-800 bg-slate-900">
            <div className="px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-semibold text-slate-200">Expenses ({expenses.length} records)</p>
            </div>
            {expenseByCategory.length > 0 && (
              <div className="px-4 py-3 border-b border-slate-800">
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={expenseByCategory}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, fontSize: 11 }} formatter={(v: unknown) => formatCurrency(Number(v))} />
                    <Bar dataKey="value" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="divide-y divide-slate-800 max-h-64 overflow-y-auto">
              {expenses.length === 0 ? <p className="px-4 py-6 text-center text-sm text-slate-600">No expenses recorded</p>
                : expenses.map(e => (
                <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-red-400">{formatCurrency(e.amount)}</p>
                    <p className="text-xs text-slate-500">{e.category} • {e.description}</p>
                  </div>
                  <span className="text-xs text-slate-600">{formatDate(e.date)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={showIncomeModal} onClose={() => setShowIncomeModal(false)} title="Record Income">
        <div className="space-y-3">
          <div><Label>Amount ($) *</Label><Input type="number" value={incomeForm.amount} onChange={e=>setIncomeForm(f=>({...f,amount:e.target.value}))} /></div>
          <div><Label>Category</Label><Select value={incomeForm.category} onChange={e=>setIncomeForm(f=>({...f,category:e.target.value}))}>
            {INCOME_CATS.map(c=><option key={c}>{c}</option>)}
          </Select></div>
          <div><Label>Date</Label><Input type="date" value={incomeForm.date} onChange={e=>setIncomeForm(f=>({...f,date:e.target.value}))} /></div>
          <div><Label>Method</Label><Input value={incomeForm.method} onChange={e=>setIncomeForm(f=>({...f,method:e.target.value}))} placeholder="Bank transfer, PayPal..." /></div>
          <div><Label>Notes</Label><Input value={incomeForm.notes} onChange={e=>setIncomeForm(f=>({...f,notes:e.target.value}))} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowIncomeModal(false)}>Cancel</Button>
            <Button onClick={saveIncome} loading={loading}>Save Income</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Record Expense">
        <div className="space-y-3">
          <div><Label>Description *</Label><Input value={expenseForm.description} onChange={e=>setExpenseForm(f=>({...f,description:e.target.value}))} /></div>
          <div><Label>Amount ($) *</Label><Input type="number" value={expenseForm.amount} onChange={e=>setExpenseForm(f=>({...f,amount:e.target.value}))} /></div>
          <div><Label>Category</Label><Select value={expenseForm.category} onChange={e=>setExpenseForm(f=>({...f,category:e.target.value}))}>
            {EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}
          </Select></div>
          <div><Label>Date</Label><Input type="date" value={expenseForm.date} onChange={e=>setExpenseForm(f=>({...f,date:e.target.value}))} /></div>
          <div><Label>Notes</Label><Input value={expenseForm.notes} onChange={e=>setExpenseForm(f=>({...f,notes:e.target.value}))} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
            <Button onClick={saveExpense} loading={loading}>Save Expense</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
