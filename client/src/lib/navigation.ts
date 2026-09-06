import { Building2, FlaskConical, GitCompareArrows, LayoutDashboard, Settings, Sparkles, UserRound, Users } from 'lucide-react'
import type { NavItem } from '@/components/layout/DashboardLayout'

export const studentNavigation: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/student/dashboard' },
  { label: 'Profile', icon: UserRound, to: '/student/profile' },
  { label: 'Universities', icon: Building2, to: '/student/universities' },
  { label: 'Recommendations', icon: Sparkles, to: '/student/recommendations' },
  { label: 'What-If Simulator', icon: FlaskConical, to: '/student/simulator' },
  { label: 'Compare', icon: GitCompareArrows, to: '/student/compare' },
  { label: 'Settings', icon: Settings, to: '/student/settings' },
]

export const adminNavigation: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Students', icon: Users, to: '/admin/students' },
  { label: 'Universities', icon: Building2, to: '/admin/universities' },
  { label: 'Settings', icon: Settings, to: '/admin/settings' },
]
