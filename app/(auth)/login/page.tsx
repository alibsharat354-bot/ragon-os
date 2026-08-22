'use client'
import { useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Zap, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const router = useRouter()
  const configured = isSupabaseConfigured()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!configured) {
      setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Vercel environment variables.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError(error.message); setLoading(false); return }
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: 'Raza' } } })
        if (error) { setError(error.message); setLoading(false); return }
      }
      router.push('/command-center')
      router.refresh()
    } catch (err) {
      setError('Connection failed. Check your Supabase configuration.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#020617' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div style={{ display: 'flex', height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: '#4f46e5' }}>
            <Zap style={{ height: 20, width: 20, color: 'white' }} />
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Ragon OS</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Business Operating System</p>
          </div>
        </div>

        {!configured && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle style={{ height: 16, width: 16, color: '#eab308', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#eab308', margin: '0 0 4px 0' }}>Supabase not configured</p>
                <p style={{ fontSize: 11, color: '#a16207', margin: 0 }}>
                  Go to Vercel → your project → Settings → Environment Variables and add:<br />
                  <code style={{ display: 'block', marginTop: 4, color: '#ca8a04' }}>NEXT_PUBLIC_SUPABASE_URL</code>
                  <code style={{ display: 'block', color: '#ca8a04' }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                  Then redeploy.
                </p>
              </div>
            </div>
          </div>
        )}

        <div style={{ borderRadius: 12, border: '1px solid #1e293b', background: '#0f172a', padding: 24 }}>
          <h1 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: '0 0 4px 0' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 20px 0' }}>
            {mode === 'login' ? 'Sign in to your dashboard' : 'Set up your Ragon OS account'}
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 4 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', padding: '8px 12px', fontSize: 14, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' }}
                placeholder="you@example.com"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 4 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', padding: '8px 12px', fontSize: 14, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' }}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#f87171' }}>
                {error}
              </div>
            )}
            <button
              type="submit" disabled={loading}
              style={{ width: '100%', borderRadius: 6, background: loading ? '#3730a3' : '#4f46e5', padding: '10px 16px', fontSize: 14, fontWeight: 500, color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={{ fontSize: 12, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
