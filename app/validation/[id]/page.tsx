'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Shell from '@/components/layout/Shell'
import Header from '@/components/layout/Header'
import Spinner from '@/components/ui/Spinner'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import Link from 'next/link'

export default function ValidationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('expense_reports')
      .select('*, user:profiles!user_id(first_name,last_name,email), lines:expense_lines(*)')
      .eq('id', params.id as string).single()
      .then(({ data }) => { setReport(data); setLoading(false) })
  }, [params.id])

  async function approve() {
    setSaving(true)
    await supabase.rpc('approve_report', { p_report_id: report.id })
    setSaving(false)
    router.push('/validation')
    router.refresh()
  }

  async function reject() {
    if (!comment.trim()) { alert('Le motif est obligatoire'); return }
    setSaving(true)
    await supabase.rpc('reject_report', { p_report_id: report.id, p_comment: comment.trim() })
    setSaving(false)
    router.push('/validation')
    router.refresh()
  }

  if (loading) return <Shell><Spinner/></Shell>
  if (!report) return <Shell><div className="p-6 text-gray-400">Note introuvable.</div></Shell>

  const lines = report.lines ?? []
  const isPending = report.status === 'submitted'

  return (
    <Shell>
      <Header title={report.title} subtitle={"Soumis le "+formatDate(report.submitted_at)}
        action={<Link href="/validation" className="btn btn-sm">← Retour</Link>}/>
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        <div className="card p-5">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Employé</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-[#4f6ef7]">
              {report.user?.first_name?.[0]}{report.user?.last_name?.[0]}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{report.user?.first_name} {report.user?.last_name}</div>
              <div className="text-xs text-gray-400">{report.user?.email}</div>
            </div>
          </div>
        </div>

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
              {lines.map((l:any) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="td">{formatDate(l.expense_date)}</td>
                  <td className="td">{l.category}</td>
                  <td className="td text-right tabular-nums">{formatCurrency(l.amount_ht)}</td>
                  <td className="td text-right tabular-nums">{formatCurrency(l.amount_tva)}</td>
                  <td className="td text-right font-semibold tabular-nums">{formatCurrency(l.amount_ttc)}</td>
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
            {[['HT',report.total_ht],['TVA',report.total_tva],['TTC',report.total_ttc,true]].map(([l,v,m])=>(
              <div key={l as string} className="text-right">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{l}</div>
                <div className={m?'text-xl font-bold text-[#4f6ef7]':'text-sm font-semibold text-gray-800'}>{formatCurrency(v as number)}</div>
              </div>
            ))}
          </div>
        </div>

        {isPending && (
          <div className="card p-5">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Décision</h2>
            {!showReject ? (
              <div className="flex gap-3">
                <button onClick={approve} disabled={saving}
                        className="btn btn-success gap-2 px-5 py-2.5 text-sm">
                  ✓ {saving ? 'Validation…' : 'Valider cette note'}
                </button>
                <button onClick={()=>setShowReject(true)}
                        className="btn btn-danger gap-2 px-5 py-2.5 text-sm">
                  ✕ Refuser
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="label">Motif de refus *</label>
                <textarea value={comment} onChange={e=>setComment(e.target.value)}
                          placeholder="Expliquez le motif du refus à l'employé…" rows={4}
                          className="input resize-none"/>
                <div className="flex gap-2">
                  <button onClick={reject} disabled={saving}
                          className="btn btn-danger gap-1.5 text-sm">
                    ✕ {saving ? 'Refus…' : 'Confirmer le refus'}
                  </button>
                  <button onClick={()=>setShowReject(false)} className="btn">Annuler</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  )
}
