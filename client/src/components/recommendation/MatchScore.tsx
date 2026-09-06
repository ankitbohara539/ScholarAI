import { Progress } from '@/components/ui/progress'

export function MatchScore({ score, previous }: { score: number; previous?: number }) {
  return <div className="space-y-2"><div className="flex items-center justify-between text-sm"><span>Profile Match</span><strong>{previous !== undefined && previous !== score ? <span className="mr-2 font-normal text-muted-foreground">{Math.round(previous)}% →</span> : null}{Math.round(score)}%</strong></div><Progress value={score} /></div>
}
