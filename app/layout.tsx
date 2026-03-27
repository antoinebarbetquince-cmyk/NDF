import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'NoteFrais — Notes de frais',
  description: 'Application de gestion des notes de frais',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
