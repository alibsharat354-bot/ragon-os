import { Sidebar } from '@/components/layout/sidebar'

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-56 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
