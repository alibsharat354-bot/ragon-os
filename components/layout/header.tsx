'use client'
import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuickAddModal } from '@/components/shared/quick-add-modal'

export function Header({ title }: { title: string }) {
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm px-5">
        <h1 className="text-sm font-semibold text-slate-200">{title}</h1>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd className="ml-2 text-[10px] text-slate-600">⌘K</kbd>
          </button>
          <Button size="sm" onClick={() => setShowQuickAdd(true)}>
            <Plus className="h-3.5 w-3.5" />
            Quick Add
          </Button>
        </div>
      </header>
      <QuickAddModal open={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
    </>
  )
}
