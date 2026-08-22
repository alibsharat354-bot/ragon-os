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
import { Plus, Video, TrendingUp } from 'lucide-react'
import type { UGCShoot, Client } from '@/types'

const STATUSES = ['Planned', 'Shooting', 'Editing', 'Delivered', 'Completed']

export default function UGCPage() {
  const [shoots, setShoots] = useState<(UGCShoot & { clients?: { name: string } | null })[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<UGCShoot | null>(null)
  const [form, setForm] = useState<Record<string, string>>({
    videos_planned: '0', videos_shot: '0', videos_edited: '0',
    revenue: '0', studio_cost: '0', model_cost: '0', editing_cost: '0', other_costs: '0',
    status: 'Planned', studio: '', models: '', notes: '', client_id: '', shoot_date: '', delivery_deadline: ''
  })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('ugc_shoots').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name'),
    ])
    setShoots(s || [])
    setClients((c || []) as Client[])
  }, [])

  useEffect(() => { load() }, [load])

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function openNew() {
    setEditing(null)
    setForm({ videos_planned: '0', videos_shot: '0', videos_edited: '0', revenue: '0', studio_cost: '0', model_cost: '0', editing_cost: '0', other_costs: '0', status: 'Planned', studio: '', models: '', notes: '', client_id: '', shoot_date: '', delivery_deadline: '' })
    setShowModal(true)
  }
  function openEdit(s: UGCShoot) {
    setEditing(s)
    setForm({
      videos_planned: String(s.videos_planned), videos_shot: String(s.videos_shot), videos_edited: String(s.videos_edited),
      revenue: String(s.revenue), studio_cost: String(s.studio_cost), model_cost: String(s.model_cost),
      editing_cost: String(s.editing_cost), other_costs: String(s.other_costs),
      status: s.status, studio: s.studio || '', models: s.models || '', notes: s.notes || '',
      client_id: s.client_id || '', shoot_date: s.shoot_date || '', delivery_deadline: s.delivery_deadline || ''
    })
    setShowModal(true)
  }

  async function save() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const payload = {
      client_id: form.client_id || null, shoot_date: form.shoot_date || null, studio: form.studio || null,
      models: form.models || null, videos_planned: Number(form.videos_planned), videos_shot: Number(form.videos_shot),
      videos_edited: Number(form.videos_edited), delivery_deadline: form.delivery_deadline || null,
      revenue: Number(form.revenue), studio_cost: Number(form.studio_cost), model_cost: Number(form.model_cost),
      editing_cost: Number(form.editing_cost), other_costs: Number(form.other_costs),
      notes: form.notes || null, status: form.status,
    }

    if (editing) {
      await supabase.from('ugc_shoots').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id)
      logActivity('UGC shoot updated', 'ugc', editing.id)
    } else {
      const { data } = await supabase.from('ugc_shoots').insert({ ...payload, user_id: user.id }).select().single()
      if (data) logActivity('UGC shoot created', 'ugc', data.id)
    }
    setShowModal(false)
    setLoading(false)
    load()
  }

  const totalRevenue = shoots.reduce((s, sh) => s + sh.revenue, 0)
  const totalCost = shoots.reduce((s, sh) => s + sh.studio_cost + sh.model_cost + sh.editing_cost + sh.other_costs, 0)
  const totalVideos = shoots.reduce((s, sh) => s + sh.videos_planned, 0)

  return (
    <div>
      <Header title="UGC / Shoots" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="grid grid-cols-4 gap-3 flex-1 mr-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">Total Shoots</p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{shoots.length}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">Videos Planned</p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{totalVideos}</p>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs text-emerald-400">Revenue</p>
              <p className="text-xl font-bold text-emerald-300 mt-0.5">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                <p className="text-xs text-indigo-400">Profit</p>
              </div>
              <p className="text-xl font-bold text-indigo-300 mt-0.5">{formatCurrency(totalRevenue - totalCost)}</p>
            </div>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4" />Add Shoot</Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {shoots.length === 0 ? (
            <div className="col-span-2 rounded-lg border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-600">No UGC shoots yet</div>
          ) : shoots.map(s => {
            const cost = s.studio_cost + s.model_cost + s.editing_cost + s.other_costs
            const profit = s.revenue - cost
            const margin = s.revenue > 0 ? ((profit / s.revenue) * 100).toFixed(0) : '0'
            const progress = s.videos_planned > 0 ? Math.round((s.videos_edited / s.videos_planned) * 100) : 0

            return (
              <div key={s.id} className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 transition-colors cursor-pointer" onClick={() => openEdit(s)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-indigo-500/10 p-2">
                      <Video className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{s.clients?.name || 'No client'}</p>
                      <p className="text-xs text-slate-500">{s.studio || 'No studio'} • {formatDate(s.shoot_date)}</p>
                    </div>
                  </div>
                  <Badge status={s.status}>{s.status}</Badge>
                </div>

                {/* Video progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-500">Video Progress</p>
                    <p className="text-xs text-slate-400">{s.videos_edited}/{s.videos_planned} edited</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex gap-3 mt-1.5 text-xs text-slate-600">
                    <span>Planned: {s.videos_planned}</span>
                    <span>Shot: {s.videos_shot}</span>
                    <span>Edited: {s.videos_edited}</span>
                  </div>
                </div>

                {/* Financials */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800">
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase">Revenue</p>
                    <p className="text-sm font-semibold text-emerald-400">{formatCurrency(s.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase">Cost</p>
                    <p className="text-sm font-semibold text-red-400">{formatCurrency(cost)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase">Profit</p>
                    <p className={`text-sm font-semibold ${profit >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>{formatCurrency(profit)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase">Margin</p>
                    <p className="text-sm font-semibold text-slate-300">{margin}%</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit UGC Shoot' : 'Add UGC Shoot'} size="xl">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Client</Label>
            <Select value={form.client_id||''} onChange={e=>setF('client_id',e.target.value)}>
              <option value="">No client</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div><Label>Status</Label>
            <Select value={form.status||'Planned'} onChange={e=>setF('status',e.target.value)}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </Select>
          </div>
          <div><Label>Studio</Label><Input value={form.studio||''} onChange={e=>setF('studio',e.target.value)} /></div>
          <div><Label>Models</Label><Input value={form.models||''} onChange={e=>setF('models',e.target.value)} placeholder="Names or count" /></div>
          <div><Label>Shoot Date</Label><Input type="date" value={form.shoot_date||''} onChange={e=>setF('shoot_date',e.target.value)} /></div>
          <div><Label>Delivery Deadline</Label><Input type="date" value={form.delivery_deadline||''} onChange={e=>setF('delivery_deadline',e.target.value)} /></div>

          <div className="col-span-2 border-t border-slate-800 pt-3">
            <p className="text-xs font-medium text-slate-400 mb-2">Video Progress</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Videos Planned</Label><Input type="number" value={form.videos_planned||'0'} onChange={e=>setF('videos_planned',e.target.value)} /></div>
              <div><Label>Videos Shot</Label><Input type="number" value={form.videos_shot||'0'} onChange={e=>setF('videos_shot',e.target.value)} /></div>
              <div><Label>Videos Edited</Label><Input type="number" value={form.videos_edited||'0'} onChange={e=>setF('videos_edited',e.target.value)} /></div>
            </div>
          </div>

          <div className="col-span-2 border-t border-slate-800 pt-3">
            <p className="text-xs font-medium text-slate-400 mb-2">Financials</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Revenue ($)</Label><Input type="number" value={form.revenue||'0'} onChange={e=>setF('revenue',e.target.value)} /></div>
              <div><Label>Studio Cost ($)</Label><Input type="number" value={form.studio_cost||'0'} onChange={e=>setF('studio_cost',e.target.value)} /></div>
              <div><Label>Model Cost ($)</Label><Input type="number" value={form.model_cost||'0'} onChange={e=>setF('model_cost',e.target.value)} /></div>
              <div><Label>Editing Cost ($)</Label><Input type="number" value={form.editing_cost||'0'} onChange={e=>setF('editing_cost',e.target.value)} /></div>
              <div><Label>Other Costs ($)</Label><Input type="number" value={form.other_costs||'0'} onChange={e=>setF('other_costs',e.target.value)} /></div>
            </div>
          </div>

          <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes||''} onChange={e=>setF('notes',e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={save} loading={loading}>Save Shoot</Button>
        </div>
      </Modal>
    </div>
  )
}
