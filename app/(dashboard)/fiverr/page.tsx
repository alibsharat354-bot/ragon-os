'use client'
import { useEffect, useState } from 'react'
import { getAll, insert, update, remove, saveSettings, getSettings, logActivity } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Label, Select } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { Plus, Star, Briefcase, Trash2, Info } from 'lucide-react'

export default function FiverrPage() {
  const [gigs, setGigs] = useState<any[]>([])
  const [upwork, setUpwork] = useState({ proposals_sent:0, replies:0, interviews:0, hires:0 })
  const [showGig, setShowGig] = useState(false)
  const [showUpwork, setShowUpwork] = useState(false)
  const [gForm, setGForm] = useState({ title:'', category:'', status:'Active', orders_completed:'0', rating:'' })
  const [uForm, setUForm] = useState({ proposals_sent:'0', replies:'0', interviews:'0', hires:'0' })

  // Revenue comes FROM payments recorded in Money — single source of truth
  const [fiverrRevenue, setFiverrRevenue] = useState(0)
  const [upworkRevenue, setUpworkRevenue] = useState(0)

  function load() {
    setGigs(getAll('fiverr_gigs'))
    const s = getSettings()
    const u = { proposals_sent:Number(s.upwork_proposals||0), replies:Number(s.upwork_replies||0), interviews:Number(s.upwork_interviews||0), hires:Number(s.upwork_hires||0) }
    setUpwork(u)
    setUForm({ proposals_sent:String(u.proposals_sent), replies:String(u.replies), interviews:String(u.interviews), hires:String(u.hires) })
    // Pull revenue from actual payments — this keeps Fiverr and Money in sync
    const payments = getAll<any>('payments')
    setFiverrRevenue(payments.filter(p=>p.category==='Fiverr').reduce((s:number,p:any)=>s+Number(p.amount),0))
    setUpworkRevenue(payments.filter(p=>p.category==='Upwork').reduce((s:number,p:any)=>s+Number(p.amount),0))
  }

  useEffect(()=>{ load(); window.addEventListener('ragon-data-update',load); return ()=>window.removeEventListener('ragon-data-update',load) },[])

  function saveGig() {
    insert('fiverr_gigs',{ title:gForm.title, category:gForm.category||null, status:gForm.status, orders_completed:Number(gForm.orders_completed), rating:gForm.rating?Number(gForm.rating):null })
    logActivity('Fiverr gig added','fiverr',gForm.title)
    setShowGig(false); setGForm({ title:'', category:'', status:'Active', orders_completed:'0', rating:'' }); load()
  }

  function saveUpwork() {
    saveSettings({ upwork_proposals:Number(uForm.proposals_sent), upwork_replies:Number(uForm.replies), upwork_interviews:Number(uForm.interviews), upwork_hires:Number(uForm.hires) })
    setShowUpwork(false); load()
  }

  function deleteGig(id:string, title:string) {
    if (!confirm(`Delete gig "${title}"?`)) return
    remove('fiverr_gigs', id); load()
  }

  function updateGigStatus(id:string, status:string) { update('fiverr_gigs',id,{status}); load() }

  const fiverrOrders = gigs.reduce((s:number,g:any)=>s+Number(g.orders_completed||0),0)
  const replyRate = upwork.proposals_sent>0?((upwork.replies/upwork.proposals_sent)*100).toFixed(1):'0'
  const convRate = upwork.proposals_sent>0?((upwork.hires/upwork.proposals_sent)*100).toFixed(1):'0'

  return (
    <div>
      <Header title="Fiverr / Upwork"/>
      <div className="p-5 space-y-5">
        {/* Sync notice */}
        <div className="flex items-start gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
          <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-indigo-300">Revenue here is pulled from <strong>Money → Income</strong> automatically. To record Fiverr or Upwork income, go to Money and select the matching category.</p>
        </div>

        {/* Fiverr */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Star className="h-5 w-5 text-green-400"/><h2 className="text-base font-semibold text-slate-200">Fiverr</h2></div>
            <Button size="sm" onClick={()=>setShowGig(true)}><Plus className="h-3.5 w-3.5"/>Add Gig</Button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs text-emerald-400">Revenue (from Money)</p>
              <p className="text-xl font-bold text-emerald-300 mt-0.5">{formatCurrency(fiverrRevenue)}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Category "Fiverr" payments</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3"><p className="text-xs text-slate-500">Orders Completed</p><p className="text-xl font-bold text-slate-100 mt-0.5">{fiverrOrders}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3"><p className="text-xs text-slate-500">Active Gigs</p><p className="text-xl font-bold text-slate-100 mt-0.5">{gigs.filter(g=>g.status==='Active').length}</p></div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-slate-800">{['Gig','Category','Status','Orders','Rating',''].map(h=><th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-800">
                {gigs.length===0
                  ? <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-600">No Fiverr gigs yet</td></tr>
                  : gigs.map(g=>(
                  <tr key={g.id} className="hover:bg-slate-800/40 group">
                    <td className="px-4 py-3 text-sm font-medium text-slate-200">{g.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{g.category||'—'}</td>
                    <td className="px-4 py-3"><Badge status={g.status}>{g.status}</Badge></td>
                    <td className="px-4 py-3 text-sm text-slate-300">{g.orders_completed}</td>
                    <td className="px-4 py-3">{g.rating?<div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400"/><span className="text-sm text-yellow-400">{g.rating}</span></div>:'—'}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2">
                      <Select className="!w-auto !py-1 text-xs" value={g.status} onChange={e=>updateGigStatus(g.id,e.target.value)}>{['Active','Paused','Deleted'].map(s=><option key={s}>{s}</option>)}</Select>
                      <button onClick={()=>deleteGig(g.id,g.title)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700"><Trash2 className="h-3.5 w-3.5"/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upwork */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-green-500"/><h2 className="text-base font-semibold text-slate-200">Upwork</h2></div>
            <Button size="sm" variant="secondary" onClick={()=>setShowUpwork(true)}>Update Stats</Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-500 mb-1">Proposals Sent</p><p className="text-2xl font-bold text-slate-100">{upwork.proposals_sent}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-500 mb-1">Replies</p><p className="text-2xl font-bold text-slate-100">{upwork.replies}</p><p className="text-xs text-indigo-400">{replyRate}% reply rate</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-500 mb-1">Interviews</p><p className="text-2xl font-bold text-slate-100">{upwork.interviews}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-500 mb-1">Hires</p><p className="text-2xl font-bold text-emerald-400">{upwork.hires}</p><p className="text-xs text-emerald-500">{convRate}% conversion</p></div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs text-emerald-400 mb-1">Revenue (from Money)</p>
              <p className="text-2xl font-bold text-emerald-300">{formatCurrency(upworkRevenue)}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Category "Upwork" payments</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-500 mb-1">Avg per Hire</p><p className="text-2xl font-bold text-slate-100">{upwork.hires>0?formatCurrency(upworkRevenue/upwork.hires):'—'}</p></div>
          </div>
        </div>
      </div>

      <Modal open={showGig} onClose={()=>setShowGig(false)} title="Add Fiverr Gig">
        <div className="space-y-3">
          <div><Label>Gig Title *</Label><Input value={gForm.title} onChange={e=>setGForm(f=>({...f,title:e.target.value}))}/></div>
          <div><Label>Category</Label><Input value={gForm.category} onChange={e=>setGForm(f=>({...f,category:e.target.value}))} placeholder="Video Editing, Logo Design..."/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Orders Completed</Label><Input type="number" value={gForm.orders_completed} onChange={e=>setGForm(f=>({...f,orders_completed:e.target.value}))}/></div>
            <div><Label>Rating (e.g. 4.9)</Label><Input type="number" step="0.1" value={gForm.rating} onChange={e=>setGForm(f=>({...f,rating:e.target.value}))}/></div>
            <div className="col-span-2"><Label>Status</Label><Select value={gForm.status} onChange={e=>setGForm(f=>({...f,status:e.target.value}))}>{['Active','Paused','Deleted'].map(s=><option key={s}>{s}</option>)}</Select></div>
          </div>
          <p className="text-xs text-slate-600">💡 To record Fiverr income, go to Money → Record Income → Category: Fiverr</p>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={()=>setShowGig(false)}>Cancel</Button><Button onClick={saveGig}>Save Gig</Button></div>
        </div>
      </Modal>

      <Modal open={showUpwork} onClose={()=>setShowUpwork(false)} title="Upwork Outreach Stats">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Proposals Sent</Label><Input type="number" value={uForm.proposals_sent} onChange={e=>setUForm(f=>({...f,proposals_sent:e.target.value}))}/></div>
            <div><Label>Replies</Label><Input type="number" value={uForm.replies} onChange={e=>setUForm(f=>({...f,replies:e.target.value}))}/></div>
            <div><Label>Interviews</Label><Input type="number" value={uForm.interviews} onChange={e=>setUForm(f=>({...f,interviews:e.target.value}))}/></div>
            <div><Label>Hires</Label><Input type="number" value={uForm.hires} onChange={e=>setUForm(f=>({...f,hires:e.target.value}))}/></div>
          </div>
          <p className="text-xs text-slate-600">💡 Revenue is pulled automatically from Money (Upwork category).</p>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={()=>setShowUpwork(false)}>Cancel</Button><Button onClick={saveUpwork}>Save Stats</Button></div>
        </div>
      </Modal>
    </div>
  )
}
