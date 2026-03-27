import { createClient } from '@/lib/supabase/server'
import Shell from '@/components/layout/Shell'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils/format'

export default async function ValidationPage() {
  const supabase = createClient()
  const { data: reports = [] } = await supabase
    .from('expense_reports')
    .select('*, user:profiles!user_id(id,first_name,last_name,email), lines:expense_lines(id)')
    .eq('status','submitted')
    .order('submitted_at',{ascending:true}) as {data:any[]}

  const pending = reports.length

  return (
    <Shell pendingCount={pending}>
      <Header title="Notes à valider"
        subtitle={pending>0 ? pending+' note'+(pending>1?'s':'')+' en attente' : 'Tout est à jour'} />
      <div className="flex-1 overflow-y-auto p-6">
        {pending>0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium mb-5 bg-amber-50 text-amber-800 border border-amber-200">
            ⏳ {pending} note{pending>1?'s':''} en attente de votre validation
          </div>
        )}
        <div className="card">
          {reports.length===0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-sm font-semibold text-gray-700">Tout est à jour !</div>
              <div className="text-xs text-gray-400 mt-1">Aucune note en attente.</div>
            </div>
          ) : (
            <table className="w-full">
              <thead><tr>
                <th className="th">Note de frais</th><th className="th">Employé</th>
                <th className="th">Soumis le</th><th className="th text-center">Lignes</th>
                <th className="th text-right">HT</th><th className="th text-right">TVA</th>
                <th className="th text-right">TTC</th><th className="th">Actions</th>
              </tr></thead>
              <tbody>
                {reports.map((r:any) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="td font-medium">
                      <Link href={"/validation/"+r.id} className="text-[#4f6ef7] hover:underline">{r.title}</Link>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500 flex-shrink-0">
                          {r.user?.first_name?.[0]}{r.user?.last_name?.[0]}
                        </div>
                        <span className="text-sm">{r.user?.first_name} {r.user?.last_name}</span>
                      </div>
                    </td>
                    <td className="td text-gray-400">{formatDate(r.submitted_at)}</td>
                    <td className="td text-center text-gray-400">{r.lines?.length??0}</td>
                    <td className="td text-right tabular-nums">{formatCurrency(r.total_ht)}</td>
                    <td className="td text-right tabular-nums">{formatCurrency(r.total_tva)}</td>
                    <td className="td text-right font-semibold tabular-nums">{formatCurrency(r.total_ttc)}</td>
                    <td className="td">
                      <Link href={"/validation/"+r.id} className="btn btn-sm">Voir →</Link>
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
