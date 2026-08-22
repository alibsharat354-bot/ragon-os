'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { logActivity } from '@/lib/activity'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import type { Lead, LeadStatus } from '@/types'

const STATUSES: LeadStatus[] = ['New', 'Qualified', 'Contacted', 'Replied', 'Interested', 'Call', 'Proposal', 'Negotiation', 'Won', 'Lost']

const EMPTY: Partial<Lead> = { name: '', company: '', email: '', niche: '', country: '', source: '', potential_value: 0, status: 'New', notes: '' }

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [form, setForm] = useState<Partial<Lead>>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
  }, [])

  useEffect(() => { load() }, [load])

  function set(k: string, v: string | number) { setForm(f => ({ ...f, [k]: v })) }

  function openNew() { setEditing(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(l: Lead) { setEditing(l); setForm(l); setShowModal(true) }

  async function save() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    if (editing) {
      await supabase.from('leads').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
      logActivity('Lead updated', 'lead', editing.id, form.name)
    } else {
      const { data } = await supabase.from('leads').insert({ ...form, user_id: user.id }).select().single()
      if (data) logActivity('Lead created', 'lead', data.id, data.name)
    }
    setShowModal(false)
    setLoading(false)
    load()
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete lead "${name}"?`)) return
    const supabase = createClient()
    await supabase.from('leads').delete().eq('id', id)
    logActivity('Lead deleted', 'lead', id, name)
    load()
  }

  async function updateStatus(id: string, status: LeadStatus) {
    const supabase = createClient()
    await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    logActivity(`Lead moved to ${status}`, 'lead', id)
    load()
  }

  const filtered = leads.filter(l => {
    const match = !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.company || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || l.status === statusFilter
    return match && matchStatus
  })

  const kanbanCols = STATUSES.filter(s => !['Lost'].includes(s))
  const pipelineLeads = leads.filter(l => !['Won', 'Lost'].includes(l.status))
  const pipelineValue = pipelineLeads.reduce((s, l) => s + l.potential_value, 0)

  return (
    <div>
      <Header title="Leads" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <Input className="pl-8" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select className="w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </Select>
            <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              {(['table', 'kanban'] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)} className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${viewMode === v ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{v}</button>
              ))}
            </div>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4" />Add Lead</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs text-slate-500">Total Leads</p>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{leads.length}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs text-slate-500">In Pipeline</p>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{pipelineLeads.length}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs text-slate-500">Pipeline Value</p>
            <p className="text-xl font-bold text-indigo-400 mt-0.5">{formatCurrency(pipelineValue)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs text-slate-500">Won</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{leads.filter(l => l.status === 'Won').length}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs text-slate-500">Lost</p>
            <p className="text-xl font-bold text-red-400 mt-0.5">{leads.filter(l => l.status === 'Lost').length}</p>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Lead</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Niche</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Source</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Value</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Country</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">No leads found</td></tr>
                ) : filtered.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-200">{l.name}</p>
                      {l.company && <p className="text-xs text-slate-500">{l.company}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{l.niche || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{l.source || '—'}</td>
                    <td className="px-4 py-3">
                      <Select className="!w-auto !py-1 text-xs" value={l.status} onChange={e => updateStatus(l.id, e.target.value as LeadStatus)}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{l.potential_value ? formatCurrency(l.potential_value) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{l.country || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(l)} className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => remove(l.id, l.name)} className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {kanbanCols.map(status => {
              const colLeads = leads.filter(l => l.status === status)
              return (
                <div key={status} className="flex-shrink-0 w-52">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge status={status}>{status}</Badge>
                      <span className="text-xs text-slate-500">{colLeads.length}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {colLeads.map(l => (
                      <div key={l.id} className="rounded-lg border border-slate-700 bg-slate-900 p-3 cursor-pointer hover:border-slate-600 transition-colors">
                        <p className="text-sm font-medium text-slate-200 truncate">{l.name}</p>
                        {l.company && <p className="text-xs text-slate-500 truncate">{l.company}</p>}
                        {l.potential_value > 0 && <p className="text-xs text-indigo-400 mt-1">{formatCurrency(l.potential_value)}</p>}
                        <div className="flex gap-1 mt-2">
                          {STATUSES.filter(s => s !== status && s !== 'Lost').slice(0, 2).map(s => (
                            <button key={s} onClick={() => updateStatus(l.id, s)} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors truncate max-w-[60px]">→ {s}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Lead' : 'Add Lead'} size="lg">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Name *</Label><Input value={form.name||''} onChange={e=>set('name',e.target.value)} /></div>
          <div><Label>Company</Label><Input value={form.company||''} onChange={e=>set('company',e.target.value)} /></div>
          <div><Label>Email</Label><Input value={form.email||''} onChange={e=>set('email',e.target.value)} /></div>
          <div><Label>Niche</Label><Input value={form.niche||''} onChange={e=>set('niche',e.target.value)} placeholder="Fitness, Finance, Beauty..." /></div>
          <div><Label>Country</Label><Input value={form.country||''} onChange={e=>set('country',e.target.value)} /></div>
          <div><Label>Source</Label><Input value={form.source||''} onChange={e=>set('source',e.target.value)} placeholder="Instagram, Email, Referral..." /></div>
          <div><Label>Status</Label>
            <Select value={form.status||'New'} onChange={e=>set('status',e.target.value)}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </Select>
          </div>
          <div><Label>Potential Value ($)</Label><Input type="number" value={form.potential_value||''} onChange={e=>set('potential_value',Number(e.target.value))} /></div>
          <div><Label>Website</Label><Input value={form.website||''} onChange={e=>set('website',e.target.value)} /></div>
          <div><Label>Instagram</Label><Input value={form.instagram||''} onChange={e=>set('instagram',e.target.value)} /></div>
          <div><Label>YouTube</Label><Input value={form.youtube||''} onChange={e=>set('youtube',e.target.value)} /></div>
          <div><Label>LinkedIn</Label><Input value={form.linkedin||''} onChange={e=>set('linkedin',e.target.value)} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes||''} onChange={e=>set('notes',e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={save} loading={loading}>Save Lead</Button>
        </div>
      </Modal>
    </div>
  )
}
