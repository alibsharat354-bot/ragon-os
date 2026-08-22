'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { Lead, LeadStatus } from '@/types'

const PIPELINE_STAGES: LeadStatus[] = ['Qualified', 'Contacted', 'Replied', 'Interested', 'Call', 'Proposal', 'Negotiation']

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('leads').select('*').not('status', 'in', '("New","Won","Lost")').order('updated_at', { ascending: false })
    setLeads(data || [])
  }, [])

  useEffect(() => { load() }, [load])

  async function moveStage(id: string, status: LeadStatus) {
    const supabase = createClient()
    await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const totalValue = leads.filter(l => PIPELINE_STAGES.includes(l.status)).reduce((s, l) => s + l.potential_value, 0)
  const wonLeads = leads.filter(l => l.status === 'Won')

  return (
    <div>
      <Header title="Sales Pipeline" />
      <div className="p-5">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs text-slate-500">Pipeline Value</p>
            <p className="text-xl font-bold text-indigo-400 mt-0.5">{formatCurrency(totalValue)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs text-slate-500">Active Deals</p>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{leads.filter(l => PIPELINE_STAGES.includes(l.status)).length}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs text-slate-500">In Proposal</p>
            <p className="text-xl font-bold text-violet-400 mt-0.5">{leads.filter(l => l.status === 'Proposal').length}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs text-slate-500">Won This Session</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{wonLeads.length}</p>
          </div>
        </div>

        {/* Kanban */}
        <div className="flex gap-3 overflow-x-auto pb-3">
          {PIPELINE_STAGES.map(stage => {
            const stageleads = leads.filter(l => l.status === stage)
            const stageValue = stageleads.reduce((s, l) => s + l.potential_value, 0)
            return (
              <div key={stage} className="flex-shrink-0 w-56">
                <div className="flex items-center justify-between mb-2 px-1">
                  <Badge status={stage}>{stage}</Badge>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{stageleads.length} leads</p>
                    {stageValue > 0 && <p className="text-xs text-indigo-400">{formatCurrency(stageValue)}</p>}
                  </div>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {stageleads.map(l => (
                    <div key={l.id} className="rounded-lg border border-slate-700 bg-slate-900 p-3 hover:border-slate-600 transition-colors">
                      <p className="text-sm font-semibold text-slate-200 truncate">{l.name}</p>
                      {l.company && <p className="text-xs text-slate-500 truncate mb-1">{l.company}</p>}
                      {l.niche && <p className="text-xs text-slate-600">{l.niche}</p>}
                      {l.potential_value > 0 && (
                        <p className="text-xs font-medium text-indigo-400 mt-1.5">{formatCurrency(l.potential_value)}</p>
                      )}
                      {/* Move buttons */}
                      <div className="flex gap-1 mt-2 pt-2 border-t border-slate-800">
                        {stage !== 'Negotiation' && (
                          <button
                            onClick={() => moveStage(l.id, PIPELINE_STAGES[PIPELINE_STAGES.indexOf(stage) + 1])}
                            className="flex-1 text-[10px] text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
                          >
                            → {PIPELINE_STAGES[PIPELINE_STAGES.indexOf(stage) + 1]}
                          </button>
                        )}
                        {stage === 'Negotiation' && (
                          <>
                            <button onClick={() => moveStage(l.id, 'Won')} className="flex-1 text-[10px] text-emerald-500 hover:text-emerald-400 font-medium">✓ Won</button>
                            <button onClick={() => moveStage(l.id, 'Lost')} className="flex-1 text-[10px] text-red-500 hover:text-red-400 font-medium">✗ Lost</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {stageleads.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center">
                      <p className="text-xs text-slate-700">No leads</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Won column */}
          <div className="flex-shrink-0 w-56">
            <div className="flex items-center justify-between mb-2 px-1">
              <Badge status="Won">Won</Badge>
              <p className="text-xs text-slate-500">{wonLeads.length} deals</p>
            </div>
            <div className="space-y-2">
              {wonLeads.slice(0, 5).map(l => (
                <div key={l.id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-sm font-semibold text-slate-200 truncate">{l.name}</p>
                  {l.potential_value > 0 && <p className="text-xs text-emerald-400 mt-1">{formatCurrency(l.potential_value)}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
