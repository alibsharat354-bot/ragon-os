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
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import type { Project, ProjectStatus, Client } from '@/types'

const STATUSES: ProjectStatus[] = ['Planning', 'Production', 'Editing', 'Review', 'Revision', 'Delivered', 'Completed', 'Paused']

export default function ProjectsPage() {
  const [projects, setProjects] = useState<(Project & { clients?: { name: string } | null })[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState<Partial<Project>>({ name: '', status: 'Planning', priority: 'Medium', revenue: 0, cost: 0 })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: proj }, { data: cl }] = await Promise.all([
      supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').eq('status', 'Active'),
    ])
    setProjects(proj || [])
    setClients((cl || []) as Client[])
  }, [])

  useEffect(() => { load() }, [load])

  function set(k: string, v: string | number | null) { setForm(f => ({ ...f, [k]: v })) }

  function openNew() { setEditing(null); setForm({ name: '', status: 'Planning', priority: 'Medium', revenue: 0, cost: 0 }); setShowModal(true) }
  function openEdit(p: Project) { setEditing(p); setForm(p); setShowModal(true) }

  async function save() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    if (editing) {
      await supabase.from('projects').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
      logActivity('Project updated', 'project', editing.id, form.name)
    } else {
      const { data } = await supabase.from('projects').insert({ ...form, user_id: user.id }).select().single()
      if (data) logActivity('Project created', 'project', data.id, data.name)
    }
    setShowModal(false)
    setLoading(false)
    load()
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete project "${name}"?`)) return
    const supabase = createClient()
    await supabase.from('projects').delete().eq('id', id)
    logActivity('Project deleted', 'project', id, name)
    load()
  }

  const filtered = projects.filter(p => {
    const match = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || p.status === statusFilter
    return match && matchStatus
  })

  return (
    <div>
      <Header title="Projects" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <Input className="pl-8" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select className="w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </Select>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4" />Add Project</Button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {['Production', 'Editing', 'Review', 'Completed'].map(s => (
            <div key={s} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">{s}</p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{projects.filter(p => p.status === s).length}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Project</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Client</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Priority</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Revenue</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Profit</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Deadline</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-600">No projects found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-200">{p.name}</p>
                    {p.service && <p className="text-xs text-slate-500">{p.service}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{p.clients?.name || '—'}</td>
                  <td className="px-4 py-3"><Badge status={p.status}>{p.status}</Badge></td>
                  <td className="px-4 py-3"><Badge status={p.priority}>{p.priority}</Badge></td>
                  <td className="px-4 py-3 text-sm text-slate-300">{formatCurrency(p.revenue)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${p.revenue - p.cost >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(p.revenue - p.cost)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatDate(p.deadline)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => remove(p.id, p.name)} className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Project' : 'Add Project'} size="lg">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Project Name *</Label><Input value={form.name||''} onChange={e=>set('name',e.target.value)} /></div>
          <div><Label>Client</Label>
            <Select value={form.client_id||''} onChange={e=>set('client_id',e.target.value||null)}>
              <option value="">No client</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div><Label>Service</Label><Input value={form.service||''} onChange={e=>set('service',e.target.value)} placeholder="Video Editing, UGC..." /></div>
          <div><Label>Status</Label>
            <Select value={form.status||'Planning'} onChange={e=>set('status',e.target.value)}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </Select>
          </div>
          <div><Label>Priority</Label>
            <Select value={form.priority||'Medium'} onChange={e=>set('priority',e.target.value)}>
              {['Low','Medium','High'].map(p=><option key={p}>{p}</option>)}
            </Select>
          </div>
          <div><Label>Start Date</Label><Input type="date" value={form.start_date||''} onChange={e=>set('start_date',e.target.value)} /></div>
          <div><Label>Deadline</Label><Input type="date" value={form.deadline||''} onChange={e=>set('deadline',e.target.value)} /></div>
          <div><Label>Revenue ($)</Label><Input type="number" value={form.revenue||''} onChange={e=>set('revenue',Number(e.target.value))} /></div>
          <div><Label>Cost ($)</Label><Input type="number" value={form.cost||''} onChange={e=>set('cost',Number(e.target.value))} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes||''} onChange={e=>set('notes',e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={save} loading={loading}>Save Project</Button>
        </div>
      </Modal>
    </div>
  )
}
