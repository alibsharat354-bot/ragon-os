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

const STATUSES = ['Lead','Prospect','Active','Paused','Completed','Lost']

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string,string>>({ name:'', company:'', email:'', phone:'', country:'', service:'', status:'Active', monthly_value:'0', notes:'' })

  function load() { setClients(getAll('clients')) }
  useEffect(() => { load(); window.addEventListener('ragon-data-update', load); return () => window.removeEventListener('ragon-data-update', load) }, [])

  function setF(k:string, v:string) { setForm(f=>({...f,[k]:v})) }
  function openNew() { setEditing(null); setForm({ name:'', company:'', email:'', phone:'', country:'', service:'', status:'Active', monthly_value:'0', notes:'' }); setShowModal(true) }
  function openEdit(c:any) { setEditing(c); setForm({ name:c.name, company:c.company||'', email:c.email||'', phone:c.phone||'', country:c.country||'', service:c.service||'', status:c.status, monthly_value:String(c.monthly_value||0), notes:c.notes||'' }); setShowModal(true) }

  function save() {
    const data = { name:form.name, company:form.company||null, email:form.email||null, phone:form.phone||null, country:form.country||null, service:form.service||null, status:form.status, monthly_value:Number(form.monthly_value), notes:form.notes||null }
    if (editing) { update('clients', editing.id, data); logActivity('Client updated', 'client', form.name) }
    else { insert('clients', data); logActivity('Client created', 'client', form.name) }
    setShowModal(false); load()
    window.dispatchEvent(new Event('ragon-data-update'))
  }

  function del(id:string, name:string) {
    if (!confirm(`Delete ${name}?`)) return
    remove('clients', id); logActivity('Client deleted', 'client', name); load()
    window.dispatchEvent(new Event('ragon-data-update'))
  }

  const filtered = clients.filter(c => (!search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.company||'').toLowerCase().includes(search.toLowerCase())) && (!statusFilter || c.status === statusFilter))

  return (
    <div>
      <Header title="Clients" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" /><Input className="pl-8" placeholder="Search clients..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
            <Select className="w-36" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">All statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</Select>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4" />Add Client</Button>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {['Active','Lead','Paused','Completed'].map(s=>(
            <div key={s} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">{s}</p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{clients.filter(c=>c.status===s).length}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-800">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Client</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Service</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Monthly</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Country</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-600">No clients yet — add your first client</td></tr>
              : filtered.map(c=>(
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-indigo-400">{c.name[0]}</span></div><div><p className="text-sm font-medium text-slate-200">{c.name}</p>{c.company&&<p className="text-xs text-slate-500">{c.company}</p>}</div></div></td>
                  <td className="px-4 py-3 text-sm text-slate-400">{c.service||'—'}</td>
                  <td className="px-4 py-3"><Badge status={c.status}>{c.status}</Badge></td>
                  <td className="px-4 py-3 text-sm text-slate-300">{c.monthly_value?formatCurrency(c.monthly_value):'—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{c.country||'—'}</td>
                  <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={()=>openEdit(c)} className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={()=>del(c.id,c.name)} className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?'Edit Client':'Add Client'} size="lg">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Name *</Label><Input value={form.name} onChange={e=>setF('name',e.target.value)} /></div>
          <div><Label>Company</Label><Input value={form.company} onChange={e=>setF('company',e.target.value)} /></div>
          <div><Label>Email</Label><Input value={form.email} onChange={e=>setF('email',e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={e=>setF('phone',e.target.value)} /></div>
          <div><Label>Country</Label><Input value={form.country} onChange={e=>setF('country',e.target.value)} /></div>
          <div><Label>Service</Label><Input value={form.service} onChange={e=>setF('service',e.target.value)} placeholder="Video Editing, UGC..." /></div>
          <div><Label>Status</Label><Select value={form.status} onChange={e=>setF('status',e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</Select></div>
          <div><Label>Monthly Value ($)</Label><Input type="number" value={form.monthly_value} onChange={e=>setF('monthly_value',e.target.value)} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={e=>setF('notes',e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Button>
          <Button onClick={save}>Save Client</Button>
        </div>
      </Modal>
    </div>
  )
}
