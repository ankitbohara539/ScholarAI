import { GitCompareArrows, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getApiError } from "@/api/axios";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompare } from "@/hooks/useCompare";
import { loadComparisonData } from "@/lib/comparisonData";
import { studentNavigation } from "@/lib/navigation";
import type { RecommendationItem } from "@/types/recommendation";
import type { University } from "@/types/university";

interface ComparisonItem {
  university: University;
  recommendation?: RecommendationItem;
}

export function ComparePage() {
  const { universityIds, remove, clear } = useCompare();
  const [universities, setUniversities] = useState<University[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    if (universityIds.length === 0) {
      setUniversities([]);
      setRecommendations([]);
      return;
    }
    setLoading(true);
    setError("");
    loadComparisonData(universityIds, controller.signal)
      .then((current) => {
        if (controller.signal.aborted) return;
        setUniversities(current.universities);
        setRecommendations(current.recommendations);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted)
          setError(
            getApiError(
              requestError,
              "Comparison data could not be refreshed.",
            ),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [universityIds]);

  const items = useMemo<ComparisonItem[]>(
    () =>
      universities.map((university) => ({
        university,
        recommendation: recommendations.find(
          (item) => item.university.id === university.id,
        ),
      })),
    [universities, recommendations],
  );

  return (
    <DashboardLayout title="Compare Universities" navItems={studentNavigation}>
      <div className="space-y-6">
        <ComparisonHeader hasItems={universityIds.length > 0} onClear={clear} />
        {error && <Alert>{error}</Alert>}
        {loading ? (
          <Skeleton className="h-72" />
        ) : (
          <ComparisonContent items={items} onRemove={remove} />
        )}
      </div>
    </DashboardLayout>
  );
}

function ComparisonHeader({
  hasItems,
  onClear,
}: {
  hasItems: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-3xl font-semibold">University comparison</h2>
        <p className="mt-2 text-muted-foreground">
          Current university data is refreshed for your selected IDs.
        </p>
      </div>
      {hasItems && (
        <Button variant="outline" onClick={onClear}>
          <Trash2 />
          Clear comparison
        </Button>
      )}
    </div>
  );
}

function ComparisonContent({
  items,
  onRemove,
}: {
  items: ComparisonItem[];
  onRemove: (id: number) => void;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-64 flex-col items-center justify-center text-center text-muted-foreground">
          <GitCompareArrows className="mb-3 size-10" />
          <p className="font-medium text-foreground">
            No universities selected
          </p>
          <p className="mt-1 text-sm">
            Add universities from discovery or recommendation cards.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-44">Criterion</TableHead>
            {items.map(({ university }) => (
              <TableHead key={university.id} className="min-w-56">
                <div className="flex items-start justify-between gap-2">
                  <span>{university.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${university.name}`}
                    onClick={() => onRemove(university.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([label, render]) => (
            <TableRow key={label}>
              <TableCell className="font-medium">{label}</TableCell>
              {items.map((item) => (
                <TableCell key={item.university.id}>{render(item)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const show = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "Not available"
    : String(value);
const money = (value: string | null, currency: string | null) => {
  if (!value) return "Not available";
  if (!currency)
    return `${Number(value).toLocaleString()} (currency unavailable)`;
  return `${currency} ${Number(value).toLocaleString()}`;
};

const rows: Array<[string, (item: ComparisonItem) => React.ReactNode]> = [
  [
    "Match Score",
    ({ recommendation }) =>
      recommendation?.match.match_score == null ? (
        "Not available"
      ) : (
        <Badge>{Math.round(recommendation.match.match_score)}%</Badge>
      ),
  ],
  [
    "Data coverage",
    ({ recommendation }) =>
      recommendation
        ? `${recommendation.match.available_criteria} of ${recommendation.match.total_criteria} criteria`
        : "Not available",
  ],
  [
    "ML Score",
    ({ recommendation }) =>
      recommendation ? recommendation.ml_score.toFixed(2) : "Not available",
  ],
  ["Ranking", ({ university }) => `#${university.ranking}`],
  ["Country", ({ university }) => university.country],
  ["Region", ({ university }) => university.region],
  [
    "Tuition",
    ({ university }) => money(university.tuition_fee, university.currency),
  ],
  [
    "Living Cost",
    ({ university }) =>
      money(university.estimated_living_cost, university.currency),
  ],
  ["Minimum GPA", ({ university }) => show(university.minimum_gpa)],
  ["Minimum GRE", ({ university }) => show(university.minimum_gre_score)],
  [
    "Acceptance Rate",
    ({ university }) =>
      university.acceptance_rate
        ? `${university.acceptance_rate}%`
        : "Not available",
  ],
  [
    "Programs",
    ({ university }) =>
      university.programs?.join(", ") || "No verified program data",
  ],
  [
    "Scholarships",
    ({ university }) =>
      university.scholarships.some((value) => value.is_active)
        ? "Available"
        : "No verified scholarship data",
  ],
];
