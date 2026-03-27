import { createClient } from '@/lib/supabase/server'
import Shell from '@/components/layout/Shell'
import Header from '@/components/layout/Header'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils/format'

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: r } = await supabase
    .from('expense_reports')
    .select('*, lines:expense_lines(*), reviewer:profiles!reviewed_by(first_name,last_name)')
    .eq('id', params.id).single()
  if (!r) notFound()

  const { count: pendingCount = 0 } = await supabase
    .from('expense_reports').select('*',{count:'exact',head:true}).eq('status','submitted')

  return (
    <Shell pendingCount={pendingCount??0}>
      <Header title={r.title} subtitle={r.lines?.length+' ligne(s)'}
        action={
          <div className="flex gap-2">
            <Link href="/reports" className="btn btn-sm">← Retour</Link>
            {r.status==='draft' && <Link href={"/reports/"+r.id+"/edit"} className="btn btn-sm">✏ Modifier</Link>}
          </div>
        }/>
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="card p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="label mb-1">Statut</div>
              <StatusBadge status={r.status}/>
            </div>
            {r.status==='approved' && r.reviewer && (
              <div>
                <div className="label mb-1">Validé par</div>
                <div className="text-sm text-gray-700">{r.reviewer.first_name} {r.reviewer.last_name} — {formatDate(r.reviewed_at)}</div>
              </div>
            )}
          </div>
        </div>

        {r.status==='rejected' && r.review_comment && (
          <div className="card p-4 border-red-200 bg-red-50">
            <div className="text-xs font-bold text-red-700 mb-1">Motif de refus</div>
            <div className="text-sm text-red-700">{r.review_comment}</div>
          </div>
        )}

        <div className="card p-5">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Lignes de dépenses</h2>
          <table className="w-full">
            <thead><tr>
              <th className="th">Date</th><th className="th">Catégorie</th>
              <th className="th text-right">HT</th><th className="th text-right">TVA</th>
              <th className="th text-right">TTC</th><th className="th">Commentaire</th>
              <th className="th text-center">Justificatif</th>
            </tr></thead>
            <tbody>
              {(r.lines??[]).map((l:any) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="td">{formatDate(l.expense_date)}</td>
                  <td className="td">{l.category}</td>
                  <td className="td text-right tabular-nums">{formatCurrency(l.amount_ht)}</td>
                  <td className="td text-right tabular-nums">{formatCurrency(l.amount_tva)}</td>
                  <td className="td text-right tabular-nums font-semibold">{formatCurrency(l.amount_ttc)}</td>
                  <td className="td text-gray-400">{l.comment||'—'}</td>
                  <td className="td text-center">
                    {l.receipt_name
                      ? <span className="text-xs text-[#4f6ef7]">📎 {l.receipt_name.slice(0,14)}</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end gap-6 pt-4 mt-3 border-t border-gray-100">
            {[['HT',r.total_ht],['TVA',r.total_tva],['TTC',r.total_ttc,true]].map(([l,v,m])=>(
              <div key={l as string} className="text-right">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{l}</div>
                <div className={m?'text-xl font-bold text-[#4f6ef7]':'text-sm font-semibold text-gray-800'}>{formatCurrency(v as number)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}
