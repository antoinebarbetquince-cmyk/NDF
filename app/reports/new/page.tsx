'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Shell from '@/components/layout/Shell'
import Header from '@/components/layout/Header'
import LineRow, { type LineData } from '@/components/reports/LineRow'
import { formatCurrency } from '@/lib/utils/format'
import type { ExpenseCategory } from '@/types'

function mkLine(): LineData {
  return { id: Math.random().toString(36).slice(2), expense_date: new Date().toISOString().slice(0,10),
    category:'Transport', amount_ht:0, amount_tva:0, comment:'', receiptFile:null, receiptName:null }
}

export default function NewReportPage() {
  const [title, setTitle]   = useState('')
  const [ps, setPs]         = useState('')
  const [pe, setPe]         = useState('')
  const [lines, setLines]   = useState<LineData[]>([mkLine()])
  const [saving, setSaving] = useState(false)
  const [warn, setWarn]     = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const totHT  = lines.reduce((s,l)=>s+(l.amount_ht||0),0)
  const totTVA = lines.reduce((s,l)=>s+(l.amount_tva||0),0)

  function updLine(id:string, upd:LineData) {
    const next = lines.map(l=>l.id===id?upd:l)
    setLines(next)
    setWarn(next.some(l=>l.amount_ht>0&&(l.amount_tva/l.amount_ht)*100>20.01))
  }

  async function save(status:'draft'|'submitted') {
    if (!title.trim()) { alert('Veuillez saisir un intitulé'); return }
    if (warn && status==='submitted' && !confirm('TVA > 20% sur certaines lignes. Continuer ?')) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: report, error } = await supabase.from('expense_reports')
      .insert({ user_id:user!.id, title:title.trim(), period_start:ps||null, period_end:pe||null, status })
      .select().single()
    if (error || !report) { alert('Erreur : '+error?.message); setSaving(false); return }

    for (let i=0; i<lines.length; i++) {
      const l = lines[i]
      let receipt: Record<string,any> = {}
      if (l.receiptFile) {
        const ext = l.receiptFile.name.split('.').pop()
        const path = user!.id+'/'+report.id+'/'+l.id+'.'+ext
        await supabase.storage.from('receipts').upload(path, l.receiptFile, { upsert:true })
        receipt = { receipt_path:path, receipt_name:l.receiptFile.name,
          receipt_size:l.receiptFile.size, receipt_type: l.receiptFile.type.includes('pdf')?'pdf':'img' }
      }
      await supabase.from('expense_lines').insert({
        report_id:report.id, line_order:i,
        expense_date:l.expense_date, category:l.category,
        amount_ht:l.amount_ht, amount_tva:l.amount_tva,
        comment:l.comment||null, ...receipt
      })
    }
    if (status==='submitted') await supabase.rpc('submit_report',{p_report_id:report.id})
    setSaving(false)
    router.push('/reports')
    router.refresh()
  }

  return (
    <Shell>
      <Header title="Nouvelle note de frais"
        action={
          <div className="flex gap-2">
            <button onClick={()=>save('draft')} disabled={saving} className="btn">
              {saving?'…':'💾 Brouillon'}
            </button>
            <button onClick={()=>save('submitted')} disabled={saving} className="btn btn-primary">
              {saving?'…':'Soumettre →'}
            </button>
          </div>
        }/>
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="card p-5">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Informations générales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Intitulé *</label>
              <input value={title} onChange={e=>setTitle(e.target.value)}
                     placeholder="ex : Déplacement client Paris — Avril 2025" className="input"/>
            </div>
            <div><label className="label">Période de début</label>
              <input type="date" value={ps} onChange={e=>setPs(e.target.value)} className="input"/></div>
            <div><label className="label">Période de fin</label>
              <input type="date" value={pe} onChange={e=>setPe(e.target.value)} className="input"/></div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Lignes de dépenses</h2>
          <div className="overflow-x-auto">
            <div className="grid gap-1.5 py-2 border-b border-gray-100 text-[9px] font-bold text-gray-400 uppercase tracking-wider"
                 style={{gridTemplateColumns:'88px 106px 72px 72px 68px 1fr 88px 24px'}}>
              <span>Date</span><span>Catégorie</span><span>HT</span><span>TVA (€)</span>
              <span>TTC</span><span>Commentaire</span><span className="text-center">Justificatif</span><span/>
            </div>
            {lines.map(l => (
              <LineRow key={l.id} line={l}
                onChange={u=>updLine(l.id,u)}
                onDelete={()=>setLines(p=>p.filter(x=>x.id!==l.id))}/>
            ))}
          </div>
          {warn && (
            <div className="mt-3 p-2.5 rounded-lg text-xs bg-red-50 text-red-700 border border-red-200">
              ⚠ Certaines lignes ont une TVA supérieure à 20% du HT.
            </div>
          )}
          <button onClick={()=>setLines(p=>[...p,mkLine()])}
                  className="mt-3 text-xs text-[#4f6ef7] font-medium hover:opacity-75 transition-opacity flex items-center gap-1">
            + Ajouter une ligne
          </button>
          <div className="flex justify-end gap-6 pt-4 mt-4 border-t border-gray-100">
            {[['Total HT',formatCurrency(totHT)],['TVA',formatCurrency(totTVA)],['Total TTC',formatCurrency(totHT+totTVA),true]].map(([l,v,m])=>(
              <div key={l as string} className="text-right">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{l}</div>
                <div className={m?'text-xl font-bold text-[#4f6ef7]':'text-sm font-semibold text-gray-800'}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}
