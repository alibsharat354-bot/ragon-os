'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Label, Select } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { Plus, Star, Briefcase } from 'lucide-react'

interface FiverrGig { id: string; title: string; category: string | null; status: string; orders_completed: number; revenue: number; rating: number | null }
interface UpworkStats { id: string; proposals_sent: number; replies: number; interviews: number; hires: number; revenue: number }

export default function FiverrPage() {
  const [gigs, setGigs] = useState<FiverrGig[]>([])
  const [upwork, setUpwork] = useState<UpworkStats | null>(null)
  const [showGigModal, setShowGigModal] = useState(false)
  const [showUpworkModal, setShowUpworkModal] = useState(false)
  const [gigForm, setGigForm] = useState({ title: '', category: '', status: 'Active', orders_completed: '0', revenue: '0', rating: '' })
  const [upworkForm, setUpworkForm] = useState({ proposals_sent: '0', replies: '0', interviews: '0', hires: '0', revenue: '0' })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: g }, { data: u }] = await Promise.all([
      supabase.from('fiverr_gigs').select('*').order('created_at', { ascending: false }),
      supabase.from('upwork_stats').select('*').limit(1).single(),
    ])
    setGigs(g || [])
    setUpwork(u)
    if (u) setUpworkForm({ proposals_sent: String(u.proposals_sent), replies: String(u.replies), interviews: String(u.interviews), hires: String(u.hires), revenue: String(u.revenue) })
  }, [])

  useEffect(() => { load() }, [load])

  async function saveGig() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    await supabase.from('fiverr_gigs').insert({
      user_id: user.id, title: gigForm.title, category: gigForm.category || null,
      status: gigForm.status, orders_completed: Number(gigForm.orders_completed),
      revenue: Number(gigForm.revenue), rating: gigForm.rating ? Number(gigForm.rating) : null
    })
    setShowGigModal(false)
    setGigForm({ title: '', category: '', status: 'Active', orders_completed: '0', revenue: '0', rating: '' })
    setLoading(false)
    load()
  }

  async function saveUpwork() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const payload = { proposals_sent: Number(upworkForm.proposals_sent), replies: Number(upworkForm.replies), interviews: Number(upworkForm.interviews), hires: Number(upworkForm.hires), revenue: Number(upworkForm.revenue) }
    if (upwork) {
      await supabase.from('upwork_stats').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', upwork.id)
    } else {
      await supabase.from('upwork_stats').insert({ ...payload, user_id: user.id })
    }
    setShowUpworkModal(false)
    setLoading(false)
    load()
  }

  async function updateGigStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('fiverr_gigs').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const fiverrRevenue = gigs.reduce((s, g) => s + g.revenue, 0)
  const fiverrOrders = gigs.reduce((s, g) => s + g.orders_completed, 0)
  const upworkConversion = upwork && upwork.proposals_sent > 0 ? ((upwork.hires / upwork.proposals_sent) * 100).toFixed(1) : '0'
  const upworkReplyRate = upwork && upwork.proposals_sent > 0 ? ((upwork.replies / upwork.proposals_sent) * 100).toFixed(1) : '0'

  return (
    <div>
      <Header title="Fiverr / Upwork" />
      <div className="p-5 space-y-5">
        {/* Fiverr Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-green-400" />
              <h2 className="text-base font-semibold text-slate-200">Fiverr</h2>
            </div>
            <Button size="sm" onClick={() => setShowGigModal(true)}><Plus className="h-3.5 w-3.5" />Add Gig</Button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs text-emerald-400">Total Revenue</p>
              <p className="text-xl font-bold text-emerald-300 mt-0.5">{formatCurrency(fiverrRevenue)}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">Orders Completed</p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{fiverrOrders}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">Active Gigs</p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{gigs.filter(g => g.status === 'Active').length}</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Gig</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Category</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Orders</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Revenue</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Rating</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {gigs.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-600">No Fiverr gigs yet</td></tr>
                ) : gigs.map(g => (
                  <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-200">{g.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{g.category || '—'}</td>
                    <td className="px-4 py-3"><Badge status={g.status}>{g.status}</Badge></td>
                    <td className="px-4 py-3 text-sm text-slate-300">{g.orders_completed}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-400">{formatCurrency(g.revenue)}</td>
                    <td className="px-4 py-3">
                      {g.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-yellow-400">{g.rating}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Select className="!w-auto !py-1 text-xs" value={g.status} onChange={e => updateGigStatus(g.id, e.target.value)}>
                        {['Active', 'Paused', 'Deleted'].map(s => <option key={s}>{s}</option>)}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upwork Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-green-500" />
              <h2 className="text-base font-semibold text-slate-200">Upwork</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setShowUpworkModal(true)}>
              {upwork ? 'Update Stats' : 'Set Up Upwork'}
            </Button>
          </div>

          {upwork ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs text-slate-500 mb-1">Proposals Sent</p>
                <p className="text-2xl font-bold text-slate-100">{upwork.proposals_sent}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs text-slate-500 mb-1">Replies</p>
                <p className="text-2xl font-bold text-slate-100">{upwork.replies}</p>
                <p className="text-xs text-indigo-400">{upworkReplyRate}% reply rate</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs text-slate-500 mb-1">Interviews</p>
                <p className="text-2xl font-bold text-slate-100">{upwork.interviews}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs text-slate-500 mb-1">Hires</p>
                <p className="text-2xl font-bold text-emerald-400">{upwork.hires}</p>
                <p className="text-xs text-emerald-500">{upworkConversion}% conversion</p>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs text-emerald-400 mb-1">Revenue</p>
                <p className="text-2xl font-bold text-emerald-300">{formatCurrency(upwork.revenue)}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs text-slate-500 mb-1">Avg per Hire</p>
                <p className="text-2xl font-bold text-slate-100">{upwork.hires > 0 ? formatCurrency(upwork.revenue / upwork.hires) : '—'}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
              <Briefcase className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-600">No Upwork data yet</p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => setShowUpworkModal(true)}>Set Up Upwork Stats</Button>
            </div>
          )}
        </div>
      </div>

      <Modal open={showGigModal} onClose={() => setShowGigModal(false)} title="Add Fiverr Gig">
        <div className="space-y-3">
          <div><Label>Gig Title *</Label><Input value={gigForm.title} onChange={e=>setGigForm(f=>({...f,title:e.target.value}))} /></div>
          <div><Label>Category</Label><Input value={gigForm.category} onChange={e=>setGigForm(f=>({...f,category:e.target.value}))} placeholder="Video Editing, Logo Design..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Orders Completed</Label><Input type="number" value={gigForm.orders_completed} onChange={e=>setGigForm(f=>({...f,orders_completed:e.target.value}))} /></div>
            <div><Label>Revenue ($)</Label><Input type="number" value={gigForm.revenue} onChange={e=>setGigForm(f=>({...f,revenue:e.target.value}))} /></div>
            <div><Label>Rating (e.g. 4.9)</Label><Input type="number" step="0.1" value={gigForm.rating} onChange={e=>setGigForm(f=>({...f,rating:e.target.value}))} /></div>
            <div><Label>Status</Label>
              <Select value={gigForm.status} onChange={e=>setGigForm(f=>({...f,status:e.target.value}))}>
                {['Active','Paused','Deleted'].map(s=><option key={s}>{s}</option>)}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowGigModal(false)}>Cancel</Button>
            <Button onClick={saveGig} loading={loading}>Save Gig</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showUpworkModal} onClose={() => setShowUpworkModal(false)} title="Upwork Stats">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Proposals Sent</Label><Input type="number" value={upworkForm.proposals_sent} onChange={e=>setUpworkForm(f=>({...f,proposals_sent:e.target.value}))} /></div>
            <div><Label>Replies</Label><Input type="number" value={upworkForm.replies} onChange={e=>setUpworkForm(f=>({...f,replies:e.target.value}))} /></div>
            <div><Label>Interviews</Label><Input type="number" value={upworkForm.interviews} onChange={e=>setUpworkForm(f=>({...f,interviews:e.target.value}))} /></div>
            <div><Label>Hires</Label><Input type="number" value={upworkForm.hires} onChange={e=>setUpworkForm(f=>({...f,hires:e.target.value}))} /></div>
            <div className="col-span-2"><Label>Total Revenue ($)</Label><Input type="number" value={upworkForm.revenue} onChange={e=>setUpworkForm(f=>({...f,revenue:e.target.value}))} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowUpworkModal(false)}>Cancel</Button>
            <Button onClick={saveUpwork} loading={loading}>Save Stats</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
