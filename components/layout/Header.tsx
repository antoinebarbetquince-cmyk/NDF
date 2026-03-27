export default function Header({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0 h-[56px]">
      <div>
        <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}
