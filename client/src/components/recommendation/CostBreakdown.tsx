import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { CostEstimate } from '@/types/recommendation'

function money(value: number | null, currency: string | null) { return value === null ? 'Unavailable' : new Intl.NumberFormat(undefined, { style: 'currency', currency: currency ?? 'USD', maximumFractionDigits: 0 }).format(value) }

export function CostBreakdown({ cost }: { cost: CostEstimate }) {
  return <div className="space-y-2 rounded-lg bg-muted/60 p-4 text-sm"><div className="flex items-center justify-between"><strong>Estimated Cost</strong>{!cost.currency && <Badge variant="outline">Currency unknown</Badge>}</div><CostRow label="Tuition" value={money(cost.tuition, cost.currency)} /><CostRow label="Living cost" value={money(cost.living_cost, cost.currency)} /><CostRow label="Application fee" value={money(cost.application_fee, cost.currency)} /><CostRow label="Potential aid" value={cost.potential_aid === null ? 'Unavailable' : `−${money(cost.potential_aid, cost.currency)}`} /><Separator /><CostRow label="Estimated total" value={money(cost.estimated_total, cost.currency)} strong /><p className="pt-1 text-xs text-muted-foreground">Scholarships are estimates based on listed criteria and are not guaranteed.</p></div>
}

function CostRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className={strong ? 'font-semibold' : ''}>{value}</span></div> }
