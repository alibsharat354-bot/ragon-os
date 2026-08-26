'use client'
import { useEffect, useState } from 'react'
import { getAll, insert, update, remove, logActivity } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'

const STATUSES = ['New','Qualified','Contacted','Replied','Interested','Call','Proposal','Negotiation','Won','Lost']

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'table'|'kanban'>('table')
  const [form, setForm] = useState<Record<string,string>>({ name:'', company:'', email:'', niche:'', country:'', source:'', potential_value:'0', status:'New', notes:'' })

  function load() { setLeads(getAll('leads')) }
  useEffect(() => { load(); window.addEventListener('ragon-data-update', load); return () => window.removeEventListener('ragon-data-update', load) }, [])

  function setF(k:string, v:string) { setForm(f=>({...f,[k]:v})) }
  function openNew() { setEditing(null); setForm({ name:'', company:'', email:'', niche:'', country:'', source:'', potential_value:'0', status:'New', notes:'' }); setShowModal(true) }
  function openEdit(l:any) { setEditing(l); setForm({ name:l.name, company:l.company||'', email:l.email||'', niche:l.niche||'', country:l.country||'', source:l.source||'', potential_value:String(l.potential_value||0), status:l.status, notes:l.notes||'' }); setShowModal(true) }

  function save() {
    const data = { name:form.name, company:form.company||null, email:form.email||null, niche:form.niche||null, country:form.country||null, source:form.source||null, potential_value:Number(form.potential_value), status:form.status, notes:form.notes||null }
    if (editing) { update('leads', editing.id, data); logActivity('Lead updated', 'lead', form.name) }
    else { insert('leads', data); logActivity('Lead created', 'lead', form.name) }
    setShowModal(false); load(); window.dispatchEvent(new Event('ragon-data-update'))
  }

  function del(id:string, name:string) { if(!confirm(`Delete "${name}"?`)) return; remove('leads',id); load(); window.dispatchEvent(new Event('ragon-data-update')) }
  function moveStatus(id:string, status:string) { update('leads',id,{status}); logActivity(`Lead moved to ${status}`,'lead'); load(); window.dispatchEvent(new Event('ragon-data-update')) }

  const filtered = leads.filter(l => (!search||(l.name+' '+(l.company||'')).toLowerCase().includes(search.toLowerCase())) && (!statusFilter||l.status===statusFilter))
  const pipelineLeads = leads.filter(l=>!['Won','Lost'].includes(l.status))
  const pipelineValue = pipelineLeads.reduce((s:number,l:any)=>s+Number(l.potential_value||0),0)

  return (
    <div>
      <Header title="Leads" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500"/><Input className="pl-8" placeholder="Search leads..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <Select className="w-36" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">All statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</Select>
            <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              {(['table','kanban'] as const).map(v=><button key={v} onClick={()=>setViewMode(v)} className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${viewMode===v?'bg-indigo-600 text-white':'text-slate-500 hover:text-slate-300'}`}>{v}</button>)}
            </div>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4"/>Add Lead</Button>
        </div>
        <div className="grid grid-cols-5 gap-3 mb-4">
          {[{l:'Total',v:leads.length,c:'text-slate-100'},{l:'Pipeline',v:pipelineLeads.length,c:'text-slate-100'},{l:'Pipeline Value',v:formatCurrency(pipelineValue),c:'text-indigo-400'},{l:'Won',v:leads.filter(l=>l.status==='Won').length,c:'text-emerald-400'},{l:'Lost',v:leads.filter(l=>l.status==='Lost').length,c:'text-red-400'}].map(s=>(
            <div key={s.l} className="rounded-lg border border-slate-800 bg-slate-900 p-3"><p className="text-xs text-slate-500">{s.l}</p><p className={`text-xl font-bold mt-0.5 ${s.c}`}>{s.v}</p></div>
          ))}
        </div>
        {viewMode==='table' ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-slate-800">
                {['Lead','Niche','Source','Status','Value','Country','Actions'].map(h=><th key={h} className={`px-4 py-2.5 text-xs font-medium text-slate-500 ${h==='Actions'?'text-right':'text-left'}`}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.length===0?<tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">No leads found</td></tr>
                :filtered.map(l=>(
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-3"><p className="text-sm font-medium text-slate-200">{l.name}</p>{l.company&&<p className="text-xs text-slate-500">{l.company}</p>}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{l.niche||'—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{l.source||'—'}</td>
                    <td className="px-4 py-3"><Select className="!w-auto !py-1 text-xs" value={l.status} onChange={e=>moveStatus(l.id,e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</Select></td>
                    <td className="px-4 py-3 text-sm text-slate-300">{l.potential_value?formatCurrency(l.potential_value):'—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{l.country||'—'}</td>
                    <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                      <button onClick={()=>openEdit(l)} className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700"><Pencil className="h-3.5 w-3.5"/></button>
                      <button onClick={()=>del(l.id,l.name)} className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700"><Trash2 className="h-3.5 w-3.5"/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {STATUSES.filter(s=>s!=='Lost').map(status=>{
              const cols = leads.filter(l=>l.status===status)
              return (
                <div key={status} className="flex-shrink-0 w-52">
                  <div className="flex items-center gap-2 mb-2"><Badge status={status}>{status}</Badge><span className="text-xs text-slate-500">{cols.length}</span></div>
                  <div className="space-y-2 min-h-[100px]">
                    {cols.map(l=>(
                      <div key={l.id} className="rounded-lg border border-slate-700 bg-slate-900 p-3 cursor-pointer hover:border-slate-600">
                        <p className="text-sm font-semibold text-slate-200 truncate">{l.name}</p>
                        {l.company&&<p className="text-xs text-slate-500 truncate">{l.company}</p>}
                        {l.potential_value>0&&<p className="text-xs text-indigo-400 mt-1">{formatCurrency(l.potential_value)}</p>}
                      </div>
                    ))}
                    {cols.length===0&&<div className="rounded-lg border border-dashed border-slate-800 p-4 text-center"><p className="text-xs text-slate-700">Empty</p></div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?'Edit Lead':'Add Lead'} size="lg">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Name *</Label><Input value={form.name} onChange={e=>setF('name',e.target.value)}/></div>
          <div><Label>Company</Label><Input value={form.company} onChange={e=>setF('company',e.target.value)}/></div>
          <div><Label>Email</Label><Input value={form.email} onChange={e=>setF('email',e.target.value)}/></div>
          <div><Label>Niche</Label><Input value={form.niche} onChange={e=>setF('niche',e.target.value)} placeholder="Fitness, Finance..."/></div>
          <div><Label>Country</Label><Input value={form.country} onChange={e=>setF('country',e.target.value)}/></div>
          <div><Label>Source</Label><Input value={form.source} onChange={e=>setF('source',e.target.value)} placeholder="Instagram, Email..."/></div>
          <div><Label>Status</Label><Select value={form.status} onChange={e=>setF('status',e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</Select></div>
          <div><Label>Potential Value ($)</Label><Input type="number" value={form.potential_value} onChange={e=>setF('potential_value',e.target.value)}/></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e=>setF('notes',e.target.value)}/></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Button>
          <Button onClick={save}>Save Lead</Button>
        </div>
      </Modal>
    </div>
  )
}
