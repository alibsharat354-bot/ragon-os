'use client'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { insert, logActivity } from '@/lib/store'
import { UserPlus, Users, FolderPlus, CheckSquare, DollarSign, TrendingDown, FileText, Video } from 'lucide-react'

interface Props { open: boolean; onClose: () => void }
type Action = 'lead'|'client'|'project'|'task'|'payment'|'expense'|'invoice'|'ugc'|null

const actions = [
  { id: 'lead', label: 'Add Lead', icon: UserPlus, color: 'text-blue-400' },
  { id: 'client', label: 'Add Client', icon: Users, color: 'text-emerald-400' },
  { id: 'project', label: 'Add Project', icon: FolderPlus, color: 'text-violet-400' },
  { id: 'task', label: 'Add Task', icon: CheckSquare, color: 'text-cyan-400' },
  { id: 'payment', label: 'Record Income', icon: DollarSign, color: 'text-emerald-400' },
  { id: 'expense', label: 'Record Expense', icon: TrendingDown, color: 'text-red-400' },
  { id: 'invoice', label: 'Create Invoice', icon: FileText, color: 'text-yellow-400' },
  { id: 'ugc', label: 'Create UGC Shoot', icon: Video, color: 'text-indigo-400' },
] as const

export function QuickAddModal({ open, onClose }: Props) {
  const [action, setAction] = useState<Action>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      const { getAll } = require('@/lib/store')
      setClients(getAll('clients'))
    }
  }, [open])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function save() {
    if (action === 'lead') {
      insert('leads', { name: form.name, company: form.company||null, email: form.email||null, status: 'New', potential_value: Number(form.value)||0, niche: null, country: null, source: null, notes: null })
      logActivity('Lead created', 'lead', form.name)
    } else if (action === 'client') {
      insert('clients', { name: form.name, company: form.company||null, email: form.email||null, status: 'Active', service: form.service||null, monthly_value: 0, project_value: 0, notes: null })
      logActivity('Client created', 'client', form.name)
    } else if (action === 'project') {
      insert('projects', { name: form.name, status: 'Planning', priority: 'Medium', revenue: Number(form.revenue)||0, cost: 0, client_id: null, service: null, notes: null })
      logActivity('Project created', 'project', form.name)
    } else if (action === 'task') {
      insert('tasks', { title: form.title, priority: form.priority||'Medium', status: 'Todo', category: 'Admin', due_date: form.due_date||null, description: null })
      logActivity('Task created', 'task', form.title)
    } else if (action === 'payment') {
      insert('payments', { amount: Number(form.amount), category: form.category||'Client Payment', client_id: form.client_id||null, payment_date: form.date||new Date().toISOString().split('T')[0], notes: form.notes||null })
      logActivity('Payment recorded', 'payment', `$${form.amount}`)
    } else if (action === 'expense') {
      insert('expenses', { amount: Number(form.amount), category: form.category||'Other', description: form.description, date: form.date||new Date().toISOString().split('T')[0] })
      logActivity('Expense recorded', 'expense', form.description)
    } else if (action === 'invoice') {
      const num = `INV-${Date.now().toString().slice(-6)}`
      insert('invoices', { invoice_number: num, amount: Number(form.amount), status: 'Draft', issue_date: new Date().toISOString().split('T')[0], due_date: form.due_date||null, currency: 'USD', client_id: null })
      logActivity('Invoice created', 'invoice', num)
    } else if (action === 'ugc') {
      insert('ugc_shoots', { videos_planned: Number(form.videos)||0, revenue: Number(form.revenue)||0, status: 'Planned', studio: form.studio||null, videos_shot: 0, videos_edited: 0, studio_cost: 0, model_cost: 0, editing_cost: 0, other_costs: 0 })
      logActivity('UGC shoot created', 'ugc')
    }
    setAction(null); setForm({}); onClose()
    window.dispatchEvent(new Event('ragon-data-update'))
  }

  function handleClose() { setAction(null); setForm({}); onClose() }

  return (
    <Modal open={open} onClose={handleClose} title={action ? actions.find(a=>a.id===action)?.label??'Quick Add' : 'Quick Add'}>
      {!action ? (
        <div className="grid grid-cols-2 gap-2">
          {actions.map(a => (
            <button key={a.id} onClick={() => setAction(a.id as Action)}
              className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-slate-300 hover:border-slate-600 hover:bg-slate-800 transition-colors text-left">
              <a.icon className={`h-4 w-4 flex-shrink-0 ${a.color}`} />{a.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {action === 'lead' && <>
            <div><Label>Name *</Label><Input value={form.name||''} onChange={e=>set('name',e.target.value)} /></div>
            <div><Label>Company</Label><Input value={form.company||''} onChange={e=>set('company',e.target.value)} /></div>
            <div><Label>Email</Label><Input value={form.email||''} onChange={e=>set('email',e.target.value)} /></div>
            <div><Label>Potential Value ($)</Label><Input type="number" value={form.value||''} onChange={e=>set('value',e.target.value)} /></div>
          </>}
          {action === 'client' && <>
            <div><Label>Name *</Label><Input value={form.name||''} onChange={e=>set('name',e.target.value)} /></div>
            <div><Label>Company</Label><Input value={form.company||''} onChange={e=>set('company',e.target.value)} /></div>
            <div><Label>Email</Label><Input value={form.email||''} onChange={e=>set('email',e.target.value)} /></div>
            <div><Label>Service</Label><Input value={form.service||''} onChange={e=>set('service',e.target.value)} placeholder="Video Editing, UGC..." /></div>
          </>}
          {action === 'project' && <>
            <div><Label>Project Name *</Label><Input value={form.name||''} onChange={e=>set('name',e.target.value)} /></div>
            <div><Label>Revenue ($)</Label><Input type="number" value={form.revenue||''} onChange={e=>set('revenue',e.target.value)} /></div>
          </>}
          {action === 'task' && <>
            <div><Label>Task Title *</Label><Input value={form.title||''} onChange={e=>set('title',e.target.value)} /></div>
            <div><Label>Priority</Label><Select value={form.priority||'Medium'} onChange={e=>set('priority',e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></Select></div>
            <div><Label>Due Date</Label><Input type="date" value={form.due_date||''} onChange={e=>set('due_date',e.target.value)} /></div>
          </>}
          {action === 'payment' && <>
            <div><Label>Client (optional)</Label><select className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={form.client_id||''} onChange={e=>set('client_id',e.target.value)}><option value="">No client</option>{clients.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><Label>Amount ($) *</Label><Input type="number" value={form.amount||''} onChange={e=>set('amount',e.target.value)} /></div>
            <div><Label>Category</Label><Select value={form.category||'Client Payment'} onChange={e=>set('category',e.target.value)}><option>Client Payment</option><option>Fiverr</option><option>Upwork</option><option>UGC</option><option>Other</option></Select></div>
            <div><Label>Date</Label><Input type="date" value={form.date||new Date().toISOString().split('T')[0]} onChange={e=>set('date',e.target.value)} /></div>
          </>}
          {action === 'expense' && <>
            <div><Label>Description *</Label><Input value={form.description||''} onChange={e=>set('description',e.target.value)} /></div>
            <div><Label>Amount ($) *</Label><Input type="number" value={form.amount||''} onChange={e=>set('amount',e.target.value)} /></div>
            <div><Label>Category</Label><Select value={form.category||'Other'} onChange={e=>set('category',e.target.value)}><option>Studio</option><option>Models</option><option>Editors</option><option>Software</option><option>Equipment</option><option>Ads</option><option>Other</option></Select></div>
            <div><Label>Date</Label><Input type="date" value={form.date||new Date().toISOString().split('T')[0]} onChange={e=>set('date',e.target.value)} /></div>
          </>}
          {action === 'invoice' && <>
            <div><Label>Amount ($) *</Label><Input type="number" value={form.amount||''} onChange={e=>set('amount',e.target.value)} /></div>
            <div><Label>Due Date</Label><Input type="date" value={form.due_date||''} onChange={e=>set('due_date',e.target.value)} /></div>
          </>}
          {action === 'ugc' && <>
            <div><Label>Studio</Label><Input value={form.studio||''} onChange={e=>set('studio',e.target.value)} /></div>
            <div><Label>Videos Planned</Label><Input type="number" value={form.videos||''} onChange={e=>set('videos',e.target.value)} /></div>
            <div><Label>Revenue ($)</Label><Input type="number" value={form.revenue||''} onChange={e=>set('revenue',e.target.value)} /></div>
          </>}
          <div className="flex gap-2 pt-2">
            <Button onClick={save} className="flex-1">Save</Button>
            <Button variant="secondary" onClick={() => setAction(null)}>Back</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
