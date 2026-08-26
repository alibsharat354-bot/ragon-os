'use client'
import { useEffect, useState } from 'react'
import { getAll, insert, update, logActivity } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Video, TrendingUp } from 'lucide-react'

const STATUSES = ['Planned','Shooting','Editing','Delivered','Completed']

export default function UGCPage() {
  const [shoots, setShoots] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string,string>>({ client_id:'', status:'Planned', studio:'', models:'', shoot_date:'', delivery_deadline:'', videos_planned:'0', videos_shot:'0', videos_edited:'0', revenue:'0', studio_cost:'0', model_cost:'0', editing_cost:'0', other_costs:'0', notes:'' })

  function load() { setShoots(getAll('ugc_shoots')); setClients(getAll('clients')) }
  useEffect(()=>{ load(); window.addEventListener('ragon-data-update',load); return ()=>window.removeEventListener('ragon-data-update',load) },[])
  function setF(k:string,v:string){ setForm(f=>({...f,[k]:v})) }

  function openNew() { setEditing(null); setForm({ client_id:'', status:'Planned', studio:'', models:'', shoot_date:'', delivery_deadline:'', videos_planned:'0', videos_shot:'0', videos_edited:'0', revenue:'0', studio_cost:'0', model_cost:'0', editing_cost:'0', other_costs:'0', notes:'' }); setShowModal(true) }
  function openEdit(s:any) { setEditing(s); setForm({ client_id:s.client_id||'', status:s.status, studio:s.studio||'', models:s.models||'', shoot_date:s.shoot_date||'', delivery_deadline:s.delivery_deadline||'', videos_planned:String(s.videos_planned||0), videos_shot:String(s.videos_shot||0), videos_edited:String(s.videos_edited||0), revenue:String(s.revenue||0), studio_cost:String(s.studio_cost||0), model_cost:String(s.model_cost||0), editing_cost:String(s.editing_cost||0), other_costs:String(s.other_costs||0), notes:s.notes||'' }); setShowModal(true) }

  function save() {
    const data = { client_id:form.client_id||null, status:form.status, studio:form.studio||null, models:form.models||null, shoot_date:form.shoot_date||null, delivery_deadline:form.delivery_deadline||null, videos_planned:Number(form.videos_planned), videos_shot:Number(form.videos_shot), videos_edited:Number(form.videos_edited), revenue:Number(form.revenue), studio_cost:Number(form.studio_cost), model_cost:Number(form.model_cost), editing_cost:Number(form.editing_cost), other_costs:Number(form.other_costs), notes:form.notes||null }
    if (editing) { update('ugc_shoots',editing.id,data); logActivity('UGC shoot updated','ugc') }
    else { insert('ugc_shoots',data); logActivity('UGC shoot created','ugc') }
    setShowModal(false); load(); window.dispatchEvent(new Event('ragon-data-update'))
  }

  const totalRevenue = shoots.reduce((s:number,sh:any)=>s+Number(sh.revenue||0),0)
  const totalCost = shoots.reduce((s:number,sh:any)=>s+Number(sh.studio_cost||0)+Number(sh.model_cost||0)+Number(sh.editing_cost||0)+Number(sh.other_costs||0),0)

  return (
    <div>
      <Header title="UGC / Shoots"/>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="grid grid-cols-4 gap-3 flex-1 mr-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3"><p className="text-xs text-slate-500">Total Shoots</p><p className="text-xl font-bold text-slate-100 mt-0.5">{shoots.length}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3"><p className="text-xs text-slate-500">Videos Planned</p><p className="text-xl font-bold text-slate-100 mt-0.5">{shoots.reduce((s:number,sh:any)=>s+Number(sh.videos_planned||0),0)}</p></div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"><p className="text-xs text-emerald-400">Revenue</p><p className="text-xl font-bold text-emerald-300 mt-0.5">{formatCurrency(totalRevenue)}</p></div>
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3"><div className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-indigo-400"/><p className="text-xs text-indigo-400">Profit</p></div><p className="text-xl font-bold text-indigo-300 mt-0.5">{formatCurrency(totalRevenue-totalCost)}</p></div>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4"/>Add Shoot</Button>
        </div>

        {shoots.length===0?<div className="rounded-lg border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-600">No UGC shoots yet</div>
        :<div className="grid grid-cols-2 gap-4">
          {shoots.map(s=>{
            const cost = Number(s.studio_cost||0)+Number(s.model_cost||0)+Number(s.editing_cost||0)+Number(s.other_costs||0)
            const profit = Number(s.revenue||0)-cost
            const margin = s.revenue>0?((profit/s.revenue)*100).toFixed(0):'0'
            const progress = s.videos_planned>0?Math.round((s.videos_edited/s.videos_planned)*100):0
            const client = clients.find(c=>c.id===s.client_id)
            return (
              <div key={s.id} className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 cursor-pointer" onClick={()=>openEdit(s)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-indigo-500/10 p-2"><Video className="h-4 w-4 text-indigo-400"/></div>
                    <div><p className="text-sm font-semibold text-slate-200">{client?.name||'No client'}</p><p className="text-xs text-slate-500">{s.studio||'No studio'} • {formatDate(s.shoot_date)}</p></div>
                  </div>
                  <Badge status={s.status}>{s.status}</Badge>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1"><p className="text-xs text-slate-500">Progress</p><p className="text-xs text-slate-400">{s.videos_edited}/{s.videos_planned} edited</p></div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full"><div className="h-full bg-indigo-500 rounded-full" style={{width:`${progress}%`}}/></div>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800">
                  <div><p className="text-[10px] text-slate-600 uppercase">Revenue</p><p className="text-sm font-semibold text-emerald-400">{formatCurrency(s.revenue||0)}</p></div>
                  <div><p className="text-[10px] text-slate-600 uppercase">Cost</p><p className="text-sm font-semibold text-red-400">{formatCurrency(cost)}</p></div>
                  <div><p className="text-[10px] text-slate-600 uppercase">Profit</p><p className={`text-sm font-semibold ${profit>=0?'text-indigo-400':'text-red-400'}`}>{formatCurrency(profit)}</p></div>
                  <div><p className="text-[10px] text-slate-600 uppercase">Margin</p><p className="text-sm font-semibold text-slate-300">{margin}%</p></div>
                </div>
              </div>
            )
          })}
        </div>}
      </div>
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?'Edit UGC Shoot':'Add UGC Shoot'} size="xl">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Client</Label><Select value={form.client_id} onChange={e=>setF('client_id',e.target.value)}><option value="">No client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
          <div><Label>Status</Label><Select value={form.status} onChange={e=>setF('status',e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</Select></div>
          <div><Label>Studio</Label><Input value={form.studio} onChange={e=>setF('studio',e.target.value)}/></div>
          <div><Label>Models</Label><Input value={form.models} onChange={e=>setF('models',e.target.value)} placeholder="Names or count"/></div>
          <div><Label>Shoot Date</Label><Input type="date" value={form.shoot_date} onChange={e=>setF('shoot_date',e.target.value)}/></div>
          <div><Label>Delivery Deadline</Label><Input type="date" value={form.delivery_deadline} onChange={e=>setF('delivery_deadline',e.target.value)}/></div>
          <div className="col-span-2 border-t border-slate-800 pt-3"><p className="text-xs font-medium text-slate-400 mb-2">Video Progress</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Planned</Label><Input type="number" value={form.videos_planned} onChange={e=>setF('videos_planned',e.target.value)}/></div>
              <div><Label>Shot</Label><Input type="number" value={form.videos_shot} onChange={e=>setF('videos_shot',e.target.value)}/></div>
              <div><Label>Edited</Label><Input type="number" value={form.videos_edited} onChange={e=>setF('videos_edited',e.target.value)}/></div>
            </div>
          </div>
          <div className="col-span-2 border-t border-slate-800 pt-3"><p className="text-xs font-medium text-slate-400 mb-2">Financials ($)</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Revenue</Label><Input type="number" value={form.revenue} onChange={e=>setF('revenue',e.target.value)}/></div>
              <div><Label>Studio Cost</Label><Input type="number" value={form.studio_cost} onChange={e=>setF('studio_cost',e.target.value)}/></div>
              <div><Label>Model Cost</Label><Input type="number" value={form.model_cost} onChange={e=>setF('model_cost',e.target.value)}/></div>
              <div><Label>Editing Cost</Label><Input type="number" value={form.editing_cost} onChange={e=>setF('editing_cost',e.target.value)}/></div>
              <div><Label>Other Costs</Label><Input type="number" value={form.other_costs} onChange={e=>setF('other_costs',e.target.value)}/></div>
            </div>
          </div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e=>setF('notes',e.target.value)}/></div>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Button variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Button><Button onClick={save}>Save Shoot</Button></div>
      </Modal>
    </div>
  )
}
