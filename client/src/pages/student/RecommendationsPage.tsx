import { Building2, LoaderCircle, MapPin, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getApiError } from '@/api/axios'
import { profileApi } from '@/api/profile.api'
import { recommendationsApi } from '@/api/recommendations.api'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { studentNavigation } from '@/lib/navigation'
import type { StudentProfile } from '@/types/profile'
import type { RecommendationList } from '@/types/recommendation'

export function RecommendationsPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [data, setData] = useState<RecommendationList | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { Promise.all([profileApi.get(), recommendationsApi.latest()]).then(([profileValue, recommendations]) => { setProfile(profileValue); setData(recommendations) }).catch((requestError) => setError(getApiError(requestError))).finally(() => setLoading(false)) }, [])
  async function generate() { setGenerating(true); setError(''); try { setData(await recommendationsApi.generate(10)) } catch (requestError) { setError(getApiError(requestError)) } finally { setGenerating(false) } }
  return <DashboardLayout title="Recommendations" navItems={studentNavigation}><div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-3xl font-semibold">University recommendations</h2><p className="mt-2 text-muted-foreground">ML-ranked matches generated from your verified profile and active database universities.</p></div><Button disabled={generating || profile?.verification_status !== 'verified'} onClick={() => void generate()}>{generating ? <LoaderCircle className="animate-spin" /> : <Sparkles />}Generate recommendations</Button></div>{error && <Alert>{error}</Alert>}{loading ? <Skeleton className="h-40" /> : profile && profile.verification_status !== 'verified' && <Alert className="border-amber-300 bg-amber-50 text-amber-900"><div className="flex items-center gap-2 font-semibold"><StatusBadge status={profile.verification_status} />Verification required</div><p className="mt-2">Complete and submit your profile, then wait for administrator verification before generating recommendations.</p></Alert>}{data?.generated_at && <p className="text-sm text-muted-foreground">Latest generation: {new Date(data.generated_at).toLocaleString()} · {data.model_version}</p>}<div className="grid gap-4 lg:grid-cols-2">{data?.recommendations.map((item) => <Card key={item.university.id}><CardHeader><div className="flex items-start justify-between"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Building2 /></span><div className="flex gap-2"><Badge>#{item.rank}</Badge><StatusBadge status={item.category} /></div></div><CardTitle className="pt-3">{item.university.name}</CardTitle><CardDescription className="flex items-center gap-1"><MapPin className="size-4" />{item.university.country}, {item.university.region}</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex justify-between text-sm"><span>Hybrid match score</span><strong>{Math.round(item.score * 100)}%</strong></div><Progress value={item.score * 100} /><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground">QS rank</span><p className="font-semibold">#{item.university.ranking}</p></div><div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground">Reputation</span><p className="font-semibold">{Number(item.university.academic_reputation_score).toFixed(1)}</p></div></div></CardContent></Card>)}</div>{data && data.recommendations.length === 0 && <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">No recommendation generation is available yet.</div>}</div></DashboardLayout>
}
