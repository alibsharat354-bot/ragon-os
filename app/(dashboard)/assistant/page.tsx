'use client'
import { useState, useRef, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { insert, logActivity, getAll } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import { Mic, MicOff, Send, Upload, Sparkles, CheckCircle, AlertCircle, Loader2, X, FileText, Bot, User } from 'lucide-react'
import Papa from 'papaparse'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  actions?: Action[]
  timestamp: Date
}

interface Action {
  type: string
  label: string
  data: any
  done?: boolean
}

const SYSTEM_PROMPT = `You are the Ragon OS AI assistant for Raza's business (Ragon Solutions — a content creation agency).

Your job: extract structured business data from what the user tells you (text, voice transcripts, or pasted CSV/spreadsheet data) and return a JSON response.

Always respond with this exact JSON format:
{
  "message": "friendly confirmation message describing what you found and what you'll add",
  "actions": [
    {
      "type": "add_lead | add_client | add_project | add_task | add_payment | add_expense | add_invoice | add_ugc | add_outreach",
      "label": "human-readable label like 'Add lead: John Smith'",
      "data": { ...fields }
    }
  ]
}

Field schemas:
- add_lead: { name, company, email, website, instagram, youtube, niche, country, source, potential_value (number), status ("New"), notes }
- add_client: { name, company, email, service, status ("Active"), monthly_value (number), notes }
- add_project: { name, service, status ("Planning"), priority ("Medium"), revenue (number), cost (number), deadline, notes }
- add_task: { title, priority ("Medium"), status ("Todo"), category ("Admin"), due_date (YYYY-MM-DD), description }
- add_payment: { amount (number), category ("Client Payment"|"Fiverr"|"Upwork"|"UGC"|"Other"), payment_date (YYYY-MM-DD today if not specified), notes }
- add_expense: { amount (number), category ("Studio"|"Models"|"Editors"|"Contractors"|"Software"|"Equipment"|"Ads"|"Other"), description, date (YYYY-MM-DD) }
- add_invoice: { invoice_number, amount (number), status ("Draft"), due_date, currency ("USD") }
- add_ugc: { videos_planned (number), revenue (number), studio_cost (number), model_cost (number), editing_cost (number), status ("Planned"), studio, shoot_date }
- add_outreach: { status ("Sent"), next_followup, notes }

Rules:
- Extract ALL items from the user's message. If they say "50 leads", try to extract each one or note you need the list.
- If they paste CSV data, parse every row.
- For money: "received $500 from client" = add_payment with category "Client Payment"
- For money: "spent $200 on studio" = add_expense with category "Studio"
- Today's date for reference: ${new Date().toISOString().split('T')[0]}
- Be smart: "I got paid $1500 from Ahmed for video editing" → add_payment {amount:1500, notes:"Ahmed - video editing"}
- Always respond ONLY with valid JSON. No markdown, no explanation outside the JSON message field.`

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hey Raza! 👋 I'm your Ragon OS assistant. Tell me what to add — leads, payments, expenses, clients, anything. You can:\n\n• **Type or paste** — \"Add 3 leads: John from fitness niche, Sara from beauty, Mike from finance\"\n• **Paste a CSV/spreadsheet** — just paste the rows directly\n• **Upload a file** — CSV or text files\n• **Describe money** — \"Got $800 from client, spent $150 on software\"\n\nI'll extract everything and add it to your dashboard automatically.",
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [pendingActions, setPendingActions] = useState<Action[]>([])
  const [executingAll, setExecutingAll] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Voice recording
  async function toggleRecording() {
    if (recording) {
      mediaRef.current?.stop()
      setRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await transcribeAndProcess(blob)
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
    } catch {
      alert('Microphone access denied. Please allow microphone access in your browser settings.')
    }
  }

  async function transcribeAndProcess(audioBlob: Blob) {
    setLoading(true)
    addMessage('user', '🎤 [Voice message — transcribing...]')
    try {
      // Use Web Speech API for transcription fallback
      // Since we can't use Whisper directly in browser, we'll use SpeechRecognition
      setLoading(false)
      addMessage('assistant', "Voice recorded! Unfortunately direct audio transcription requires a server. Please use the browser's built-in voice input (microphone icon in your keyboard on mobile, or right-click the text field on desktop) and I'll process the text.")
    } catch {
      setLoading(false)
    }
  }

  // Better: use Web Speech API directly
  function startSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser. Try Chrome or Edge.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onstart = () => setRecording(true)
    recognition.onend = () => setRecording(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev + (prev ? ' ' : '') + transcript)
    }
    recognition.onerror = () => { setRecording(false); alert('Voice recognition failed. Try again.') }
    recognition.start()
  }

  function addMessage(role: 'user' | 'assistant', content: string, actions?: Action[]) {
    const msg: Message = { id: Date.now().toString(), role, content, actions, timestamp: new Date() }
    setMessages(prev => [...prev, msg])
    return msg
  }

  // Handle file upload
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.name.endsWith('.csv') || file.type === 'text/csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const preview = JSON.stringify(results.data.slice(0, 3), null, 2)
          const fullData = JSON.stringify(results.data)
          const userMsg = `I'm uploading a CSV file "${file.name}" with ${results.data.length} rows. Here's the data:\n\n${fullData}`
          processWithAI(userMsg, `📎 Uploaded "${file.name}" — ${results.data.length} rows detected`)
        }
      })
    } else if (file.type === 'text/plain') {
      const text = await file.text()
      processWithAI(text, `📎 Uploaded "${file.name}"`)
    } else {
      // Try to read as text anyway
      try {
        const text = await file.text()
        processWithAI(text, `📎 Uploaded "${file.name}"`)
      } catch {
        alert('Could not read file. Please use CSV or TXT format.')
      }
    }
  }

  async function processWithAI(rawInput: string, displayMsg?: string) {
    if (!rawInput.trim()) return
    setLoading(true)

    const userContent = displayMsg || rawInput
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userContent, timestamp: new Date() }])
    setInput('')

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: rawInput }]
        })
      })

      const data = await response.json()
      const text = data.content?.[0]?.text || ''

      let parsed: { message: string; actions: Action[] }
      try {
        parsed = JSON.parse(text)
      } catch {
        // Try to extract JSON from text
        const match = text.match(/\{[\s\S]*\}/)
        parsed = match ? JSON.parse(match[0]) : { message: text, actions: [] }
      }

      const actions = (parsed.actions || []).map((a: Action) => ({ ...a, done: false }))
      setPendingActions(prev => [...prev, ...actions])

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: parsed.message || 'Done! Here are the items I found:',
        actions,
        timestamp: new Date()
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Could not connect to AI. Check your internet connection and try again.',
        timestamp: new Date()
      }])
    }
    setLoading(false)
  }

  function executeAction(action: Action): boolean {
    try {
      const today = new Date().toISOString().split('T')[0]
      if (action.type === 'add_lead') {
        insert('leads', { ...action.data, status: action.data.status || 'New', potential_value: Number(action.data.potential_value) || 0 })
        logActivity('Lead created', 'lead', action.data.name)
      } else if (action.type === 'add_client') {
        insert('clients', { ...action.data, status: action.data.status || 'Active', monthly_value: Number(action.data.monthly_value) || 0 })
        logActivity('Client created', 'client', action.data.name)
      } else if (action.type === 'add_project') {
        insert('projects', { ...action.data, revenue: Number(action.data.revenue) || 0, cost: Number(action.data.cost) || 0 })
        logActivity('Project created', 'project', action.data.name)
      } else if (action.type === 'add_task') {
        insert('tasks', { ...action.data, status: 'Todo', category: action.data.category || 'Admin' })
        logActivity('Task created', 'task', action.data.title)
      } else if (action.type === 'add_payment') {
        insert('payments', { ...action.data, amount: Number(action.data.amount), payment_date: action.data.payment_date || today })
        logActivity('Payment recorded', 'payment', `${formatCurrency(Number(action.data.amount))}`)
      } else if (action.type === 'add_expense') {
        insert('expenses', { ...action.data, amount: Number(action.data.amount), date: action.data.date || today })
        logActivity('Expense recorded', 'expense', action.data.description)
      } else if (action.type === 'add_invoice') {
        const num = action.data.invoice_number || `INV-${Date.now().toString().slice(-6)}`
        insert('invoices', { ...action.data, invoice_number: num, amount: Number(action.data.amount), issue_date: today, status: 'Draft' })
        logActivity('Invoice created', 'invoice', num)
      } else if (action.type === 'add_ugc') {
        insert('ugc_shoots', { ...action.data, videos_planned: Number(action.data.videos_planned) || 0, revenue: Number(action.data.revenue) || 0, videos_shot: 0, videos_edited: 0, studio_cost: Number(action.data.studio_cost) || 0, model_cost: Number(action.data.model_cost) || 0, editing_cost: Number(action.data.editing_cost) || 0, other_costs: 0, status: 'Planned' })
        logActivity('UGC shoot created', 'ugc')
      }
      window.dispatchEvent(new Event('ragon-data-update'))
      return true
    } catch {
      return false
    }
  }

  async function executeAllPending() {
    setExecutingAll(true)
    const pending = pendingActions.filter(a => !a.done)
    let count = 0
    for (const action of pending) {
      const ok = executeAction(action)
      if (ok) count++
      await new Promise(r => setTimeout(r, 50))
    }
    setPendingActions(prev => prev.map(a => ({ ...a, done: true })))
    setExecutingAll(false)
    addMessage('assistant', `✅ Done! Added ${count} item${count !== 1 ? 's' : ''} to your dashboard. Go check your pages — everything is there.`)
  }

  function executeSingle(action: Action, idx: number) {
    executeAction(action)
    setPendingActions(prev => prev.map((a, i) => i === idx ? { ...a, done: true } : a))
  }

  const pendingCount = pendingActions.filter(a => !a.done).length

  const actionColors: Record<string, string> = {
    add_lead: 'border-blue-500/30 bg-blue-500/5',
    add_client: 'border-emerald-500/30 bg-emerald-500/5',
    add_payment: 'border-emerald-500/30 bg-emerald-500/5',
    add_expense: 'border-red-500/30 bg-red-500/5',
    add_project: 'border-violet-500/30 bg-violet-500/5',
    add_task: 'border-cyan-500/30 bg-cyan-500/5',
    add_invoice: 'border-yellow-500/30 bg-yellow-500/5',
    add_ugc: 'border-indigo-500/30 bg-indigo-500/5',
  }

  const actionIcons: Record<string, string> = {
    add_lead: '🎯', add_client: '👤', add_payment: '💰', add_expense: '💸',
    add_project: '📁', add_task: '✅', add_invoice: '🧾', add_ugc: '🎬', add_outreach: '📤'
  }

  return (
    <div className="flex flex-col h-screen">
      <Header title="AI Assistant" />

      {/* Pending actions bar */}
      {pendingCount > 0 && (
        <div className="border-b border-indigo-500/20 bg-indigo-500/5 px-5 py-2 flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-indigo-300">
            <span className="font-semibold">{pendingCount} item{pendingCount !== 1 ? 's' : ''}</span> ready to add to your dashboard
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPendingActions([])} className="text-xs text-slate-500 hover:text-slate-300">Dismiss all</button>
            <Button size="sm" onClick={executeAllPending} loading={executingAll}>
              <CheckCircle className="h-3.5 w-3.5" />
              Add All to Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${msg.role === 'assistant' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
              {msg.role === 'assistant' ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-slate-300" />}
            </div>

            <div className={`max-w-2xl space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              {/* Message bubble */}
              <div className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'assistant' ? 'bg-slate-900 border border-slate-800 text-slate-200' : 'bg-indigo-600 text-white'}`}>
                {msg.content}
              </div>

              {/* Action cards */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="space-y-1.5 w-full">
                  {msg.actions.map((action, idx) => {
                    const globalIdx = pendingActions.findIndex(a => a.label === action.label && a.type === action.type)
                    const isDone = pendingActions[globalIdx]?.done || false
                    return (
                      <div key={idx} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${isDone ? 'opacity-40 border-slate-800 bg-slate-900' : actionColors[action.type] || 'border-slate-700 bg-slate-900'}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base flex-shrink-0">{actionIcons[action.type] || '📌'}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-200 truncate">{action.label}</p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {Object.entries(action.data).filter(([k, v]) => v && k !== 'status' && k !== 'notes').slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                            </p>
                          </div>
                        </div>
                        {isDone ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <button onClick={() => executeSingle(action, globalIdx)} className="flex-shrink-0 text-[10px] font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded px-2 py-1 hover:bg-indigo-500/10 transition-colors">
                            Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
              <span className="text-sm text-slate-400">Processing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-800 bg-slate-950 px-5 py-3 flex-shrink-0">
        {/* Quick prompts */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
          {[
            'I received $500 from a client today',
            'Add these leads: [paste names, niches, emails]',
            'I spent $200 on studio rental',
            'Create a task: Follow up with all leads',
            'New client: [name, service, monthly value]',
          ].map(p => (
            <button key={p} onClick={() => setInput(p)} className="flex-shrink-0 text-xs px-2.5 py-1.5 rounded-full border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
              {p.length > 40 ? p.slice(0, 40) + '...' : p}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.trim()) processWithAI(input) } }}
              placeholder="Tell me what to add... or paste CSV data, a list of leads, payment info — anything"
              rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 pr-12 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              style={{ maxHeight: 200 }}
            />
          </div>

          {/* Voice button */}
          <button
            onClick={startSpeechRecognition}
            className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all ${recording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
            title="Voice input"
          >
            {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* File upload */}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-shrink-0 h-10 w-10 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 flex items-center justify-center transition-colors"
            title="Upload CSV or text file"
          >
            <Upload className="h-4 w-4" />
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFile} />

          {/* Send */}
          <button
            onClick={() => { if (input.trim()) processWithAI(input) }}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 h-10 w-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-700 mt-1.5 text-center">Enter to send · Shift+Enter for new line · Upload CSV for bulk import</p>
      </div>
    </div>
  )
}
