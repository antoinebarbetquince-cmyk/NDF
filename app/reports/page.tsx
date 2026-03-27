import { createClient } from '@/lib/supabase/server'
import Shell from '@/components/layout/Shell'
import Header from '@/components/layout/Header'
import StatusBadge from '@/components/ui/StatusBadge'
import Empty from '@/components/ui/Empty'
import Link from 'next/link'
import { formatCurrency, formatDateShort } from '@/lib/utils/format'
import type { ExpenseReport } from '@/types'

const FILTERS = [
  {label:'Tous', value:'all'}, {label:'Brouillon', value:'draft'},
  {label:'Soumis', value:'submitted'}, {label:'Validé', value:'approved'}, {label:'Refusé', value:'rejected'},
]

export default async function ReportsPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let query = supabase.from('expense_reports').select('*, lines:expense_lines(id)')
    .eq('user_id', user.id).order('created_at', { ascending: false })
  const sf = searchParams.status
  if (sf && sf !== 'all') query = query.eq('status', sf)
  const { data: reports = [] } = await query as { data: ExpenseReport[] }

  const { count: pendingCount = 0 } = await supabase
    .from('expense_reports').select('*', { count:'exact', head:true }).eq('status','submitted')

  const active = sf || 'all'

  return (
    <Shell pendingCount={pendingCount ?? 0}>
      <Header title="Mes notes de frais" subtitle={reports.length+" note"+(reports.length!==1?"s":"")}
        action={<Link href="/reports/new" className="btn btn-primary text-xs px-3 py-2">+ Nouvelle note</Link>} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="card">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2 flex-wrap">
            {FILTERS.map(f => (
              <Link key={f.value} href={f.value==='all'?'/reports':'/reports?status='+f.value}
                    className={"px-3 py-1.5 rounded-full text-xs font-medium transition-all border "+(
                      active===f.value
                        ? 'bg-[#4f6ef7] text-white border-[#4f6ef7]'
                        : 'border-gray-200 text-gray-500 hover:border-[#4f6ef7] hover:text-[#4f6ef7]')}>
                {f.label}
              </Link>
            ))}
          </div>
          {reports.length === 0 ? (
            <Empty icon="📄" title="Aucune note de frais"
              description="Créez votre première note pour commencer."
              action={<Link href="/reports/new" className="btn btn-primary">Créer une note</Link>} />
          ) : (
            <table className="w-full">
              <thead><tr>
                <th className="th">Intitulé</th><th className="th">Période</th>
                <th className="th text-center">Lignes</th><th className="th text-right">HT</th>
                <th className="th text-right">TVA</th><th className="th text-right">TTC</th>
                <th className="th">Statut</th><th className="th">Actions</th>
              </tr></thead>
              <tbody>
                {reports.map((r:any) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="td"><Link href={"/reports/"+r.id} className="text-[#4f6ef7] font-medium hover:underline">{r.title}</Link></td>
                    <td className="td text-gray-400">{formatDateShort(r.period_start)}{r.period_end&&r.period_end!==r.period_start?' – '+formatDateShort(r.period_end):''}</td>
                    <td className="td text-center text-gray-400">{r.lines?.length??0}</td>
                    <td className="td text-right tabular-nums">{formatCurrency(r.total_ht)}</td>
                    <td className="td text-right tabular-nums">{formatCurrency(r.total_tva)}</td>
                    <td className="td text-right font-semibold tabular-nums">{formatCurrency(r.total_ttc)}</td>
                    <td className="td"><StatusBadge status={r.status}/></td>
                    <td className="td">
                      {r.status==='draft'
                        ? <Link href={"/reports/"+r.id+"/edit"} className="btn btn-sm">✏ Modifier</Link>
                        : <Link href={"/reports/"+r.id} className="btn btn-sm">Voir</Link>}
                    </td>
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
