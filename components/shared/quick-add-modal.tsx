'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity'
import {
  UserPlus, Users, FolderPlus, CheckSquare, Send,
  MessageSquare, FileText, DollarSign, TrendingDown, Video
} from 'lucide-react'

interface QuickAddModalProps {
  open: boolean
  onClose: () => void
}

type Action = 'lead' | 'client' | 'project' | 'task' | 'outreach' | 'followup' | 'invoice' | 'payment' | 'expense' | 'ugc' | null

const actions = [
  { id: 'lead', label: 'Add Lead', icon: UserPlus, color: 'text-blue-400' },
  { id: 'client', label: 'Add Client', icon: Users, color: 'text-emerald-400' },
  { id: 'project', label: 'Add Project', icon: FolderPlus, color: 'text-violet-400' },
  { id: 'task', label: 'Add Task', icon: CheckSquare, color: 'text-cyan-400' },
  { id: 'outreach', label: 'Log Outreach', icon: Send, color: 'text-orange-400' },
  { id: 'followup', label: 'Create Follow-up', icon: MessageSquare, color: 'text-pink-400' },
  { id: 'invoice', label: 'Create Invoice', icon: FileText, color: 'text-yellow-400' },
  { id: 'payment', label: 'Record Payment', icon: DollarSign, color: 'text-emerald-400' },
  { id: 'expense', label: 'Record Expense', icon: TrendingDown, color: 'text-red-400' },
  { id: 'ugc', label: 'Create UGC Shoot', icon: Video, color: 'text-indigo-400' },
] as const

