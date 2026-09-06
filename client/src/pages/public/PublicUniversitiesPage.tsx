import { Building2, MapPin, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getApiError } from '@/api/axios'
import { publicUniversitiesApi } from '@/api/universities.api'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { Page, University } from '@/types/university'

export function PublicUniversitiesPage() {
  const [data, setData] = useState<Page<University> | null>(null); const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [error, setError] = useState('')
  useEffect(() => { publicUniversitiesApi.list({ page, page_size: 12, search: search || undefined }).then(setData).catch((requestError) => setError(getApiError(requestError))) }, [page, search])
  return <PublicLayout><main className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><div><p className="text-sm font-semibold uppercase tracking-wider text-primary">University discovery</p><h1 className="mt-2 text-4xl font-semibold">Explore universities</h1><p className="mt-3 text-muted-foreground">Browse active records before creating your student profile.</p></div><div className="relative mt-8 max-w-xl"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search by university or country" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></div>{error && <Alert className="mt-6">{error}</Alert>}{!data ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-52" />)}</div> : <><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((university) => <Card key={university.id}><CardHeader><div className="flex justify-between gap-2"><Building2 className="text-primary" /><Badge>QS #{university.ranking}</Badge></div><CardTitle className="pt-2 leading-6">{university.name}</CardTitle><CardDescription className="flex items-center gap-1"><MapPin className="size-4" />{university.country}, {university.region}</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">Academic reputation: {Number(university.academic_reputation_score).toFixed(1)}</CardContent></Card>)}</div>{data.items.length === 0 && <div className="mt-8 rounded-xl border border-dashed p-12 text-center text-muted-foreground">No universities match this search.</div>}<div className="mt-8 flex items-center justify-between"><span className="text-sm text-muted-foreground">{data.total} records</span><div className="flex gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="outline" disabled={page >= data.pages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div></>}</main></PublicLayout>
}
