import Sidebar from './Sidebar'
export default function Shell({ children, pendingCount=0 }: { children: React.ReactNode; pendingCount?: number }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar pendingCount={pendingCount} />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-gray-50">
        {children}
      </main>
    </div>
  )
}
