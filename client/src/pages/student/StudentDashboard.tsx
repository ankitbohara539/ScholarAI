import { Bookmark, Building2, LayoutDashboard, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'

import { dashboardApi, type StudentDashboardData } from '@/api/dashboard.api'
import { getApiError } from '@/api/axios'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'University Recommendations', icon: Sparkles },
  { label: 'Saved Universities', icon: Bookmark },
  { label: 'Profile', icon: UserRound },
]

export function StudentDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<StudentDashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardApi.student().then(setData).catch((requestError) => setError(getApiError(requestError, 'Could not load dashboard data.')))
  }, [])

  return <DashboardLayout title="Student Dashboard" navItems={navItems}><div className="space-y-7"><div><p className="text-sm font-medium text-primary">Welcome back</p><h2 className="mt-1 text-3xl font-semibold tracking-tight">Hello, {user?.full_name}</h2><p className="mt-2 text-muted-foreground">Your university planning workspace is ready.</p></div>{error && <Alert>{error}</Alert>}<div className="grid gap-4 md:grid-cols-3"><MetricCard title="Recommended Universities" value={data?.recommended_universities} description="Personalized matches" /><MetricCard title="Saved Universities" value={data?.saved_universities} description="Universities on your list" /><MetricCard title="Profile Completion" value={data?.profile_completion} description="Complete your details later" /></div><Card className="overflow-hidden"><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="size-5 text-primary" />Your recommendations</CardTitle><CardDescription>Matches based on your academic profile will be shown in this section.</CardDescription></CardHeader><CardContent><div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/35 p-8 text-center"><span className="mb-4 rounded-full bg-primary/10 p-4 text-primary"><Sparkles /></span><p className="font-medium">Your university recommendations will appear here.</p><p className="mt-2 max-w-md text-sm text-muted-foreground">The recommendation feature is intentionally reserved for the next project phase.</p></div></CardContent></Card></div></DashboardLayout>
}

function MetricCard({ title, value, description }: { title: string; value: number | string | undefined; description: string }) {
  return <Card><CardHeader className="pb-3"><CardDescription>{title}</CardDescription><CardTitle className="text-3xl">{value === undefined ? <Skeleton className="h-9 w-20" /> : value}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">{description}</p></CardContent></Card>
}
