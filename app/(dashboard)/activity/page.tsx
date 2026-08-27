'use client'
import { useEffect, useState } from 'react'
import { getAll, remove } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { formatRelativeDate } from '@/lib/utils'
import { Activity, Users, FolderPlus, CheckSquare, Send, FileText, DollarSign, TrendingDown, Video, Target, Trash2 } from 'lucide-react'

const icons: Record<string,any> = { lead:Target, client:Users, project:FolderPlus, task:CheckSquare, outreach:Send, invoice:FileText, payment:DollarSign, expense:TrendingDown, ugc:Video }
const colors: Record<string,string> = { lead:'bg-blue-500/10 text-blue-400', client:'bg-emerald-500/10 text-emerald-400', project:'bg-violet-500/10 text-violet-400', task:'bg-cyan-500/10 text-cyan-400', outreach:'bg-orange-500/10 text-orange-400', invoice:'bg-yellow-500/10 text-yellow-400', payment:'bg-emerald-500/10 text-emerald-400', expense:'bg-red-500/10 text-red-400', ugc:'bg-indigo-500/10 text-indigo-400' }

export default function ActivityPage() {
  const [items, setItems] = useState<any[]>([])
  const [filter, setFilter] = useState('')

  function load() { setItems(getAll('activity_log')) }

  function deleteItem(id:string) {
    remove('activity_log', id); load()
  }

  function clearAll() {
    if (!confirm('Clear all activity logs?')) return
    items.forEach(i => remove('activity_log', i.id)); load()
  }
  useEffect(()=>{ load(); window.addEventListener('ragon-data-update',load); return ()=>window.removeEventListener('ragon-data-update',load) },[])

  const filtered = items.filter(i=>!filter||i.entity_type===filter)
  const types = [...new Set(items.map(i=>i.entity_type))]
  const grouped: Record<string,any[]> = {}
  filtered.forEach(item=>{ const d = new Date(item.created_at).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}); if(!grouped[d]) grouped[d]=[]; grouped[d].push(item) })

  return (
    <div>
      <Header title="Activity Log"/>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button onClick={()=>setFilter('')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!filter?'bg-indigo-600 text-white':'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}>All</button>
          {types.map(type=>{ const Icon=icons[type]||Activity; return (
            <button key={type} onClick={()=>setFilter(type)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${filter===type?'bg-indigo-600 text-white':'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}>
              <Icon className="h-3 w-3"/>{type}
            </button>
          )})}
        </div>
        {items.length > 0 && (
          <div className="flex justify-end mb-3">
            <button onClick={clearAll} className="text-xs text-slate-600 hover:text-red-400 transition-colors">Clear all logs</button>
          </div>
        )}
        {items.length===0?(
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-10 text-center"><Activity className="h-8 w-8 text-slate-700 mx-auto mb-2"/><p className="text-sm text-slate-600">No activity yet — it records automatically as you use Ragon OS</p></div>
        ):(
          <div className="space-y-6">
            {Object.entries(grouped).map(([date,dayItems])=>(
              <div key={date}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{date}</p>
                <div className="space-y-1">
                  {dayItems.map(item=>{ const Icon=icons[item.entity_type]||Activity; const color=colors[item.entity_type]||'bg-slate-500/10 text-slate-400'; return (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 hover:border-slate-700 group">
                      <div className={`rounded-md p-1.5 flex-shrink-0 ${color}`}><Icon className="h-3.5 w-3.5"/></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-300">{item.action}</p>{item.entity_name&&<p className="text-xs text-slate-600 truncate">{item.entity_name}</p>}</div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-600">{formatRelativeDate(item.created_at)}</span>
                        <button onClick={()=>deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-700 hover:text-red-400 hover:bg-slate-700 transition-all"><Trash2 className="h-3 w-3"/></button>
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
