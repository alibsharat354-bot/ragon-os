'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { logActivity } from '@/lib/activity'
import { Plus, FileText, AlertCircle } from 'lucide-react'
import type { Invoice, InvoiceStatus, Client } from '@/types'

const STATUSES: InvoiceStatus[] = ['Draft', 'Sent', 'Pending', 'Paid', 'Overdue', 'Cancelled']

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<(Invoice & { clients?: { name: string } | null })[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [form, setForm] = useState<Record<string, string>>({
    amount: '', currency: 'USD', issue_date: new Date().toISOString().split('T')[0],
    due_date: '', status: 'Draft', notes: '', client_id: ''
  })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: inv }, { data: cl }] = await Promise.all([
      supabase.from('invoices').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name'),
    ])
    setInvoices(inv || [])
    setClients((cl || []) as Client[])
  }, [])

  useEffect(() => { load() }, [load])

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function openNew() {
    setEditing(null)
    const num = `INV-${Date.now().toString().slice(-6)}`
    setForm({ invoice_number: num, amount: '', currency: 'USD', issue_date: new Date().toISOString().split('T')[0], due_date: '', status: 'Draft', notes: '', client_id: '' })
    setShowModal(true)
  }
  function openEdit(inv: Invoice) {
    setEditing(inv)
    setForm({
      invoice_number: inv.invoice_number,
      client_id: inv.client_id || '',
      amount: String(inv.amount),
      currency: inv.currency || 'USD',
      issue_date: inv.issue_date || '',
      due_date: inv.due_date || '',
      status: inv.status || 'Draft',
      notes: inv.notes || '',
    })
    setShowModal(true)
  }

  async function save() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const payload = {
      invoice_number: form.invoice_number,
      client_id: form.client_id || null,
      amount: Number(form.amount),
      currency: form.currency,
      issue_date: form.issue_date,
      due_date: form.due_date || null,
      status: form.status,
      notes: form.notes || null,
    }

    if (editing) {
      await supabase.from('invoices').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id)
      logActivity('Invoice updated', 'invoice', editing.id, form.invoice_number)
    } else {
      const { data } = await supabase.from('invoices').insert({ ...payload, user_id: user.id }).select().single()
      if (data) logActivity('Invoice created', 'invoice', data.id, data.invoice_number)
    }
    setShowModal(false)
    setLoading(false)
    load()
  }

  async function markPaid(inv: Invoice) {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('invoices').update({ status: 'Paid', payment_date: today, updated_at: new Date().toISOString() }).eq('id', inv.id)
    // Also record the payment
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('payments').insert({
        user_id: user.id, client_id: inv.client_id || null, invoice_id: inv.id,
        amount: inv.amount, currency: inv.currency, payment_date: today, category: 'Client Payment'
      })
      logActivity('Invoice marked paid', 'invoice', inv.id, inv.invoice_number)
    }
    load()
  }

  const filtered = invoices.filter(i => !statusFilter || i.status === statusFilter)

  const totals = {
    outstanding: invoices.filter(i => ['Sent', 'Pending', 'Overdue'].includes(i.status)).reduce((s, i) => s + i.amount, 0),
    paid: invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0),
    overdue: invoices.filter(i => i.status === 'Overdue').length,
  }

  return (
    <div>
      <Header title="Invoices" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            <Select className="w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </Select>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4" />Create Invoice</Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs text-emerald-400">Total Paid</p>
            <p className="text-xl font-bold text-emerald-300 mt-0.5">{formatCurrency(totals.paid)}</p>
          </div>
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
            <p className="text-xs text-yellow-400">Outstanding</p>
            <p className="text-xl font-bold text-yellow-300 mt-0.5">{formatCurrency(totals.outstanding)}</p>
          </div>
          <div className={`rounded-lg border p-3 ${totals.overdue > 0 ? 'border-red-500/20 bg-red-500/5' : 'border-slate-800 bg-slate-900'}`}>
            <div className="flex items-center gap-1">
              {totals.overdue > 0 && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
              <p className={`text-xs ${totals.overdue > 0 ? 'text-red-400' : 'text-slate-500'}`}>Overdue</p>
            </div>
            <p className={`text-xl font-bold mt-0.5 ${totals.overdue > 0 ? 'text-red-300' : 'text-slate-100'}`}>{totals.overdue}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs text-slate-500">Total Invoices</p>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{invoices.length}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Invoice</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Client</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Amount</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Issued</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Due</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">No invoices found</td></tr>
              ) : filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-600 flex-shrink-0" />
                      <span className="text-sm font-mono font-medium text-slate-200">{inv.invoice_number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{inv.clients?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-200">{formatCurrency(inv.amount)}</td>
                  <td className="px-4 py-3"><Badge status={inv.status}>{inv.status}</Badge></td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatDate(inv.issue_date)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${inv.status === 'Overdue' ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                      {formatDate(inv.due_date)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!['Paid', 'Cancelled'].includes(inv.status) && (
                        <button onClick={() => markPaid(inv)} className="px-2 py-1 rounded text-xs text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors">
                          Mark Paid
                        </button>
                      )}
                      <button onClick={() => openEdit(inv)} className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Invoice' : 'Create Invoice'} size="md">
        <div className="space-y-3">
          <div><Label>Invoice Number</Label><Input value={form.invoice_number||''} onChange={e=>setF('invoice_number',e.target.value)} /></div>
          <div><Label>Client</Label>
            <Select value={form.client_id||''} onChange={e=>setF('client_id',e.target.value)}>
              <option value="">No client</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount ($) *</Label><Input type="number" value={form.amount||''} onChange={e=>setF('amount',e.target.value)} /></div>
            <div><Label>Currency</Label>
              <Select value={form.currency||'USD'} onChange={e=>setF('currency',e.target.value)}>
                {['USD','EUR','GBP','PKR','AED','CAD','AUD'].map(c=><option key={c}>{c}</option>)}
              </Select>
            </div>
            <div><Label>Issue Date</Label><Input type="date" value={form.issue_date||''} onChange={e=>setF('issue_date',e.target.value)} /></div>
            <div><Label>Due Date</Label><Input type="date" value={form.due_date||''} onChange={e=>setF('due_date',e.target.value)} /></div>
          </div>
          <div><Label>Status</Label>
            <Select value={form.status||'Draft'} onChange={e=>setF('status',e.target.value)}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea rows={2} value={form.notes||''} onChange={e=>setF('notes',e.target.value)} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save} loading={loading}>Save Invoice</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
