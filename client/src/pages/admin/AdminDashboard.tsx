import { Building2, GraduationCap, LayoutDashboard, Settings, SlidersHorizontal, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

import { dashboardApi, type AdminDashboardData } from '@/api/dashboard.api'
import { getApiError } from '@/api/axios'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Students', icon: Users },
  { label: 'Universities', icon: Building2 },
  { label: 'Recommendation Data', icon: SlidersHorizontal },
  { label: 'Settings', icon: Settings },
]

export function AdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardApi.admin().then(setData).catch((requestError) => setError(getApiError(requestError, 'Could not load dashboard data.')))
  }, [])

  return <DashboardLayout title="Admin Dashboard" navItems={navItems}><div className="space-y-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Administration</p><h2 className="mt-1 text-3xl font-semibold tracking-tight">Welcome, {user?.full_name}</h2><p className="mt-2 text-muted-foreground">A concise view of the ScholarAI platform foundation.</p></div><Badge className="bg-emerald-100 text-emerald-800">System operational</Badge></div>{error && <Alert>{error}</Alert>}<div className="grid gap-4 md:grid-cols-3"><AdminMetric icon={Users} title="Total Students" value={data?.total_students} note="Live user count" /><AdminMetric icon={Building2} title="Total Universities" value={data ? (data.total_universities ?? '—') : undefined} note={data?.university_data_status ?? 'Loading status'} /><AdminMetric icon={GraduationCap} title="Active Users" value={data?.active_users} note="Live active account count" /></div><Card><CardHeader><CardTitle>Project foundation</CardTitle><CardDescription>Current status of administrative modules.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Status label="Authentication and JWT" ready /><Status label="Role-based authorization" ready /><Status label="Student account tracking" ready /><Status label="University data management" /></CardContent></Card></div></DashboardLayout>
}

function AdminMetric({ icon: Icon, title, value, note }: { icon: typeof Users; title: string; value: number | string | undefined; note: string }) {
  return <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-3"><CardDescription>{title}</CardDescription><span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="size-4" /></span></CardHeader><CardContent><CardTitle className="text-3xl">{value === undefined ? <Skeleton className="h-9 w-20" /> : value}</CardTitle><p className="mt-2 text-xs text-muted-foreground">{note}</p></CardContent></Card>
}

function Status({ label, ready = false }: { label: string; ready?: boolean }) {
  return <div className="flex items-center justify-between rounded-lg border p-4"><span className="text-sm font-medium">{label}</span><Badge className={ready ? 'bg-emerald-100 text-emerald-800' : ''}>{ready ? 'Ready' : 'Planned'}</Badge></div>
}
