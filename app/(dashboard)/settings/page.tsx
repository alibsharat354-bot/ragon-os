'use client'
import { useEffect, useState } from 'react'
import { getSettings, saveSettings } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Target, Zap } from 'lucide-react'

export default function SettingsPage() {
  const [form, setForm] = useState({ monthly_revenue_target:'10000', monthly_outreach_target:'500', weekly_lead_target:'50', monthly_client_target:'5' })
  const [saved, setSaved] = useState(false)

  useEffect(()=>{
    const s = getSettings()
    setForm({
      monthly_revenue_target: String(s.monthly_revenue_target||10000),
      monthly_outreach_target: String(s.monthly_outreach_target||500),
      weekly_lead_target: String(s.weekly_lead_target||50),
      monthly_client_target: String(s.monthly_client_target||5),
    })
  },[])

  function setF(k:string,v:string){ setForm(f=>({...f,[k]:v})) }

  function save() {
    saveSettings({ monthly_revenue_target:Number(form.monthly_revenue_target), monthly_outreach_target:Number(form.monthly_outreach_target), weekly_lead_target:Number(form.weekly_lead_target), monthly_client_target:Number(form.monthly_client_target) })
    setSaved(true); setTimeout(()=>setSaved(false),2000)
    window.dispatchEvent(new Event('ragon-data-update'))
  }

  return (
    <div>
      <Header title="Settings"/>
      <div className="p-5 max-w-xl space-y-5">
        <div className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800"><Target className="h-4 w-4 text-slate-500"/><p className="text-sm font-semibold text-slate-200">Monthly Targets</p></div>
          <div className="p-4">
            <p className="text-xs text-slate-500 mb-3">These show as progress bars on your Command Center.</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Monthly Revenue Target ($)</Label><Input type="number" value={form.monthly_revenue_target} onChange={e=>setF('monthly_revenue_target',e.target.value)}/></div>
              <div><Label>Monthly Outreach Target</Label><Input type="number" value={form.monthly_outreach_target} onChange={e=>setF('monthly_outreach_target',e.target.value)}/></div>
              <div><Label>Weekly Lead Target</Label><Input type="number" value={form.weekly_lead_target} onChange={e=>setF('weekly_lead_target',e.target.value)}/></div>
              <div><Label>Monthly Client Target</Label><Input type="number" value={form.monthly_client_target} onChange={e=>setF('monthly_client_target',e.target.value)}/></div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800"><Zap className="h-4 w-4 text-indigo-400"/><p className="text-sm font-semibold text-slate-200">About Ragon OS</p></div>
          <div className="p-4 space-y-2 text-sm text-slate-500">
            <p>Version 1.0 — localStorage edition</p>
            <p>Data is stored in your browser. It persists between visits on the same device and browser.</p>
            <p className="text-xs text-slate-600 pt-2">To back up your data: open browser DevTools → Application → Local Storage → copy the ragon_ keys.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save}>{saved?'✓ Saved!':'Save Settings'}</Button>
        </div>
      </div>
    </div>
  )
}
