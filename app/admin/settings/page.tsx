import Shell from '@/components/layout/Shell'
import Header from '@/components/layout/Header'

export default function SettingsPage() {
  return (
    <Shell>
      <Header title="Paramètres" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="card p-5">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Paramètres généraux</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Nom de l&apos;entreprise</label><input className="input" defaultValue="Mon Entreprise SAS"/></div>
            <div><label className="label">Devise</label><select className="input"><option>EUR — Euro (€)</option><option>USD — Dollar ($)</option></select></div>
            <div><label className="label">Plafond repas (€ HT)</label><input type="number" className="input" defaultValue="25"/></div>
            <div><label className="label">Plafond hébergement (€ HT)</label><input type="number" className="input" defaultValue="150"/></div>
            <div className="col-span-2"><label className="label">Politique</label>
              <textarea className="input resize-none" rows={3} defaultValue="Les notes de frais doivent être soumises dans les 30 jours."/></div>
          </div>
          <div className="flex justify-end mt-4"><button className="btn btn-primary">Sauvegarder</button></div>
        </div>
        <div className="card p-5">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Catégories</h2>
          <table className="w-full">
            <thead><tr><th className="th">Catégorie</th><th className="th">TVA défaut</th><th className="th">Plafond HT</th><th className="th">Statut</th></tr></thead>
            <tbody>
              {[['Transport','20%','—'],['Repas','10%','25 €'],['Hébergement','20%','150 €'],['Fournitures','20%','—'],['Autre','20%','—']].map(([n,t,c])=>(
                <tr key={n} className="hover:bg-gray-50">
                  <td className="td font-medium">{n}</td><td className="td text-gray-400">{t}</td><td className="td text-gray-400">{c}</td>
                  <td className="td"><span className="badge badge-approved"><span className="w-1.5 h-1.5 rounded-full bg-current"/>Actif</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  )
}
