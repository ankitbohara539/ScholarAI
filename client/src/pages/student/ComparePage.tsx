import { GitCompareArrows, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getApiError } from "@/api/axios";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <ComparisonCharts items={items} />
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
    </div>
  );
}

function ComparisonCharts({ items }: { items: ComparisonItem[] }) {
  const knownTuition = items.filter(({ university }) => university.tuition_fee && university.currency);
  const currencies = new Set(knownTuition.map(({ university }) => university.currency));
  const comparableTuition = knownTuition.length >= 2 && currencies.size === 1;
  return (
    <section aria-labelledby="comparison-charts-title" className="space-y-4">
      <div>
        <h3 id="comparison-charts-title" className="text-xl font-semibold">Visual comparison</h3>
        <p className="text-sm text-muted-foreground">Bars use exact labels; unavailable values are excluded rather than estimated.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <MetricChart
          title="World ranking"
          note="Lower rank is better"
          values={items.map(({ university }) => ({ name: university.name, value: university.ranking, label: `#${university.ranking}` }))}
        />
        {comparableTuition ? (
          <MetricChart
            title={`Annual tuition (${knownTuition[0].university.currency})`}
            values={knownTuition.map(({ university }) => ({
              name: university.name,
              value: Number(university.tuition_fee),
              label: new Intl.NumberFormat(undefined, { style: "currency", currency: university.currency! }).format(Number(university.tuition_fee)),
            }))}
          />
        ) : (
          <UnavailableChart title="Annual tuition" message="Select at least two universities with tuition in the same currency for a reliable comparison." />
        )}
        <MetricChart
          title="Acceptance rate"
          values={items.flatMap(({ university }) => university.acceptance_rate == null ? [] : [{ name: university.name, value: Number(university.acceptance_rate), label: `${Number(university.acceptance_rate).toFixed(1)}%` }])}
          maximum={100}
        />
        <MetricChart
          title="Graduation rate"
          values={items.flatMap(({ university }) => university.graduation_rate == null ? [] : [{ name: university.name, value: Number(university.graduation_rate), label: `${Number(university.graduation_rate).toFixed(1)}%` }])}
          maximum={100}
        />
      </div>
    </section>
  );
}

function MetricChart({ title, note, values, maximum }: { title: string; note?: string; values: Array<{ name: string; value: number; label: string }>; maximum?: number }) {
  const max = maximum ?? Math.max(...values.map((item) => item.value), 1);
  return (
    <Card role="img" aria-label={`${title}: ${values.map((item) => `${item.name} ${item.label}`).join(", ") || "no comparable data"}`}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {values.length === 0 ? <p className="text-sm text-muted-foreground">No verified data available.</p> : values.map((item) => (
          <div key={item.name} title={`${item.name}: ${item.label}`}>
            <div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate">{item.name}</span><strong>{item.label}</strong></div>
            <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, item.value / max * 100)}%` }} /></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function UnavailableChart({ title, message }: { title: string; message: string }) {
  return <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{message}</p></CardContent></Card>;
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
    "Graduation Rate",
    ({ university }) => university.graduation_rate ? `${university.graduation_rate}%` : "Not available",
  ],
  ["Student Population", ({ university }) => university.student_population?.toLocaleString() ?? "Not available"],
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
