import type { ReportStatus } from '@/types'
const C: Record<ReportStatus,{label:string;cls:string}> = {
  draft:     { label:'Brouillon', cls:'badge badge-draft' },
  submitted: { label:'Soumis',    cls:'badge badge-submitted' },
  approved:  { label:'Validé',    cls:'badge badge-approved' },
  rejected:  { label:'Refusé',    cls:'badge badge-rejected' },
}
export default function StatusBadge({ status }: { status: ReportStatus }) {
  const { label, cls } = C[status] ?? C.draft
  return <span className={cls}><span className="w-1.5 h-1.5 rounded-full bg-current"/>{label}</span>
}
