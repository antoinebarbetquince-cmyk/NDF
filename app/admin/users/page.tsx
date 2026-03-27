import { createClient } from '@/lib/supabase/server'
import Shell from '@/components/layout/Shell'
import Header from '@/components/layout/Header'

const RL: Record<string, string> = { employee:'Employé(e)', validator:'Valideur', admin:'Administrateur' }
const RC: Record<string, string> = { employee:'badge badge-draft', validator:'badge badge-submitted', admin:'badge badge-approved' }

export default async function AdminUsersPage() {
  const supabase = createClient()

  const { data: rawUsers } = await supabase
    .from('profiles')
    .select('*, validator:profiles!validator_id(first_name,last_name)')
    .order('last_name')
  const users: any[] = rawUsers ?? []

  const { count: pendingCount } = await supabase
    .from('expense_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'submitted')

  return (
    <Shell pendingCount={pendingCount ?? 0}>
      <Header
        title="Utilisateurs"
        subtitle={users.length + ' utilisateur' + (users.length !== 1 ? 's' : '')}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="card">
          <table className="w-full">
            <thead><tr>
              <th className="th">Utilisateur</th>
              <th className="th">Email</th>
              <th className="th">Rôles</th>
              <th className="th">Valideur</th>
              <th className="th">Statut</th>
            </tr></thead>
            <tbody>
              {users.map((u: any) => {
                const ini = ((u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')).toUpperCase()
                const roles: string[] = u.roles ?? ['employee']
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                             style={{ background:'rgba(245,158,11,.15)', color:'#92400e' }}>
                          {ini}
                        </div>
                        <span className="font-medium">{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td className="td text-gray-400">{u.email}</td>
                    <td className="td">
                      <div className="flex gap-1 flex-wrap">
                        {roles.map(r => (
                          <span key={r} className={RC[r] ?? 'badge badge-draft'}>{RL[r] ?? r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="td text-gray-400">
                      {u.validator ? u.validator.first_name + ' ' + u.validator.last_name : '—'}
                    </td>
                    <td className="td">
                      <span className={u.is_active ? 'badge badge-approved' : 'badge badge-rejected'}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"/>
                        {u.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  )
}
