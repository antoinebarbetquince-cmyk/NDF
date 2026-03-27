export default function Spinner({ text='Chargement…' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-16 gap-2">
      <div className="w-4 h-4 border-2 border-blue-200 border-t-[#4f6ef7] rounded-full animate-spin"/>
      <span className="text-sm text-gray-400">{text}</span>
    </div>
  )
}
