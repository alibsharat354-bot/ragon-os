import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: number
  color?: 'indigo' | 'emerald' | 'yellow' | 'red' | 'violet' | 'cyan'
  className?: string
}

const colorMap = {
  indigo: {
    icon: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  emerald: {
    icon: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  yellow: {
    icon: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  red: {
    icon: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  violet: {
    icon: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  cyan: {
    icon: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'indigo', className }: StatCardProps) {
  const colors = colorMap[color]
  return (
    <div className={cn('rounded-lg border border-slate-800 bg-slate-900 p-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-100">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={cn('rounded-lg p-2', colors.bg)}>
          <Icon className={cn('h-4 w-4', colors.icon)} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <span className={cn('text-xs font-medium', trend >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-slate-600">vs last month</span>
        </div>
      )}
    </div>
  )
}
