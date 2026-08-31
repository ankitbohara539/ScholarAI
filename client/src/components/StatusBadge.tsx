import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const colors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700', pending: 'bg-amber-100 text-amber-800',
  verified: 'bg-emerald-100 text-emerald-800', rejected: 'bg-rose-100 text-rose-800',
  active: 'bg-emerald-100 text-emerald-800', suspended: 'bg-rose-100 text-rose-800',
  reach: 'bg-violet-100 text-violet-800', target: 'bg-blue-100 text-blue-800', safety: 'bg-emerald-100 text-emerald-800',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <Badge className={cn(colors[status] ?? 'bg-muted text-muted-foreground', className)}>{status.replaceAll('_', ' ')}</Badge>
}
