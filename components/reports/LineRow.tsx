'use client'
import { useState } from 'react'
import type { ExpenseCategory } from '@/types'

const CATS: ExpenseCategory[] = ['Transport','Repas','Hébergement','Fournitures','Autre']

export interface LineData {
  id: string
  expense_date: string
  category: ExpenseCategory
  amount_ht: number
  amount_tva: number
  comment: string
  receiptFile?: File | null
  receiptName?: string | null
}

export default function LineRow({ line, onChange, onDelete }: {
  line: LineData
  onChange: (l: LineData) => void
  onDelete: () => void
}) {
  const [warn, setWarn] = useState(false)
  const ttc = (line.amount_ht||0) + (line.amount_tva||0)

  function upd(patch: Partial<LineData>) {
    const next = { ...line, ...patch }
    const pct = next.amount_ht > 0 ? (next.amount_tva / next.amount_ht) * 100 : 0
    setWarn(next.amount_ht > 0 && pct > 20.01)
    onChange(next)
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) upd({ receiptFile: f, receiptName: f.name })
  }

  return (
    <div className="grid items-center gap-1.5 py-2 border-b border-gray-50 last:border-0"
         style={{ gridTemplateColumns:'88px 106px 72px 72px 68px 1fr 88px 24px' }}>
      <input type="date" value={line.expense_date} onChange={e=>upd({expense_date:e.target.value})}
             className="input text-xs py-1.5 px-2"/>
      <select value={line.category} onChange={e=>upd({category:e.target.value as ExpenseCategory})}
              className="input text-xs py-1.5 px-2">
        {CATS.map(c=><option key={c}>{c}</option>)}
      </select>
      <input type="number" value={line.amount_ht||''} placeholder="0.00" step="0.01" min="0"
             onChange={e=>upd({amount_ht:parseFloat(e.target.value)||0})}
             className="input text-xs py-1.5 px-2 text-right"/>
      <input type="number" value={line.amount_tva||''} placeholder="TVA €" step="0.01" min="0"
             title={warn?'⚠ TVA > 20% du HT':''}
             onChange={e=>upd({amount_tva:parseFloat(e.target.value)||0})}
             className={"input text-xs py-1.5 px-2 text-right"+(warn?' border-red-400 bg-red-50 text-red-700':'')}/>
      <div className="text-xs font-semibold text-right text-gray-800 pr-1">
        {ttc>0 ? ttc.toFixed(2)+' €' : '—'}
      </div>
      <input type="text" value={line.comment} placeholder="Commentaire…"
             onChange={e=>upd({comment:e.target.value})}
             className="input text-xs py-1.5 px-2"/>
      <label className={"flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all border "+(
        line.receiptName
          ? 'bg-blue-50 border-[#4f6ef7] text-[#2d46c4] font-semibold'
          : 'border-gray-200 text-gray-400 hover:border-[#4f6ef7] hover:text-[#4f6ef7]')}>
        <span>📎</span>
        <span className="truncate" style={{maxWidth:52}}>
          {line.receiptName ? line.receiptName.slice(0,9)+'…' : 'Joindre'}
        </span>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onFile}/>
      </label>
      <button onClick={onDelete}
              className="w-6 h-6 flex items-center justify-center rounded text-red-300 hover:text-red-500 hover:bg-red-50 transition-all text-sm">
        ✕
      </button>
    </div>
  )
}
