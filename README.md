# NoteFrais — Application de gestion des notes de frais

**Stack :** Next.js 14 (App Router) + Supabase + Vercel

## Comptes de démonstration

| Nom | Email | Mot de passe | Rôles |
|-----|-------|-------------|-------|
| Antoine BARBET | a.barbet@corp.fr | admin123 | Admin · Valideur · Employé |
| Amélie NUSSBAUM | a.nussbaum@corp.fr | valid123 | Valideur · Employée |
| Damien DRILLET | d.drillet@corp.fr | valid123 | Valideur · Employé |
| Anaïs JOUET | a.jouet@corp.fr | employe123 | Employée |

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Appliquer le schéma Supabase
# Aller dans Supabase > SQL Editor et coller le contenu de :
# supabase/migrations/20250327000001_initial_schema.sql

# 4. Créer les 4 comptes dans Supabase Auth
# Authentication > Users > Add user (pour chaque compte ci-dessus)
# Puis mettre à jour la table profiles avec les bons rôles

# 5. Lancer
npm run dev
```

## Déploiement GitHub + Vercel

```bash
# Initialiser git
git init
git add .
git commit -m "feat: initialisation NoteFrais"
git remote add origin https://github.com/antoinebarbetquince-cmyk/NDF.git
git push -u origin main
```

Puis sur vercel.com : Import → antoinebarbetquince-cmyk/NDF → ajouter les variables d'env → Deploy.

## Structure

```
NDF/
├── app/
│   ├── login/              Page de connexion
│   ├── dashboard/          Tableau de bord
│   ├── reports/            Mes notes (liste, détail, création, édition)
│   ├── validation/         Notes à valider (liste + détail avec décision)
│   └── admin/              Utilisateurs & Paramètres
├── components/
│   ├── layout/             Sidebar, Shell, Header
│   ├── reports/            LineRow (lignes de dépenses)
│   └── ui/                 StatusBadge, Spinner, Empty
├── lib/
│   ├── supabase/           Clients client/server/middleware
│   └── utils/              Formatage
├── types/                  Types TypeScript
└── supabase/migrations/    Schéma SQL complet
```
