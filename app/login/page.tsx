'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DEMO = [
  { name:'Antoine BARBET',   email:'a.barbet@corp.fr',   pwd:'admin123',   role:'Admin · Valideur · Employé',   bg:'rgba(245,158,11,.18)', color:'#92400e' },
  { name:'Amélie NUSSBAUM',  email:'a.nussbaum@corp.fr', pwd:'valid123',   role:'Valideur · Employée',          bg:'rgba(79,110,247,.18)', color:'#2d46c4' },
  { name:'Damien DRILLET',   email:'d.drillet@corp.fr',  pwd:'valid123',   role:'Valideur · Employé',           bg:'rgba(34,197,94,.18)',  color:'#15803d' },
  { name:'Anaïs JOUET',      email:'a.jouet@corp.fr',    pwd:'employe123', role:'Employée',                     bg:'rgba(100,116,139,.18)',color:'#475569' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) { setError('Email ou mot de passe incorrect.'); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  async function quickLogin(email: string, pwd: string) {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd })
    if (error) { setError('Erreur de connexion. Vérifiez que les comptes sont créés dans Supabase Auth.'); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg,#0f1117 0%,#1a1d27 60%,#0f1117 100%)' }}>
      <div className="w-[400px] rounded-2xl p-10"
           style={{ background:'#1a1d27', border:'1px solid rgba(255,255,255,.08)', boxShadow:'0 24px 80px rgba(0,0,0,.5)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background:'#4f6ef7', boxShadow:'0 4px 14px rgba(79,110,247,.4)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="16" rx="3"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="13" y2="13"/>
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold text-white tracking-tight">NoteFrais</div>
            <div className="text-[10px]" style={{ color:'rgba(255,255,255,.3)' }}>Notes de frais</div>
          </div>
        </div>
        <div className="h-6"/>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-xs" style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.25)', color:'#fca5a5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold block mb-1.5"
                   style={{ color:'rgba(255,255,255,.35)' }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                   placeholder="prenom.nom@entreprise.fr"
                   className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-colors"
                   style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)' }}/>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold block mb-1.5"
                   style={{ color:'rgba(255,255,255,.35)' }}>Mot de passe</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                   placeholder="••••••••"
                   className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-colors"
                   style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)' }}/>
          </div>
          <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
                  style={{ background:'#4f6ef7', boxShadow:'0 4px 14px rgba(79,110,247,.35)', opacity: loading ? .7 : 1 }}>
            {loading ? 'Connexion…' : 'Se connecter →'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,.07)' }}/>
          <span className="text-[10px]" style={{ color:'rgba(255,255,255,.2)' }}>Connexion rapide</span>
          <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,.07)' }}/>
        </div>

        <div className="space-y-2">
          {DEMO.map(d => (
            <button key={d.email} onClick={() => quickLogin(d.email, d.pwd)} disabled={loading}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all"
                    style={{ border:'1px solid rgba(255,255,255,.07)', background:'rgba(255,255,255,.02)' }}
                    onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,.07)')}
                    onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,.02)')}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                   style={{ background: d.bg, color: d.color }}>
                {d.name.split(' ').map(n => n[0]).slice(0,2).join('')}
              </div>
              <div>
                <div className="text-xs font-semibold text-white">{d.name}</div>
                <div className="text-[10px]" style={{ color:'rgba(255,255,255,.3)' }}>{d.role}</div>
              </div>
              <div className="ml-auto text-xs" style={{ color:'rgba(255,255,255,.2)' }}>→</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
