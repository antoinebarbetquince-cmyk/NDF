import { createClient } from '@/lib/supabase/server'
import Shell from '@/components/layout/Shell'
import Header from '@/components/layout/Header'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'
import { formatCurrency, formatDateShort } from '@/lib/utils/format'
import type { ExpenseReport } from '@/types'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rawReports } = await supabase
  const reports: ExpenseReport[] = rawReports ?? []
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50) as { data: ExpenseReport[] }

  const { count: pendingCount = 0 } = await supabase
    .from('expense_reports').select('*', { count:'exact', head:true }).eq('status','submitted')

  const approved = reports.filter(r => r.status === 'approved')
  const kpis = [
    { label:'Total remboursé',  value: formatCurrency(approved.reduce((s,r)=>s+r.total_ttc,0)), sub:'Notes validées',      color:'#4f6ef7', icon:'💶' },
    { label:'En attente',       value: String(reports.filter(r=>r.status==='submitted').length), sub:'À valider',            color:'#f59e0b', icon:'⏳' },
    { label:'Validées',         value: String(approved.length),                                  sub:'Ce trimestre',         color:'#22c55e', icon:'✅' },
    { label:'TVA récupérable',  value: formatCurrency(approved.reduce((s,r)=>s+r.total_tva,0)), sub:'Notes approuvées',     color:'#8b5cf6', icon:'🧾' },
  ]

  return (
    <Shell pendingCount={pendingCount ?? 0}>
      <Header title="Tableau de bord"
        action={<Link href="/reports/new" className="btn btn-primary text-xs px-3 py-2">+ Nouvelle note</Link>} />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          {kpis.map(k => (
            <Link key={k.label} href="/reports"
                  className="card p-4 hover:shadow-md transition-all hover:border-[#4f6ef7]/30 cursor-pointer">
              <div className="text-xl mb-2">{k.icon}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{k.label}</div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight">{k.value}</div>
              <div className="text-xs text-gray-400 mt-1">{k.sub}</div>
            </Link>
          ))}
        </div>
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Activité récente</h2>
            <Link href="/reports" className="text-xs text-[#4f6ef7] hover:underline">Voir tout →</Link>
          </div>
          {reports.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400 mb-4">Aucune note de frais</p>
              <Link href="/reports/new" className="btn btn-primary">Créer ma première note</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead><tr>
                <th className="th">Note de frais</th><th className="th">Période</th>
                <th className="th text-right">TTC</th><th className="th">Statut</th>
              </tr></thead>
              <tbody>
                {reports.slice(0,6).map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="td"><Link href={"/reports/"+r.id} className="text-[#4f6ef7] font-medium hover:underline">{r.title}</Link></td>
                    <td className="td text-gray-400">{formatDateShort(r.period_start)}</td>
                    <td className="td text-right font-semibold tabular-nums">{formatCurrency(r.total_ttc)}</td>
                    <td className="td"><StatusBadge status={r.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Shell>
  )
}
