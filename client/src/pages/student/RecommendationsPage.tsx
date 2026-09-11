import { LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { getApiError } from "@/api/axios";
import { profileApi } from "@/api/profile.api";
import { recommendationsApi } from "@/api/recommendations.api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RecommendationCard } from "@/components/recommendation/RecommendationCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { studentNavigation } from "@/lib/navigation";
import type { StudentProfile } from "@/types/profile";
import type { RecommendationList } from "@/types/recommendation";

export function RecommendationsPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [data, setData] = useState<RecommendationList | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([profileApi.get(), recommendationsApi.latest()])
      .then(([nextProfile, recommendations]) => {
        setProfile(nextProfile);
        setData(recommendations);
      })
      .catch((requestError) => setError(getApiError(requestError)))
      .finally(() => setLoading(false));
  }, []);
  async function generate() {
    setGenerating(true);
    setError("");
    try {
      setData(await recommendationsApi.generate(10));
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setGenerating(false);
    }
  }
  return (
    <DashboardLayout title="Recommendations" navItems={studentNavigation}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">
              University recommendations
            </h2>
            <p className="mt-2 text-muted-foreground">
              Model ranking and an independently explainable profile match are
              shown separately.
            </p>
          </div>
          <Button
            disabled={generating || profile?.verification_status !== "verified"}
            onClick={() => void generate()}
          >
            {generating ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            Generate recommendations
          </Button>
        </div>
        {error && <Alert>{error}</Alert>}
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        ) : profile?.verification_status !== "verified" ? (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <div className="flex items-center gap-2 font-semibold">
              <StatusBadge status={profile?.verification_status ?? "draft"} />
              Verification required
            </div>
            <p className="mt-2">
              Complete and submit your profile, then wait for administrator
              verification.
            </p>
          </Alert>
        ) : null}
        {data?.generated_at && (
          <p className="text-sm text-muted-foreground">
            Latest generation: {new Date(data.generated_at).toLocaleString()} ·{" "}
            {data.model_version}
          </p>
        )}
        <div className="grid gap-5 lg:grid-cols-2">
          {data?.recommendations.map((item) => (
            <RecommendationCard key={item.university.id} item={item} />
          ))}
        </div>
        {data && data.recommendations.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            No recommendation generation is available yet.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
