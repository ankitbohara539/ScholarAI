import { Building2, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { CompareButton } from '@/components/recommendation/CompareButton'
import { CostBreakdown } from '@/components/recommendation/CostBreakdown'
import { MatchBreakdown } from '@/components/recommendation/MatchBreakdown'
import { MatchScore } from '@/components/recommendation/MatchScore'
import type { RecommendationItem } from '@/types/recommendation'

export function RecommendationCard({ item, previousScore }: { item: RecommendationItem; previousScore?: number }) {
  return <Card><CardHeader><div className="flex items-start justify-between gap-3"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Building2 /></span><div className="flex flex-wrap justify-end gap-2"><Badge>#{item.rank}</Badge><StatusBadge status={item.category} /></div></div><CardTitle className="pt-3">{item.university.name}</CardTitle><CardDescription className="flex items-center gap-1"><MapPin className="size-4" />{item.university.country}, {item.university.region}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between text-sm"><span>ML recommendation score</span><Badge variant="outline">{item.ml_score.toFixed(2)}</Badge></div><MatchScore score={item.match.match_score} previous={previousScore} /><MatchBreakdown match={item.match} /><CostBreakdown cost={item.cost} /><CompareButton item={item} /></CardContent></Card>
}
