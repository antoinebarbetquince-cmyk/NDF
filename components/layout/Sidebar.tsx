'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const MAIN_NAV = [
  { href:'/dashboard', label:'Tableau de bord', icon:'grid' },
  { href:'/reports/new', label:'Nouvelle note',  icon:'plus-circle' },
  { href:'/reports',    label:'Mes notes',       icon:'file-text' },
]
const VALIDATOR_NAV = [
  { href:'/validation', label:'À valider', icon:'check-circle', badge: true },
]
const ADMIN_NAV = [
  { href:'/admin/users',    label:'Utilisateurs', icon:'users' },
  { href:'/admin/settings', label:'Paramètres',   icon:'settings' },
]

function Icon({ name, size=14 }: { name:string; size?:number }) {
  const s = { width: size, height: size }
  const base = { fill:'none', stroke:'currentColor', strokeWidth:1.8, strokeLinecap:'round' as const, strokeLinejoin:'round' as const }
  if (name==='grid') return <svg viewBox="0 0 24 24" style={s} {...base}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  if (name==='plus-circle') return <svg viewBox="0 0 24 24" style={s} {...base}><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
  if (name==='file-text') return <svg viewBox="0 0 24 24" style={s} {...base}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
  if (name==='check-circle') return <svg viewBox="0 0 24 24" style={s} {...base}><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>
  if (name==='users') return <svg viewBox="0 0 24 24" style={s} {...base}><circle cx="9" cy="7" r="4"/><path d="M2 21v-1a7 7 0 0114 0v1"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M22 21v-1a4 4 0 00-3-3.87"/></svg>
  if (name==='settings') return <svg viewBox="0 0 24 24" style={s} {...base}><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
  if (name==='logout') return <svg viewBox="0 0 24 24" style={s} {...base}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
  return null
}

export default function Sidebar({ pendingCount=0 }: { pendingCount?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data))
    })
  }, [])

  const roles: string[] = profile?.roles ?? []
  const isValidator = roles.includes('validator') || roles.includes('admin')
  const isAdmin = roles.includes('admin')
  const initials = profile ? (profile.first_name[0] + profile.last_name[0]).toUpperCase() : '?'
  const fullName = profile ? profile.first_name + ' ' + profile.last_name : ''
  const roleLabel = [roles.includes('admin')&&'Admin', roles.includes('validator')&&'Valideur', roles.includes('employee')&&'Employé(e)'].filter(Boolean).join(' · ')

  function isActive(href: string) {
    if (href === '/reports') return pathname === '/reports' || (pathname.startsWith('/reports/') && !pathname.startsWith('/reports/new'))
    return pathname === href || pathname.startsWith(href + '/')
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function NavItem({ href, label, icon, badge }: { href:string; label:string; icon:string; badge?:boolean }) {
    const active = isActive(href)
    return (
      <Link href={href}
            className="flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-xl mb-0.5 text-[12.5px] transition-all relative"
            style={{ background: active ? 'rgba(79,110,247,.18)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,.45)' }}>
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r" style={{ background:'#4f6ef7', marginLeft:'-6px' }}/>}
        <span style={{ opacity: active ? 1 : 0.55 }}><Icon name={icon} /></span>
        <span>{label}</span>
        {badge && pendingCount > 0 && (
          <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[17px] text-center">
            {pendingCount}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside className="w-[215px] flex-shrink-0 flex flex-col h-screen"
           style={{ background:'#1a1d27', borderRight:'1px solid rgba(255,255,255,.05)' }}>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 flex-shrink-0"
           style={{ borderBottom:'1px solid rgba(255,255,255,.05)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ background:'#4f6ef7', boxShadow:'0 2px 8px rgba(79,110,247,.3)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="16" rx="3"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="13" y2="13"/>
          </svg>
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-tight">NoteFrais</div>
          <div className="text-[9px]" style={{ color:'rgba(255,255,255,.2)' }}>v4.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <div className="px-4 pb-1 pt-2 text-[9px] font-bold uppercase tracking-widest" style={{ color:'rgba(255,255,255,.2)' }}>Principal</div>
        {MAIN_NAV.map(n => <NavItem key={n.href} {...n} />)}
        {isValidator && <>
          <div className="px-4 pb-1 pt-4 text-[9px] font-bold uppercase tracking-widest" style={{ color:'rgba(255,255,255,.2)' }}>Validation</div>
          {VALIDATOR_NAV.map(n => <NavItem key={n.href} {...n} />)}
        </>}
        {isAdmin && <>
          <div className="px-4 pb-1 pt-4 text-[9px] font-bold uppercase tracking-widest" style={{ color:'rgba(255,255,255,.2)' }}>Administration</div>
          {ADMIN_NAV.map(n => <NavItem key={n.href} {...n} />)}
        </>}
      </nav>

      {/* User */}
      <div className="p-3 flex-shrink-0" style={{ borderTop:'1px solid rgba(255,255,255,.05)' }}>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
               style={{ background:'rgba(245,158,11,.18)', color:'#92400e' }}>{initials}</div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{fullName}</div>
            <div className="text-[9px] truncate" style={{ color:'rgba(255,255,255,.3)' }}>{roleLabel}</div>
          </div>
        </div>
        <button onClick={logout}
                className="w-full py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all"
                style={{ background:'rgba(239,68,68,.08)', color:'#fca5a5', border:'1px solid rgba(239,68,68,.18)' }}>
          <Icon name="logout" size={11} />Déconnexion
        </button>
      </div>
    </aside>
  )
}
