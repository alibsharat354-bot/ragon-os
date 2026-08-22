'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { logActivity } from '@/lib/activity'
import { Plus, CheckSquare, Clock, AlertTriangle } from 'lucide-react'
import type { Task, TaskStatus, TaskPriority, TaskCategory, Client } from '@/types'

const CATEGORIES: TaskCategory[] = ['Client', 'Project', 'Lead', 'Outreach', 'UGC', 'Fiverr', 'Upwork', 'Admin']
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent']

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [view, setView] = useState<'today' | 'upcoming' | 'overdue' | 'all'>('today')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState<Partial<Task>>({ title: '', priority: 'Medium', status: 'Todo', category: 'Admin' })
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('tasks').select('*, clients(name)').not('status', 'eq', 'Cancelled').order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('clients').select('id, name'),
    ])
    setTasks(t || [])
    setClients((c || []) as Client[])
  }, [])

  useEffect(() => { load() }, [load])

  function set(k: string, v: string | null) { setForm(f => ({ ...f, [k]: v })) }

  function openNew() { setEditing(null); setForm({ title: '', priority: 'Medium', status: 'Todo', category: 'Admin' }); setShowModal(true) }
  function openEdit(t: Task) { setEditing(t); setForm(t); setShowModal(true) }

  async function save() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    if (editing) {
      await supabase.from('tasks').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
    } else {
      const { data } = await supabase.from('tasks').insert({ ...form, user_id: user.id }).select().single()
      if (data) logActivity('Task created', 'task', data.id, data.title)
    }
    setShowModal(false)
    setLoading(false)
    load()
  }

  async function complete(task: Task) {
    const supabase = createClient()
    const newStatus: TaskStatus = task.status === 'Completed' ? 'Todo' : 'Completed'
    await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', task.id)
    if (newStatus === 'Completed') logActivity('Task completed', 'task', task.id, task.title)
    load()
  }

  const filtered = tasks.filter(t => {
    if (view === 'today') return t.due_date === today && t.status !== 'Completed'
    if (view === 'upcoming') return t.due_date && t.due_date > today && t.status !== 'Completed'
    if (view === 'overdue') return t.due_date && t.due_date < today && t.status !== 'Completed'
    return true
  })

  const overdueCount = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'Completed').length

  return (
    <div>
      <Header title="Tasks" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {(['today', 'upcoming', 'overdue', 'all'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${view === v ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {v} {v === 'overdue' && overdueCount > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">{overdueCount}</span>}
              </button>
            ))}
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4" />Add Task</Button>
        </div>

        <div className="space-y-1">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-600">
              {view === 'today' ? 'No tasks due today 🎉' : view === 'overdue' ? 'No overdue tasks' : 'No tasks in this view'}
            </div>
          ) : filtered.map(t => (
            <div key={t.id} className={`flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-slate-800/40 transition-colors group ${t.status === 'Completed' ? 'border-slate-800/50 bg-slate-900/50 opacity-60' : 'border-slate-800 bg-slate-900'}`}>
              <button onClick={() => complete(t)} className="flex-shrink-0">
                {t.status === 'Completed' ? (
                  <CheckSquare className="h-4 w-4 text-emerald-500" />
                ) : (
                  <div className="h-4 w-4 rounded border border-slate-600 hover:border-indigo-500 transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>{t.title}</p>
                {t.description && <p className="text-xs text-slate-500 truncate">{t.description}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge>{t.category}</Badge>
                <Badge status={t.priority}>{t.priority}</Badge>
                {t.due_date && (
                  <div className={`flex items-center gap-1 text-xs ${t.due_date < today && t.status !== 'Completed' ? 'text-red-400' : 'text-slate-500'}`}>
                    {t.due_date < today && t.status !== 'Completed' ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {formatDate(t.due_date)}
                  </div>
                )}
                <button onClick={() => openEdit(t)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-opacity">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Task' : 'Add Task'}>
        <div className="space-y-3">
          <div><Label>Title *</Label><Input value={form.title||''} onChange={e=>set('title',e.target.value)} /></div>
          <div><Label>Description</Label><Textarea rows={2} value={form.description||''} onChange={e=>set('description',e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label>
              <Select value={form.category||'Admin'} onChange={e=>set('category',e.target.value)}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </Select>
            </div>
            <div><Label>Priority</Label>
              <Select value={form.priority||'Medium'} onChange={e=>set('priority',e.target.value)}>
                {PRIORITIES.map(p=><option key={p}>{p}</option>)}
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status||'Todo'} onChange={e=>set('status',e.target.value)}>
                {['Todo','In Progress','Completed','Cancelled'].map(s=><option key={s}>{s}</option>)}
              </Select>
            </div>
            <div><Label>Due Date</Label><Input type="date" value={form.due_date||''} onChange={e=>set('due_date',e.target.value||null)} /></div>
          </div>
          <div><Label>Client</Label>
            <Select value={form.client_id||''} onChange={e=>set('client_id',e.target.value||null)}>
              <option value="">No client</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save} loading={loading}>Save Task</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
