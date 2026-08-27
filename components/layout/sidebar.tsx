'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare, Target,
  Send, TrendingUp, DollarSign, FileText, Video, Star,
  BarChart2, Activity, Settings, Zap, Sparkles
} from 'lucide-react'

const nav = [
  { label: 'WORKSPACE', items: [
    { href: '/command-center', label: 'Command Center', icon: LayoutDashboard },
    { href: '/assistant', label: 'AI Assistant', icon: Sparkles, highlight: true },
  ]},
  { label: 'BUSINESS', items: [
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  ]},
  { label: 'GROWTH', items: [
    { href: '/leads', label: 'Leads', icon: Target },
    { href: '/outreach', label: 'Outreach', icon: Send },
    { href: '/pipeline', label: 'Sales Pipeline', icon: TrendingUp },
  ]},
  { label: 'FINANCE', items: [
    { href: '/money', label: 'Money', icon: DollarSign },
    { href: '/invoices', label: 'Invoices', icon: FileText },
  ]},
  { label: 'PRODUCTION', items: [
    { href: '/ugc', label: 'UGC / Shoots', icon: Video },
    { href: '/fiverr', label: 'Fiverr / Upwork', icon: Star },
  ]},
  { label: 'INSIGHTS', items: [
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/activity', label: 'Activity Log', icon: Activity },
  ]},
  { label: 'SYSTEM', items: [
    { href: '/settings', label: 'Settings', icon: Settings },
  ]},
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 border-r border-slate-800 bg-slate-950 flex flex-col z-40">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-100 leading-none">Ragon OS</p>
          <p className="text-xs text-slate-500 leading-none mt-0.5">Ragon Solutions</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {nav.map((section) => (
          <div key={section.label}>
            <p className="px-2 mb-1 text-[10px] font-semibold text-slate-600 tracking-widest">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item: any) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                      active ? 'bg-indigo-600/10 text-indigo-400 font-medium'
                        : item.highlight ? 'text-indigo-400 hover:bg-indigo-600/10'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                    {item.highlight && !active && (
                      <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20">AI</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
