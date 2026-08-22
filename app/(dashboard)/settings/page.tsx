'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Settings, Target, User } from 'lucide-react'

interface Profile {
  full_name: string | null
  company_name: string | null
  monthly_revenue_target: number
  monthly_outreach_target: number
  weekly_lead_target: number
  monthly_client_target: number
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ full_name: '', company_name: '', monthly_revenue_target: '10000', monthly_outreach_target: '500', weekly_lead_target: '50', monthly_client_target: '5' })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [email, setEmail] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEmail(user.email || '')
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
      setForm({
        full_name: data.full_name || '',
        company_name: data.company_name || '',
        monthly_revenue_target: String(data.monthly_revenue_target),
        monthly_outreach_target: String(data.monthly_outreach_target),
        weekly_lead_target: String(data.weekly_lead_target),
        monthly_client_target: String(data.monthly_client_target),
      })
    }
  }, [])

  useEffect(() => { load() }, [load])

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: form.full_name || null,
      company_name: form.company_name || null,
      monthly_revenue_target: Number(form.monthly_revenue_target),
      monthly_outreach_target: Number(form.monthly_outreach_target),
      weekly_lead_target: Number(form.weekly_lead_target),
      monthly_client_target: Number(form.monthly_client_target),
      updated_at: new Date().toISOString(),
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
  }

  return (
    <div>
      <Header title="Settings" />
      <div className="p-5 max-w-2xl space-y-5">
        {/* Profile */}
        <div className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
            <User className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-200">Profile</p>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <Label>Email</Label>
              <Input value={email} disabled className="opacity-50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Full Name</Label>
                <Input value={form.full_name} onChange={e => setF('full_name', e.target.value)} placeholder="Raza" />
              </div>
              <div>
                <Label>Company Name</Label>
                <Input value={form.company_name} onChange={e => setF('company_name', e.target.value)} placeholder="Ragon Solutions" />
              </div>
            </div>
          </div>
        </div>

        {/* Targets */}
        <div className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
            <Target className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-200">Monthly Targets</p>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-500 mb-3">These targets show up on your Command Center as progress bars.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Monthly Revenue Target ($)</Label>
                <Input type="number" value={form.monthly_revenue_target} onChange={e => setF('monthly_revenue_target', e.target.value)} placeholder="10000" />
              </div>
              <div>
                <Label>Monthly Outreach Target</Label>
                <Input type="number" value={form.monthly_outreach_target} onChange={e => setF('monthly_outreach_target', e.target.value)} placeholder="500" />
              </div>
              <div>
                <Label>Weekly Lead Target</Label>
                <Input type="number" value={form.weekly_lead_target} onChange={e => setF('weekly_lead_target', e.target.value)} placeholder="50" />
              </div>
              <div>
                <Label>Monthly Client Target</Label>
                <Input type="number" value={form.monthly_client_target} onChange={e => setF('monthly_client_target', e.target.value)} placeholder="5" />
              </div>
            </div>
          </div>
        </div>

        {/* Database info */}
        <div className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
            <Settings className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-200">System</p>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <p className="text-sm text-slate-400">Supabase Connection</p>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <p className="text-sm text-slate-400">Version</p>
              <span className="text-xs text-slate-600">Ragon OS v1.0</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} loading={loading}>
            {saved ? '✓ Saved!' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
