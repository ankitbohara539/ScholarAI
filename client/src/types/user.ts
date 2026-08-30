export type UserRole = 'student' | 'admin'

export interface User {
  id: number
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
}
