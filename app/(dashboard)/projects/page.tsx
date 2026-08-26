'use client'
import { useEffect, useState } from 'react'
import { getAll, insert, update, remove, logActivity } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'

const STATUSES = ['Planning','Production','Editing','Review','Revision','Delivered','Completed','Paused']

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string,string>>({ name:'', client_id:'', service:'', status:'Planning', priority:'Medium', revenue:'0', cost:'0', deadline:'', notes:'' })

  function load() { setProjects(getAll('projects')); setClients(getAll('clients')) }
  useEffect(() => { load(); window.addEventListener('ragon-data-update', load); return () => window.removeEventListener('ragon-data-update', load) }, [])

  function setF(k:string, v:string) { setForm(f=>({...f,[k]:v})) }
  function openNew() { setEditing(null); setForm({ name:'', client_id:'', service:'', status:'Planning', priority:'Medium', revenue:'0', cost:'0', deadline:'', notes:'' }); setShowModal(true) }
  function openEdit(p:any) { setEditing(p); setForm({ name:p.name, client_id:p.client_id||'', service:p.service||'', status:p.status, priority:p.priority||'Medium', revenue:String(p.revenue||0), cost:String(p.cost||0), deadline:p.deadline||'', notes:p.notes||'' }); setShowModal(true) }

  function save() {
    const data = { name:form.name, client_id:form.client_id||null, service:form.service||null, status:form.status, priority:form.priority, revenue:Number(form.revenue), cost:Number(form.cost), deadline:form.deadline||null, notes:form.notes||null }
    if (editing) { update('projects', editing.id, data); logActivity('Project updated', 'project', form.name) }
    else { insert('projects', data); logActivity('Project created', 'project', form.name) }
    setShowModal(false); load(); window.dispatchEvent(new Event('ragon-data-update'))
  }

  function del(id:string, name:string) {
    if (!confirm(`Delete "${name}"?`)) return
    remove('projects', id); load(); window.dispatchEvent(new Event('ragon-data-update'))
  }

  const filtered = projects.filter(p => (!search || p.name.toLowerCase().includes(search.toLowerCase())) && (!statusFilter || p.status === statusFilter))

  return (
    <div>
      <Header title="Projects" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" /><Input className="pl-8" placeholder="Search projects..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
            <Select className="w-36" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">All statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</Select>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4" />Add Project</Button>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {['Production','Editing','Review','Completed'].map(s=>(
            <div key={s} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">{s}</p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{projects.filter(p=>p.status===s).length}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-800">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Project</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Client</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Priority</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Revenue</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Profit</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Deadline</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-600">No projects found</td></tr>
              : filtered.map(p=>{
                const client = clients.find(c=>c.id===p.client_id)
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-3"><p className="text-sm font-medium text-slate-200">{p.name}</p>{p.service&&<p className="text-xs text-slate-500">{p.service}</p>}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{client?.name||'—'}</td>
                    <td className="px-4 py-3"><Badge status={p.status}>{p.status}</Badge></td>
                    <td className="px-4 py-3"><Badge status={p.priority}>{p.priority}</Badge></td>
                    <td className="px-4 py-3 text-sm text-slate-300">{formatCurrency(p.revenue||0)}</td>
                    <td className="px-4 py-3"><span className={`text-sm font-medium ${(p.revenue-p.cost)>=0?'text-emerald-400':'text-red-400'}`}>{formatCurrency((p.revenue||0)-(p.cost||0))}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(p.deadline)}</td>
                    <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                      <button onClick={()=>openEdit(p)} className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={()=>del(p.id,p.name)} className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?'Edit Project':'Add Project'} size="lg">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Project Name *</Label><Input value={form.name} onChange={e=>setF('name',e.target.value)} /></div>
          <div><Label>Client</Label><Select value={form.client_id} onChange={e=>setF('client_id',e.target.value)}><option value="">No client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
          <div><Label>Service</Label><Input value={form.service} onChange={e=>setF('service',e.target.value)} placeholder="Video Editing, UGC..." /></div>
          <div><Label>Status</Label><Select value={form.status} onChange={e=>setF('status',e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</Select></div>
          <div><Label>Priority</Label><Select value={form.priority} onChange={e=>setF('priority',e.target.value)}><option>Low</option><option>Medium</option><option>High</option></Select></div>
          <div><Label>Revenue ($)</Label><Input type="number" value={form.revenue} onChange={e=>setF('revenue',e.target.value)} /></div>
          <div><Label>Cost ($)</Label><Input type="number" value={form.cost} onChange={e=>setF('cost',e.target.value)} /></div>
          <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e=>setF('deadline',e.target.value)} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e=>setF('notes',e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Button>
          <Button onClick={save}>Save Project</Button>
        </div>
      </Modal>
    </div>
  )
}
