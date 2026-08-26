'use client'
import { useEffect, useState } from 'react'
import { getAll, insert, logActivity } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { Plus, Send, Bell } from 'lucide-react'

export default function OutreachPage() {
  const [records, setRecords] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showCampaign, setShowCampaign] = useState(false)
  const [form, setForm] = useState<Record<string,string>>({ lead_id:'', campaign_id:'', status:'Sent', next_followup:'', notes:'' })
  const [cForm, setCForm] = useState({ name:'', description:'', status:'Active' })

  function load() {
    setRecords(getAll('outreach'))
    setCampaigns(getAll('outreach_campaigns'))
    setLeads(getAll('leads').filter((l:any)=>!['Won','Lost'].includes(l.status)))
  }
  useEffect(()=>{ load(); window.addEventListener('ragon-data-update',load); return ()=>window.removeEventListener('ragon-data-update',load) },[])

  function setF(k:string,v:string){ setForm(f=>({...f,[k]:v})) }

  function saveOutreach() {
    if (!form.lead_id) return
    const today = new Date().toISOString().split('T')[0]
    insert('outreach',{ lead_id:form.lead_id, campaign_id:form.campaign_id||null, first_contact:today, last_contact:today, next_followup:form.next_followup||null, status:form.status, notes:form.notes||null, attempts:1 })
    logActivity('Outreach logged','outreach')
    setShowModal(false); setForm({ lead_id:'', campaign_id:'', status:'Sent', next_followup:'', notes:'' })
    load(); window.dispatchEvent(new Event('ragon-data-update'))
  }

  function saveCampaign() {
    insert('outreach_campaigns',{ name:cForm.name, description:cForm.description||null, status:cForm.status })
    setShowCampaign(false); setCForm({ name:'', description:'', status:'Active' })
    load()
  }

  const today = new Date().toISOString().split('T')[0]
  const followUpsDue = records.filter(r=>r.next_followup&&r.next_followup<=today)

  return (
    <div>
      <Header title="Outreach"/>
      <div className="p-5 space-y-5">
        {followUpsDue.length>0&&(
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
            <div className="flex items-center gap-2 mb-3"><Bell className="h-4 w-4 text-yellow-400"/><p className="text-sm font-semibold text-yellow-400">{followUpsDue.length} Follow-up{followUpsDue.length>1?'s':''} Due</p></div>
            <div className="space-y-2">
              {followUpsDue.map(r=>{
                const lead = leads.find(l=>l.id===r.lead_id)||getAll<any>('leads').find(l=>l.id===r.lead_id)
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-md bg-slate-900 px-3 py-2">
                    <p className="text-sm text-slate-200">{lead?.name||'Unknown lead'}</p>
                    <span className="text-xs text-yellow-400">{formatDate(r.next_followup)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <p className="text-sm font-semibold text-slate-200">Campaigns</p>
            <Button size="sm" variant="secondary" onClick={()=>setShowCampaign(true)}><Plus className="h-3.5 w-3.5"/>New Campaign</Button>
          </div>
          {campaigns.length===0?<p className="px-4 py-6 text-center text-sm text-slate-600">No campaigns yet</p>
          :<div className="grid grid-cols-3 gap-3 p-4">
            {campaigns.map(c=>{
              const count = records.filter(r=>r.campaign_id===c.id).length
              return (
                <div key={c.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                  <div className="flex items-start justify-between mb-2"><p className="text-sm font-medium text-slate-200">{c.name}</p><Badge status={c.status}>{c.status}</Badge></div>
                  <p className="text-2xl font-bold text-indigo-400">{count}</p>
                  <p className="text-xs text-slate-500">outreach records</p>
                </div>
              )
            })}
          </div>}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2"><Send className="h-4 w-4 text-slate-500"/><p className="text-sm font-semibold text-slate-200">Outreach Log</p></div>
            <Button size="sm" onClick={()=>setShowModal(true)}><Plus className="h-3.5 w-3.5"/>Log Outreach</Button>
          </div>
          <table className="w-full">
            <thead><tr className="border-b border-slate-800">
              {['Lead','Campaign','Status','Attempts','Last Contact','Next Follow-up'].map(h=><th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-800">
              {records.length===0?<tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-600">No outreach logged yet</td></tr>
              :records.map(r=>{
                const lead = getAll<any>('leads').find(l=>l.id===r.lead_id)
                const campaign = campaigns.find(c=>c.id===r.campaign_id)
                return (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3"><p className="text-sm font-medium text-slate-200">{lead?.name||'—'}</p>{lead?.company&&<p className="text-xs text-slate-500">{lead.company}</p>}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{campaign?.name||'—'}</td>
                    <td className="px-4 py-3"><Badge>{r.status}</Badge></td>
                    <td className="px-4 py-3 text-sm text-slate-400">{r.attempts}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(r.last_contact)}</td>
                    <td className="px-4 py-3"><span className={`text-sm ${r.next_followup&&r.next_followup<=today?'text-yellow-400 font-medium':'text-slate-500'}`}>{formatDate(r.next_followup)}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Log Outreach">
        <div className="space-y-3">
          <div><Label>Lead *</Label><Select value={form.lead_id} onChange={e=>setF('lead_id',e.target.value)}><option value="">Select lead...</option>{leads.map(l=><option key={l.id} value={l.id}>{l.name}{l.company?` (${l.company})`:''}</option>)}</Select></div>
          <div><Label>Campaign</Label><Select value={form.campaign_id} onChange={e=>setF('campaign_id',e.target.value)}><option value="">No campaign</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
          <div><Label>Status</Label><Select value={form.status} onChange={e=>setF('status',e.target.value)}>{['Sent','Replied','Positive','No Reply','Bounced'].map(s=><option key={s}>{s}</option>)}</Select></div>
          <div><Label>Next Follow-up</Label><Input type="date" value={form.next_followup} onChange={e=>setF('next_followup',e.target.value)}/></div>
          <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e=>setF('notes',e.target.value)}/></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Button><Button onClick={saveOutreach}>Save</Button></div>
        </div>
      </Modal>

      <Modal open={showCampaign} onClose={()=>setShowCampaign(false)} title="New Campaign">
        <div className="space-y-3">
          <div><Label>Name *</Label><Input value={cForm.name} onChange={e=>setCForm(f=>({...f,name:e.target.value}))} placeholder="US Creators — August"/></div>
          <div><Label>Description</Label><Textarea rows={2} value={cForm.description} onChange={e=>setCForm(f=>({...f,description:e.target.value}))}/></div>
          <div><Label>Status</Label><Select value={cForm.status} onChange={e=>setCForm(f=>({...f,status:e.target.value}))}>{['Active','Paused','Completed'].map(s=><option key={s}>{s}</option>)}</Select></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={()=>setShowCampaign(false)}>Cancel</Button><Button onClick={saveCampaign}>Create</Button></div>
        </div>
      </Modal>
    </div>
  )
}