export function QuickAddModal({ open, onClose }: QuickAddModalProps) {
  const [action, setAction] = useState<Action>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function submit() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    try {
      if (action === 'lead') {
        const { data } = await supabase.from('leads').insert({ user_id: user.id, name: form.name, company: form.company || null, email: form.email || null, status: 'New', potential_value: Number(form.value) || 0 }).select().single()
        if (data) logActivity('Lead created', 'lead', data.id, data.name)
      } else if (action === 'client') {
        const { data } = await supabase.from('clients').insert({ user_id: user.id, name: form.name, company: form.company || null, email: form.email || null, status: 'Active', service: form.service || null }).select().single()
        if (data) logActivity('Client created', 'client', data.id, data.name)
      } else if (action === 'project') {
        const { data } = await supabase.from('projects').insert({ user_id: user.id, name: form.name, status: 'Planning', priority: 'Medium', revenue: Number(form.revenue) || 0, cost: 0 }).select().single()
        if (data) logActivity('Project created', 'project', data.id, data.name)
      } else if (action === 'task') {
        const { data } = await supabase.from('tasks').insert({ user_id: user.id, title: form.title, priority: form.priority || 'Medium', status: 'Todo', category: 'Admin', due_date: form.due_date || null }).select().single()
        if (data) logActivity('Task created', 'task', data.id, data.title)
      } else if (action === 'payment') {
        const { data } = await supabase.from('payments').insert({ user_id: user.id, amount: Number(form.amount), payment_date: form.date || new Date().toISOString().split('T')[0], category: form.category || 'Client Payment', notes: form.notes || null }).select().single()
        if (data) logActivity('Payment recorded', 'payment', data.id, `$${form.amount}`)
      } else if (action === 'expense') {
        const { data } = await supabase.from('expenses').insert({ user_id: user.id, category: form.category || 'Other', description: form.description, amount: Number(form.amount), date: form.date || new Date().toISOString().split('T')[0] }).select().single()
        if (data) logActivity('Expense recorded', 'expense', data.id, data.description)
      } else if (action === 'invoice') {
        const num = `INV-${Date.now().toString().slice(-6)}`
        const { data } = await supabase.from('invoices').insert({ user_id: user.id, invoice_number: num, amount: Number(form.amount), issue_date: new Date().toISOString().split('T')[0], due_date: form.due_date || null, status: 'Draft' }).select().single()
        if (data) logActivity('Invoice created', 'invoice', data.id, num)
      } else if (action === 'ugc') {
        const { data } = await supabase.from('ugc_shoots').insert({ user_id: user.id, videos_planned: Number(form.videos) || 0, revenue: Number(form.revenue) || 0, status: 'Planned', studio: form.studio || null, shoot_date: form.date || null }).select().single()
        if (data) logActivity('UGC shoot created', 'ugc', data.id, `Shoot ${data.id.slice(0,8)}`)
      }
      setAction(null)
      setForm({})
      onClose()
      window.location.reload()
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function handleClose() { setAction(null); setForm({}); onClose() }

  return (
    <Modal open={open} onClose={handleClose} title={action ? actions.find(a => a.id === action)?.label ?? 'Quick Add' : 'Quick Add'}>
      {!action ? (
        <div className="grid grid-cols-2 gap-2">
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => setAction(a.id as Action)}
              className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-slate-300 hover:border-slate-600 hover:bg-slate-800 transition-colors text-left"
            >
              <a.icon className={`h-4 w-4 flex-shrink-0 ${a.color}`} />
              {a.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {action === 'lead' && <>
            <div><Label>Name *</Label><Input value={form.name||''} onChange={e=>set('name',e.target.value)} placeholder="Creator / Brand name" /></div>
            <div><Label>Company</Label><Input value={form.company||''} onChange={e=>set('company',e.target.value)} placeholder="Company" /></div>
            <div><Label>Email</Label><Input value={form.email||''} onChange={e=>set('email',e.target.value)} placeholder="email@example.com" /></div>
            <div><Label>Potential Value ($)</Label><Input type="number" value={form.value||''} onChange={e=>set('value',e.target.value)} placeholder="0" /></div>
          </>}
          {action === 'client' && <>
            <div><Label>Name *</Label><Input value={form.name||''} onChange={e=>set('name',e.target.value)} placeholder="Client name" /></div>
            <div><Label>Company</Label><Input value={form.company||''} onChange={e=>set('company',e.target.value)} /></div>
            <div><Label>Email</Label><Input value={form.email||''} onChange={e=>set('email',e.target.value)} /></div>
            <div><Label>Service</Label><Input value={form.service||''} onChange={e=>set('service',e.target.value)} placeholder="Video Editing, UGC..." /></div>
          </>}
          {action === 'project' && <>
            <div><Label>Project Name *</Label><Input value={form.name||''} onChange={e=>set('name',e.target.value)} /></div>
            <div><Label>Revenue ($)</Label><Input type="number" value={form.revenue||''} onChange={e=>set('revenue',e.target.value)} placeholder="0" /></div>
          </>}
          {action === 'task' && <>
            <div><Label>Task Title *</Label><Input value={form.title||''} onChange={e=>set('title',e.target.value)} /></div>
            <div><Label>Priority</Label><Select value={form.priority||'Medium'} onChange={e=>set('priority',e.target.value)}>
              <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
            </Select></div>
            <div><Label>Due Date</Label><Input type="date" value={form.due_date||''} onChange={e=>set('due_date',e.target.value)} /></div>
          </>}
          {action === 'payment' && <>
            <div><Label>Amount ($) *</Label><Input type="number" value={form.amount||''} onChange={e=>set('amount',e.target.value)} /></div>
            <div><Label>Date</Label><Input type="date" value={form.date||new Date().toISOString().split('T')[0]} onChange={e=>set('date',e.target.value)} /></div>
            <div><Label>Category</Label><Select value={form.category||'Client Payment'} onChange={e=>set('category',e.target.value)}>
              <option>Client Payment</option><option>Fiverr</option><option>Upwork</option><option>UGC</option><option>Other</option>
            </Select></div>
            <div><Label>Notes</Label><Input value={form.notes||''} onChange={e=>set('notes',e.target.value)} /></div>
          </>}
          {action === 'expense' && <>
            <div><Label>Description *</Label><Input value={form.description||''} onChange={e=>set('description',e.target.value)} /></div>
            <div><Label>Amount ($) *</Label><Input type="number" value={form.amount||''} onChange={e=>set('amount',e.target.value)} /></div>
            <div><Label>Category</Label><Select value={form.category||'Other'} onChange={e=>set('category',e.target.value)}>
              <option>Studio</option><option>Models</option><option>Editors</option><option>Contractors</option><option>Software</option><option>Equipment</option><option>Ads</option><option>Other</option>
            </Select></div>
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
            <div><Label>Shoot Date</Label><Input type="date" value={form.date||''} onChange={e=>set('date',e.target.value)} /></div>
          </>}
          {action === 'outreach' && <>
            <div><Label>Lead Name *</Label><Input value={form.name||''} onChange={e=>set('name',e.target.value)} placeholder="Create lead first, then log outreach" /></div>
          </>}
          {action === 'followup' && <>
            <div><Label>Task Title</Label><Input value={form.title||form.name||''} onChange={e=>set('title',e.target.value)} placeholder="Follow up with..." /></div>
            <div><Label>Due Date</Label><Input type="date" value={form.due_date||''} onChange={e=>set('due_date',e.target.value)} /></div>
          </>}
          <div className="flex gap-2 pt-2">
            <Button onClick={submit} loading={loading} className="flex-1">Save</Button>
            <Button variant="secondary" onClick={() => setAction(null)}>Back</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
