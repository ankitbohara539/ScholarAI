import { Building2, ExternalLink, MapPin, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getApiError } from '@/api/axios'
import { universitiesApi } from '@/api/universities.api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { studentNavigation } from '@/lib/navigation'
import type { Page, University } from '@/types/university'

export function UniversitiesPage() {
  const [data, setData] = useState<Page<University> | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { universitiesApi.list({ page, page_size: 12, search: search || undefined, country: country || undefined, region: region || undefined }).then(setData).catch((requestError) => setError(getApiError(requestError))) }, [page, search, country, region])
  return <DashboardLayout title="Universities" navItems={studentNavigation}><div className="space-y-6"><div><h2 className="text-3xl font-semibold">Explore universities</h2><p className="mt-2 text-muted-foreground">Only active, non-deleted universities stored in the database are shown.</p></div><Card><CardContent className="grid gap-3 pt-6 md:grid-cols-3"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search university" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} /></div><Input placeholder="Country" value={country} onChange={(e) => { setCountry(e.target.value); setPage(1) }} /><Input placeholder="Region" value={region} onChange={(e) => { setRegion(e.target.value); setPage(1) }} /></CardContent></Card>{error && <Alert>{error}</Alert>}{!data ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64" />)}</div> : <><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.items.map((university) => <Card key={university.id}><CardHeader><div className="flex items-start justify-between gap-3"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Building2 /></span><Badge>QS #{university.ranking}</Badge></div><CardTitle className="pt-3 leading-6">{university.name}</CardTitle><CardDescription className="flex items-center gap-1"><MapPin className="size-4" />{university.country}, {university.region}</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Academic reputation</span><strong>{Number(university.academic_reputation_score).toFixed(1)}</strong></div><div className="flex justify-between"><span className="text-muted-foreground">Tuition</span><strong>{university.tuition_fee ? `$${Number(university.tuition_fee).toLocaleString()}` : 'Not provided'}</strong></div>{university.website_url && <Button asChild variant="outline" className="w-full"><a href={university.website_url} target="_blank" rel="noreferrer">Visit website<ExternalLink className="size-4" /></a></Button>}</CardContent></Card>)}</div>{data.items.length === 0 && <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">No universities match these filters.</div>}<div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{data.total} universities</p><div className="flex gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="outline" disabled={page >= data.pages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div></>}</div></DashboardLayout>
}
