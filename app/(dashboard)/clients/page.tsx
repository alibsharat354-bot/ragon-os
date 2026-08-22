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
import { Plus, Search, Users, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import type { Client, ClientStatus } from '@/types'

const STATUSES: ClientStatus[] = ['Lead', 'Prospect', 'Active', 'Paused', 'Completed', 'Lost']

const EMPTY: Partial<Client> = { name: '', company: '', email: '', phone: '', website: '', country: '', service: '', status: 'Active', monthly_value: 0, project_value: 0, notes: '' }

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<Partial<Client>>(EMPTY)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
  }, [])

  useEffect(() => { load() }, [load])

  function set(k: string, v: string | number) { setForm(f => ({ ...f, [k]: v })) }

  function openNew() { setEditing(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(c: Client) { setEditing(c); setForm(c); setShowModal(true) }

  async function save() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    if (editing) {
      await supabase.from('clients').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
      logActivity('Client updated', 'client', editing.id, form.name)
    } else {
      const { data } = await supabase.from('clients').insert({ ...form, user_id: user.id }).select().single()
      if (data) logActivity('Client created', 'client', data.id, data.name)
    }
    setShowModal(false)
    setLoading(false)
    load()
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete ${name}?`)) return
    const supabase = createClient()
    await supabase.from('clients').delete().eq('id', id)
    logActivity('Client deleted', 'client', id, name)
    load()
  }

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.company || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || c.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      <Header title="Clients" />
      <div className="p-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <Input className="pl-8" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select className="w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </Select>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {['Active', 'Lead', 'Paused', 'Completed'].map(s => (
            <div key={s} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">{s}</p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{clients.filter(c => c.status === s).length}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Client</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Service</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Monthly</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Start Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Country</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">
                  {search || statusFilter ? 'No clients match your filters' : 'No clients yet — add your first client'}
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-indigo-400">{c.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{c.name}</p>
                        {c.company && <p className="text-xs text-slate-500">{c.company}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{c.service || '—'}</td>
                  <td className="px-4 py-3"><Badge status={c.status}>{c.status}</Badge></td>
                  <td className="px-4 py-3 text-sm text-slate-300">{c.monthly_value ? formatCurrency(c.monthly_value) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatDate(c.start_date)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{c.country || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {c.website && (
                        <a href={c.website} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove(c.id, c.name)} className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Client' : 'Add Client'} size="lg">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Name *</Label><Input value={form.name||''} onChange={e=>set('name',e.target.value)} /></div>
          <div><Label>Company</Label><Input value={form.company||''} onChange={e=>set('company',e.target.value)} /></div>
          <div><Label>Email</Label><Input value={form.email||''} onChange={e=>set('email',e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={form.phone||''} onChange={e=>set('phone',e.target.value)} /></div>
          <div><Label>Country</Label><Input value={form.country||''} onChange={e=>set('country',e.target.value)} /></div>
          <div><Label>Website</Label><Input value={form.website||''} onChange={e=>set('website',e.target.value)} /></div>
          <div><Label>Service</Label><Input value={form.service||''} onChange={e=>set('service',e.target.value)} placeholder="Video Editing, UGC..." /></div>
          <div><Label>Status</Label>
            <Select value={form.status||'Active'} onChange={e=>set('status',e.target.value)}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </Select>
          </div>
          <div><Label>Start Date</Label><Input type="date" value={form.start_date||''} onChange={e=>set('start_date',e.target.value)} /></div>
          <div><Label>Monthly Value ($)</Label><Input type="number" value={form.monthly_value||''} onChange={e=>set('monthly_value',Number(e.target.value))} /></div>
          <div><Label>Project Value ($)</Label><Input type="number" value={form.project_value||''} onChange={e=>set('project_value',Number(e.target.value))} /></div>
          <div><Label>Instagram</Label><Input value={form.instagram||''} onChange={e=>set('instagram',e.target.value)} /></div>
          <div><Label>YouTube</Label><Input value={form.youtube||''} onChange={e=>set('youtube',e.target.value)} /></div>
          <div><Label>LinkedIn</Label><Input value={form.linkedin||''} onChange={e=>set('linkedin',e.target.value)} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes||''} onChange={e=>set('notes',e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={save} loading={loading}>Save Client</Button>
        </div>
      </Modal>
    </div>
  )
}
