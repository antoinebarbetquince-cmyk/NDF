
export type UserRole = 'employee' | 'validator' | 'admin'
export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected'
export type ExpenseCategory = 'Transport' | 'Repas' | 'Hébergement' | 'Fournitures' | 'Autre'

export interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  roles: UserRole[]
  validator_id: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  validator?: Pick<Profile, 'id'|'first_name'|'last_name'>
}

export interface ExpenseReport {
  id: string
  user_id: string
  title: string
  period_start: string | null
  period_end: string | null
  status: ReportStatus
  total_ht: number
  total_tva: number
  total_ttc: number
  reviewed_by: string | null
  reviewed_at: string | null
  review_comment: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
  user?: Pick<Profile,'id'|'first_name'|'last_name'|'email'>
  reviewer?: Pick<Profile,'id'|'first_name'|'last_name'>
  lines?: ExpenseLine[]
}

export interface ExpenseLine {
  id: string
  report_id: string
  line_order: number
  expense_date: string
  category: ExpenseCategory
  amount_ht: number
  amount_tva: number
  amount_ttc: number
  comment: string | null
  receipt_path: string | null
  receipt_name: string | null
  receipt_size: number | null
  receipt_type: 'pdf' | 'img' | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  report_id: string | null
  type: 'submitted' | 'approved' | 'rejected'
  message: string
  is_read: boolean
  created_at: string
}
