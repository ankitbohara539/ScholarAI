import { GitCompareArrows, Trash2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCompare } from '@/hooks/useCompare'
import { studentNavigation } from '@/lib/navigation'
import type { ComparisonItem } from '@/context/compare-context'

export function ComparePage() {
  const { items, remove, clear } = useCompare()
  return <DashboardLayout title="Compare Universities" navItems={studentNavigation}><div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-3xl font-semibold">University comparison</h2><p className="mt-2 text-muted-foreground">Compare up to three selected universities. Selection is temporary for this browser tab.</p></div>{items.length > 0 && <Button variant="outline" onClick={clear}><Trash2 />Clear comparison</Button>}</div>{items.length === 0 ? <Card><CardContent className="flex min-h-64 flex-col items-center justify-center text-center text-muted-foreground"><GitCompareArrows className="mb-3 size-10" /><p className="font-medium text-foreground">No universities selected</p><p className="mt-1 text-sm">Add universities from discovery or recommendation cards.</p></CardContent></Card> : <div className="overflow-x-auto rounded-xl border bg-background"><Table><TableHeader><TableRow><TableHead className="min-w-44">Criterion</TableHead>{items.map((item) => <TableHead key={item.university.id} className="min-w-56"><div className="flex items-start justify-between gap-2"><span>{item.university.name}</span><Button size="icon" variant="ghost" aria-label={`Remove ${item.university.name}`} onClick={() => remove(item.university.id)}><Trash2 /></Button></div></TableHead>)}</TableRow></TableHeader><TableBody>{rows.map(([label, render]) => <TableRow key={label}><TableCell className="font-medium">{label}</TableCell>{items.map((item) => <TableCell key={item.university.id}>{render(item)}</TableCell>)}</TableRow>)}</TableBody></Table></div>}</div></DashboardLayout>
}

const show = (value: unknown) => value === null || value === undefined || value === '' ? 'Unavailable' : String(value)
const money = (value: string | null, currency: string | null) => value ? `${currency ?? ''} ${Number(value).toLocaleString()}`.trim() : 'Unavailable'
const rows: Array<[string, (item: ComparisonItem) => React.ReactNode]> = [
  ['Match Score', (item) => item.matchScore === null ? 'Generate recommendations first' : <Badge>{Math.round(item.matchScore)}%</Badge>],
  ['ML Score', (item) => item.mlScore === null ? 'Unavailable' : item.mlScore.toFixed(2)],
  ['Ranking', (item) => `#${item.university.ranking}`], ['Country', (item) => item.university.country], ['Region', (item) => item.university.region],
  ['Tuition', (item) => money(item.university.tuition_fee, item.university.currency)], ['Living Cost', (item) => money(item.university.estimated_living_cost, item.university.currency)],
  ['Estimated Total', (item) => item.estimatedTotal === null ? 'Unavailable' : `${item.university.currency ?? ''} ${item.estimatedTotal.toLocaleString()}`.trim()],
  ['Minimum GPA', (item) => show(item.university.minimum_gpa)], ['Minimum GRE', (item) => show(item.university.minimum_gre_score)], ['Acceptance Rate', (item) => item.university.acceptance_rate ? `${item.university.acceptance_rate}%` : 'Unavailable'],
  ['Academic Reputation', (item) => item.university.academic_reputation_score], ['Program Match', (item) => item.programMatch === null ? 'Unavailable' : `${Math.round(item.programMatch * 100)}%`],
  ['Scholarships', (item) => item.university.scholarships.some((value) => value.is_active) ? 'Available' : 'No listed scholarship'],
]
