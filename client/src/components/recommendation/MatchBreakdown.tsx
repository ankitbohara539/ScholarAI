import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { MatchResult } from '@/types/recommendation'

const labels = { gpa: 'GPA', test: 'Test score', budget: 'Budget', program: 'Program' }

export function MatchBreakdown({ match }: { match: MatchResult }) {
  return <details className="group rounded-lg border"><summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">Why this matches <span className="float-right text-muted-foreground group-open:rotate-180">⌄</span></summary><div className="space-y-3 border-t p-4">{Object.entries(match.breakdown).map(([key, item]) => <div key={key} className="flex gap-2 text-sm">{item.score >= 0.7 ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />}<div><p className="font-medium">{labels[key as keyof typeof labels]} · {Math.round(item.score * 100)}%</p><p className="text-muted-foreground">{item.reason}</p></div></div>)}</div></details>
}
