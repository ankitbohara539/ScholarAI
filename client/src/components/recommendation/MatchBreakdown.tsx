import { AlertCircle, CheckCircle2, MinusCircle } from "lucide-react";

import type { MatchCriterionStatus, MatchResult } from "@/types/recommendation";

const labels = {
  gpa: "GPA",
  test: "Test score",
  budget: "Budget",
  program: "Program",
};
const icons: Record<MatchCriterionStatus, typeof CheckCircle2> = {
  available: CheckCircle2,
  unknown: AlertCircle,
  not_applicable: MinusCircle,
};

export function MatchBreakdown({ match }: { match: MatchResult }) {
  return (
    <details className="group rounded-lg border">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">
        Why this matches{" "}
        <span className="float-right text-muted-foreground group-open:rotate-180">
          ⌄
        </span>
      </summary>
      <div className="space-y-3 border-t p-4">
        {Object.entries(match.breakdown).map(([key, item]) => {
          const Icon = icons[item.status];
          const label =
            item.score === null
              ? item.status.replace("_", " ")
              : `${Math.round(item.score * 100)}%`;
          return (
            <div key={key} className="flex gap-2 text-sm">
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {labels[key as keyof typeof labels]} · {label}
                </p>
                <p className="text-muted-foreground">{item.reason}</p>
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}
