import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function MatchScore({
  score,
  coverage,
  available,
  total,
  previous,
}: {
  score: number | null;
  coverage: number;
  available: number;
  total: number;
  previous?: number | null;
}) {
  if (score === null) {
    return (
      <div className="rounded-lg border border-dashed p-3 text-sm">
        <p className="font-medium">Profile match unavailable</p>
        <p className="text-muted-foreground">
          No criteria have enough reliable data to calculate a score.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>Profile Match</span>
        <strong>
          {previous != null && previous !== score && (
            <span className="mr-2 font-normal text-muted-foreground">
              {Math.round(previous)}% →
            </span>
          )}
          {Math.round(score)}%
        </strong>
      </div>
      <Progress value={score} />
      <Badge variant="outline">
        Based on {available} of {total} criteria · {Math.round(coverage * 100)}%
        coverage
      </Badge>
    </div>
  );
}
