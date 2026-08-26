'use client'
import { useEffect, useState } from 'react'
import { getAll, update, logActivity } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

const STAGES = ['Qualified','Contacted','Replied','Interested','Call','Proposal','Negotiation']

export default function PipelinePage() {
  const [leads, setLeads] = useState<any[]>([])
  function load() { setLeads(getAll('leads')) }
  useEffect(()=>{ load(); window.addEventListener('ragon-data-update',load); return ()=>window.removeEventListener('ragon-data-update',load) },[])

  function move(id:string, status:string) {
    update('leads',id,{status}); logActivity(`Lead moved to ${status}`,'lead')
    load(); window.dispatchEvent(new Event('ragon-data-update'))
  }

  const pipelineLeads = leads.filter(l=>STAGES.includes(l.status))
  const totalValue = pipelineLeads.reduce((s:number,l:any)=>s+Number(l.potential_value||0),0)
  const wonLeads = leads.filter(l=>l.status==='Won')

  return (
    <div>
      <Header title="Sales Pipeline"/>
      <div className="p-5">
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3"><p className="text-xs text-indigo-400">Pipeline Value</p><p className="text-xl font-bold text-indigo-300 mt-0.5">{formatCurrency(totalValue)}</p></div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3"><p className="text-xs text-slate-500">Active Deals</p><p className="text-xl font-bold text-slate-100 mt-0.5">{pipelineLeads.length}</p></div>
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3"><p className="text-xs text-violet-400">In Proposal</p><p className="text-xl font-bold text-violet-300 mt-0.5">{leads.filter(l=>l.status==='Proposal').length}</p></div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"><p className="text-xs text-emerald-400">Won</p><p className="text-xl font-bold text-emerald-300 mt-0.5">{wonLeads.length}</p></div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3">
          {STAGES.map(stage=>{
            const cols = leads.filter(l=>l.status===stage)
            const stageValue = cols.reduce((s:number,l:any)=>s+Number(l.potential_value||0),0)
            const idx = STAGES.indexOf(stage)
            return (
              <div key={stage} className="flex-shrink-0 w-52">
                <div className="flex items-center justify-between mb-2 px-1">
                  <Badge status={stage}>{stage}</Badge>
                  <div className="text-right"><p className="text-xs text-slate-500">{cols.length}</p>{stageValue>0&&<p className="text-xs text-indigo-400">{formatCurrency(stageValue)}</p>}</div>
                </div>
                <div className="space-y-2 min-h-[160px]">
                  {cols.map(l=>(
                    <div key={l.id} className="rounded-lg border border-slate-700 bg-slate-900 p-3 hover:border-slate-600 transition-colors">
                      <p className="text-sm font-semibold text-slate-200 truncate">{l.name}</p>
                      {l.company&&<p className="text-xs text-slate-500 truncate mb-1">{l.company}</p>}
                      {l.potential_value>0&&<p className="text-xs font-medium text-indigo-400 mt-1">{formatCurrency(l.potential_value)}</p>}
                      <div className="flex gap-1 mt-2 pt-2 border-t border-slate-800">
                        {stage!=='Negotiation'&&<button onClick={()=>move(l.id,STAGES[idx+1])} className="flex-1 text-[10px] text-indigo-500 hover:text-indigo-400 font-medium">→ {STAGES[idx+1]}</button>}
                        {stage==='Negotiation'&&<>
                          <button onClick={()=>move(l.id,'Won')} className="flex-1 text-[10px] text-emerald-500 hover:text-emerald-400 font-medium">✓ Won</button>
                          <button onClick={()=>move(l.id,'Lost')} className="flex-1 text-[10px] text-red-500 hover:text-red-400 font-medium">✗ Lost</button>
                        </>}
                      </div>
                    </div>
                  ))}
                  {cols.length===0&&<div className="rounded-lg border border-dashed border-slate-800 p-4 text-center"><p className="text-xs text-slate-700">Empty</p></div>}
                </div>
              </div>
            )
          })}
          <div className="flex-shrink-0 w-52">
            <div className="flex items-center justify-between mb-2 px-1"><Badge status="Won">Won</Badge><p className="text-xs text-slate-500">{wonLeads.length}</p></div>
            <div className="space-y-2">
              {wonLeads.slice(0,5).map(l=>(
                <div key={l.id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-sm font-semibold text-slate-200 truncate">{l.name}</p>
                  {l.potential_value>0&&<p className="text-xs text-emerald-400 mt-1">{formatCurrency(l.potential_value)}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
