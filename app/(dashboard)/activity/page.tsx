'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { formatRelativeDate } from '@/lib/utils'
import {
  UserPlus, Users, FolderPlus, CheckSquare, Send,
  FileText, DollarSign, TrendingDown, Video, Activity,
  Star, Target, Pencil, Trash2
} from 'lucide-react'

interface ActivityItem {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  entity_name: string | null
  created_at: string
}

const entityIcon: Record<string, React.ElementType> = {
  lead: Target,
  client: Users,
  project: FolderPlus,
  task: CheckSquare,
  outreach: Send,
  invoice: FileText,
  payment: DollarSign,
  expense: TrendingDown,
  ugc: Video,
  fiverr: Star,
}

const entityColor: Record<string, string> = {
  lead: 'bg-blue-500/10 text-blue-400',
  client: 'bg-emerald-500/10 text-emerald-400',
  project: 'bg-violet-500/10 text-violet-400',
  task: 'bg-cyan-500/10 text-cyan-400',
  outreach: 'bg-orange-500/10 text-orange-400',
  invoice: 'bg-yellow-500/10 text-yellow-400',
  payment: 'bg-emerald-500/10 text-emerald-400',
  expense: 'bg-red-500/10 text-red-400',
  ugc: 'bg-indigo-500/10 text-indigo-400',
  fiverr: 'bg-green-500/10 text-green-400',
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const query = supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(200)
    const { data } = filter ? await query.eq('entity_type', filter) : await query
    setItems(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const entityTypes = [...new Set(items.map(i => i.entity_type))]

  // Group by date
  const grouped: Record<string, ActivityItem[]> = {}
  items.forEach(item => {
    const date = new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(item)
  })

  return (
    <div>
      <Header title="Activity Log" />
      <div className="p-5">
        {/* Filter */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setFilter('')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!filter ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            All
          </button>
          {entityTypes.map(type => {
            const Icon = entityIcon[type] || Activity
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${filter === type ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
              >
                <Icon className="h-3 w-3" />
                {type}
              </button>
            )
          })}
        </div>

        {loading ? (
          <p className="text-center text-sm text-slate-600 py-10">Loading activity...</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-10 text-center">
            <Activity className="h-8 w-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-600">No activity recorded yet</p>
            <p className="text-xs text-slate-700 mt-1">Activity is recorded automatically as you use Ragon OS</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dayItems]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{date}</p>
                <div className="space-y-1">
                  {dayItems.map(item => {
                    const Icon = entityIcon[item.entity_type] || Activity
                    const color = entityColor[item.entity_type] || 'bg-slate-500/10 text-slate-400'
                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 hover:border-slate-700 transition-colors">
                        <div className={`rounded-md p-1.5 flex-shrink-0 ${color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-300">{item.action}</p>
                          {item.entity_name && (
                            <p className="text-xs text-slate-600 truncate">{item.entity_name}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-600 flex-shrink-0">{formatRelativeDate(item.created_at)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
