export default function Empty({ icon, title, description, action }: {
  icon?: string; title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <div className="text-sm font-semibold text-gray-700 mb-1">{title}</div>
      {description && <p className="text-xs text-gray-400 mb-5 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
