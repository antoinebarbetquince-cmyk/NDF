
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
  } catch { return date }
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
  } catch { return date }
}

export function cn(...classes: (string|undefined|false|null)[]): string {
  return classes.filter(Boolean).join(' ')
}
