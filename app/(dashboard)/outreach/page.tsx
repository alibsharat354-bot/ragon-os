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
import { Plus, Send, Bell } from 'lucide-react'

interface OutreachRecord {
  id: string
  lead_id: string
  campaign_id: string | null
  first_contact: string | null
  last_contact: string | null
  next_followup: string | null
  attempts: number
  status: string
  notes: string | null
  created_at: string
  leads?: { name: string; company: string | null; email: string | null }
}

interface Campaign {
  id: string
  name: string
  status: string
}

interface Lead {
  id: string
  name: string
  company: string | null
}

export default function OutreachPage() {
  const [records, setRecords] = useState<OutreachRecord[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [campaignForm, setCampaignForm] = useState({ name: '', description: '', status: 'Active' })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: r }, { data: c }, { data: l }] = await Promise.all([
      supabase.from('outreach').select('*, leads(name, company, email)').order('created_at', { ascending: false }),
      supabase.from('outreach_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('id, name, company').not('status', 'in', '("Won","Lost")'),
    ])
    setRecords(r || [])
    setCampaigns(c || [])
    setLeads(l || [])
  }, [])

  useEffect(() => { load() }, [load])

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function saveOutreach() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !form.lead_id) { setLoading(false); return }

    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('outreach').insert({
      user_id: user.id,
      lead_id: form.lead_id,
      campaign_id: form.campaign_id || null,
      first_contact: today,
      last_contact: today,
      next_followup: form.next_followup || null,
      status: form.status || 'Sent',
      notes: form.notes || null,
      attempts: 1,
    }).select().single()
    if (data) logActivity('Outreach logged', 'outreach', data.id)
    setShowModal(false)
    setForm({})
    setLoading(false)
    load()
  }

  async function saveCampaign() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    await supabase.from('outreach_campaigns').insert({ ...campaignForm, user_id: user.id })
    setShowCampaignModal(false)
    setCampaignForm({ name: '', description: '', status: 'Active' })
    setLoading(false)
    load()
  }

  const today = new Date().toISOString().split('T')[0]
  const followUpsDue = records.filter(r => r.next_followup && r.next_followup <= today)

  // Campaign stats
  const campaignStats = campaigns.map(c => {
    const outreachForCampaign = records.filter(r => r.campaign_id === c.id)
    return { ...c, count: outreachForCampaign.length }
  })

  return (
    <div>
      <Header title="Outreach" />
      <div className="p-5 space-y-5">
        {/* Follow-ups due */}
        {followUpsDue.length > 0 && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-yellow-400" />
              <p className="text-sm font-semibold text-yellow-400">{followUpsDue.length} Follow-up{followUpsDue.length > 1 ? 's' : ''} Due</p>
            </div>
            <div className="space-y-2">
              {followUpsDue.map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-md bg-slate-900 px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-200">{r.leads?.name}</p>
                    {r.leads?.company && <p className="text-xs text-slate-500">{r.leads.company}</p>}
                  </div>
                  <span className="text-xs text-yellow-400">{formatDate(r.next_followup)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campaigns */}
        <div className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <p className="text-sm font-semibold text-slate-200">Campaigns</p>
            <Button size="sm" variant="secondary" onClick={() => setShowCampaignModal(true)}>
              <Plus className="h-3.5 w-3.5" />New Campaign
            </Button>
          </div>
          {campaigns.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-600">No campaigns yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 p-4">
              {campaignStats.map(c => (
                <div key={c.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-slate-200">{c.name}</p>
                    <Badge status={c.status}>{c.status}</Badge>
                  </div>
                  <p className="text-2xl font-bold text-indigo-400">{c.count}</p>
                  <p className="text-xs text-slate-500">outreach records</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outreach log */}
        <div className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-200">Outreach Log</p>
            </div>
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="h-3.5 w-3.5" />Log Outreach
            </Button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Lead</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Campaign</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Attempts</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Last Contact</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Next Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {records.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-600">No outreach logged yet</td></tr>
              ) : records.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-200">{r.leads?.name}</p>
                    {r.leads?.company && <p className="text-xs text-slate-500">{r.leads.company}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{campaigns.find(c => c.id === r.campaign_id)?.name || '—'}</td>
                  <td className="px-4 py-3"><Badge>{r.status}</Badge></td>
                  <td className="px-4 py-3 text-sm text-slate-400">{r.attempts}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatDate(r.last_contact)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${r.next_followup && r.next_followup <= today ? 'text-yellow-400 font-medium' : 'text-slate-500'}`}>
                      {formatDate(r.next_followup)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Outreach">
        <div className="space-y-3">
          <div><Label>Lead *</Label>
            <Select value={form.lead_id||''} onChange={e=>setF('lead_id',e.target.value)}>
              <option value="">Select lead...</option>
              {leads.map(l=><option key={l.id} value={l.id}>{l.name}{l.company ? ` (${l.company})` : ''}</option>)}
            </Select>
          </div>
          <div><Label>Campaign</Label>
            <Select value={form.campaign_id||''} onChange={e=>setF('campaign_id',e.target.value)}>
              <option value="">No campaign</option>
              {campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div><Label>Status</Label>
            <Select value={form.status||'Sent'} onChange={e=>setF('status',e.target.value)}>
              {['Sent','Replied','Positive','No Reply','Bounced'].map(s=><option key={s}>{s}</option>)}
            </Select>
          </div>
          <div><Label>Next Follow-up</Label><Input type="date" value={form.next_followup||''} onChange={e=>setF('next_followup',e.target.value)} /></div>
          <div><Label>Notes</Label><Textarea rows={2} value={form.notes||''} onChange={e=>setF('notes',e.target.value)} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={saveOutreach} loading={loading}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showCampaignModal} onClose={() => setShowCampaignModal(false)} title="New Campaign">
        <div className="space-y-3">
          <div><Label>Campaign Name *</Label><Input value={campaignForm.name} onChange={e=>setCampaignForm(f=>({...f,name:e.target.value}))} placeholder="US Creators — August" /></div>
          <div><Label>Description</Label><Textarea rows={2} value={campaignForm.description} onChange={e=>setCampaignForm(f=>({...f,description:e.target.value}))} /></div>
          <div><Label>Status</Label>
            <Select value={campaignForm.status} onChange={e=>setCampaignForm(f=>({...f,status:e.target.value}))}>
              {['Active','Paused','Completed'].map(s=><option key={s}>{s}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCampaignModal(false)}>Cancel</Button>
            <Button onClick={saveCampaign} loading={loading}>Create Campaign</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
