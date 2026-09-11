import { FlaskConical, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getApiError } from "@/api/axios";
import { profileApi } from "@/api/profile.api";
import { recommendationsApi } from "@/api/recommendations.api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RecommendationCard } from "@/components/recommendation/RecommendationCard";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { studentNavigation } from "@/lib/navigation";
import { isLatestRequest } from "@/lib/latestRequest";
import type {
  RecommendationList,
  SimulationInput,
} from "@/types/recommendation";

interface SimulatorValues {
  gpa: number;
  gre_score: number;
  budget: number;
  budget_currency: string;
}

export function SimulatorPage() {
  const [values, setValues] = useState<SimulatorValues>({
    gpa: 0,
    gre_score: 260,
    budget: 0,
    budget_currency: "",
  });
  const [baseline, setBaseline] = useState<RecommendationList | null>(null);
  const [result, setResult] = useState<RecommendationList | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);

  useEffect(() => {
    Promise.all([profileApi.get(), recommendationsApi.latest()])
      .then(([profile, latest]) => {
        setValues({
          gpa: Number(profile.gpa ?? 0),
          gre_score: profile.gre_score ?? 260,
          budget: Number(profile.max_tuition_budget ?? 0),
          budget_currency: profile.budget_currency ?? "",
        });
        setBaseline(latest);
        setReady(profile.verification_status === "verified");
      })
      .catch((requestError) => setError(getApiError(requestError)));
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      controller.current?.abort();
    };
  }, []);

  function schedule(next: SimulatorValues) {
    setValues(next);
    if (!ready) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void simulate(next), 450);
  }

  async function simulate(input = values) {
    controller.current?.abort();
    const requestController = new AbortController();
    controller.current = requestController;
    const requestId = ++sequence.current;
    setLoading(true);
    setError("");
    const payload: SimulationInput = {
      ...input,
      budget_currency: input.budget_currency || undefined,
      top_k: 6,
    };
    try {
      const next = await recommendationsApi.simulate(
        payload,
        requestController.signal,
      );
      if (isLatestRequest(requestId, sequence.current)) setResult(next);
    } catch (requestError) {
      if (!requestController.signal.aborted && isLatestRequest(requestId, sequence.current)) {
        setError(getApiError(requestError, "Simulation failed."));
      }
    } finally {
      if (isLatestRequest(requestId, sequence.current)) setLoading(false);
    }
  }

  const previous = new Map(
    baseline?.recommendations.map((item) => [
      item.university.id,
      item.match.match_score,
    ]),
  );
  return (
    <DashboardLayout title="What-If Simulator" navItems={studentNavigation}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold">
            What if your profile changed?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Try temporary values without modifying your saved or verified
            profile.
          </p>
        </div>
        {!ready && (
          <Alert>Verify your student profile before running simulations.</Alert>
        )}
        {error && <Alert>{error}</Alert>}
        <SimulatorControls
          values={values}
          ready={ready}
          loading={loading}
          onChange={schedule}
          onRun={() => void simulate()}
        />
        {loading && !result ? (
          <Skeleton className="h-72" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {result?.recommendations.map((item) => (
              <RecommendationCard
                key={item.university.id}
                item={item}
                previousScore={previous.get(item.university.id)}
              />
            ))}
          </div>
        )}
        {result && result.recommendations.length === 0 && (
          <Alert>
            No universities meet these simulated constraints. Try changing the
            academic inputs.
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
}

function SimulatorControls({
  values,
  ready,
  loading,
  onChange,
  onRun,
}: {
  values: SimulatorValues;
  ready: boolean;
  loading: boolean;
  onChange: (value: SimulatorValues) => void;
  onRun: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="text-primary" />
          Simulation inputs
        </CardTitle>
        <CardDescription>
          Results refresh 450 ms after you stop changing a value.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-4">
        <SimulatorField
          label="GPA"
          value={values.gpa}
          min={0}
          max={4}
          step={0.05}
          onChange={(gpa) => onChange({ ...values, gpa })}
        />
        <SimulatorField
          label="GRE score"
          value={values.gre_score}
          min={260}
          max={340}
          step={1}
          onChange={(gre_score) => onChange({ ...values, gre_score })}
        />
        <SimulatorField
          label="Tuition budget"
          value={values.budget}
          min={0}
          max={100000}
          step={1000}
          onChange={(budget) => onChange({ ...values, budget })}
        />
        <div className="space-y-3">
          <Label htmlFor="simulator-currency">Budget currency</Label>
          <Input
            id="simulator-currency"
            maxLength={3}
            placeholder="USD"
            value={values.budget_currency}
            onChange={(event) =>
              onChange({
                ...values,
                budget_currency: event.target.value.toUpperCase(),
              })
            }
          />
        </div>
        <div className="md:col-span-4">
          <Button disabled={!ready || loading} onClick={onRun}>
            {loading ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <FlaskConical />
            )}
            Run simulation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SimulatorField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Input
          className="h-9 w-28"
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
      <Slider
        aria-label={`${label} slider`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
