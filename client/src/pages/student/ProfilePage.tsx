import { useEffect, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Send,
} from "lucide-react";

import { getApiError } from "@/api/axios";
import { profileApi } from "@/api/profile.api";
import { StatusBadge } from "@/components/StatusBadge";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { studentNavigation } from "@/lib/navigation";
import type {
  AcademicProfileInput,
  PreferenceProfileInput,
  StudentProfile,
} from "@/types/profile";

const emptyAcademic: AcademicProfileInput = {
  gpa: 0,
  gre_score: 260,
  toefl_score: 0,
  sop_rating: 1,
  lor_rating: 1,
  has_research: false,
  academic_field: "",
  academic_reputation_preference: 4,
};
const emptyPreferences: PreferenceProfileInput = {
  preferred_country: "",
  preferred_region: "",
  preferred_city: null,
  preferred_degree_level: "",
  max_tuition_budget: null,
  budget_currency: null,
  preferred_university_type: null,
};

export function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [step, setStep] = useState(1);
  const [academic, setAcademic] = useState(emptyAcademic);
  const [preferences, setPreferences] = useState(emptyPreferences);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profileApi
      .get()
      .then((value) => {
        setProfile(value);
        setAcademic({
          gpa: Number(value.gpa ?? 0),
          gre_score: value.gre_score ?? 260,
          toefl_score: value.toefl_score ?? 0,
          sop_rating: Number(value.sop_rating ?? 1),
          lor_rating: Number(value.lor_rating ?? 1),
          has_research: value.has_research ?? false,
          academic_field: value.academic_field ?? "",
          academic_reputation_preference:
            value.academic_reputation_preference ?? 4,
        });
        setPreferences({
          preferred_country: value.preferred_country ?? "",
          preferred_region: value.preferred_region ?? "",
          preferred_city: value.preferred_city,
          preferred_degree_level: value.preferred_degree_level ?? "",
          max_tuition_budget: value.max_tuition_budget
            ? Number(value.max_tuition_budget)
            : null,
          budget_currency: value.budget_currency,
          preferred_university_type: value.preferred_university_type,
        });
      })
      .catch((requestError) => setError(getApiError(requestError)));
  }, []);
  const locked =
    profile?.verification_status === "pending" ||
    profile?.verification_status === "verified";

  async function saveAcademic(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const value = await profileApi.saveAcademic(academic);
      setProfile(value);
      setMessage("Academic information saved.");
      setStep(2);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  }
  async function savePreferences(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const value = await profileApi.savePreferences(preferences);
      setProfile(value);
      setMessage("University preferences saved.");
      setStep(3);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  }
  async function submit() {
    setSaving(true);
    setError("");
    try {
      setProfile(await profileApi.submit());
      setMessage("Profile submitted for administrator verification.");
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (!profile && !error)
    return (
      <DashboardLayout title="Student Profile" navItems={studentNavigation}>
        <Skeleton className="h-[34rem] w-full" />
      </DashboardLayout>
    );
  return (
    <DashboardLayout title="Student Profile" navItems={studentNavigation}>
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Profile completion</CardTitle>
                <CardDescription className="mt-2">
                  Progress is saved after every step and restored when you
                  return.
                </CardDescription>
              </div>
              {profile && <StatusBadge status={profile.verification_status} />}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={profile?.profile_completion_percentage ?? 0} />
            <p className="text-sm text-muted-foreground">
              {profile?.profile_completion_percentage ?? 0}% complete
            </p>
            {profile?.rejection_reason && (
              <Alert>
                <strong>Administrator feedback:</strong>{" "}
                {profile.rejection_reason}
              </Alert>
            )}
            {locked && (
              <Alert className="border-primary/30 bg-primary/5 text-foreground">
                Core profile fields are locked while the profile is{" "}
                {profile?.verification_status}.
              </Alert>
            )}
          </CardContent>
        </Card>
        {error && <Alert>{error}</Alert>}
        {message && (
          <Alert className="border-emerald-300 bg-emerald-50 text-emerald-800">
            {message}
          </Alert>
        )}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          {["Academic", "Preferences", "Review"].map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index + 1)}
              className={`rounded-lg border p-3 ${step === index + 1 ? "border-primary bg-primary/5 font-semibold text-primary" : "bg-background text-muted-foreground"}`}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>
        {step === 1 && (
          <AcademicForm
            value={academic}
            setValue={setAcademic}
            onSubmit={saveAcademic}
            saving={saving}
            locked={locked}
          />
        )}
        {step === 2 && (
          <PreferencesForm
            value={preferences}
            setValue={setPreferences}
            onSubmit={savePreferences}
            saving={saving}
            locked={locked}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review and submit</CardTitle>
              <CardDescription>
                Submission is available once all required fields reach 100%
                completion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Review
                  label="Academic field"
                  value={profile?.academic_field}
                />
                <Review
                  label="GPA / GRE / TOEFL"
                  value={`${profile?.gpa ?? "—"} / ${profile?.gre_score ?? "—"} / ${profile?.toefl_score ?? "—"}`}
                />
                <Review
                  label="Preferred location"
                  value={[profile?.preferred_country, profile?.preferred_region]
                    .filter(Boolean)
                    .join(", ")}
                />
                <Review
                  label="Degree level"
                  value={profile?.preferred_degree_level}
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft />
                  Back
                </Button>
                <Button
                  disabled={
                    saving ||
                    locked ||
                    profile?.profile_completion_percentage !== 100
                  }
                  onClick={() => void submit()}
                >
                  {saving ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Send />
                  )}
                  Submit for verification
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function AcademicForm({
  value,
  setValue,
  onSubmit,
  saving,
  locked,
}: {
  value: AcademicProfileInput;
  setValue: (value: AcademicProfileInput) => void;
  onSubmit: (event: FormEvent) => void;
  saving: boolean;
  locked?: boolean;
}) {
  const number = (key: keyof AcademicProfileInput, next: string) =>
    setValue({ ...value, [key]: Number(next) });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Academic information</CardTitle>
        <CardDescription>
          These fields map directly to the saved recommendation model.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
          <Field label="GPA">
            <Input
              type="number"
              min="0"
              max="4"
              step="0.001"
              value={value.gpa}
              onChange={(e) => number("gpa", e.target.value)}
              disabled={locked}
              required
            />
          </Field>
          <Field label="GRE score">
            <Input
              type="number"
              min="260"
              max="340"
              value={value.gre_score}
              onChange={(e) => number("gre_score", e.target.value)}
              disabled={locked}
              required
            />
          </Field>
          <Field label="TOEFL score">
            <Input
              type="number"
              min="0"
              max="120"
              value={value.toefl_score}
              onChange={(e) => number("toefl_score", e.target.value)}
              disabled={locked}
              required
            />
          </Field>
          <Field label="Academic field">
            <Input
              value={value.academic_field}
              onChange={(e) =>
                setValue({ ...value, academic_field: e.target.value })
              }
              disabled={locked}
              required
            />
          </Field>
          <Field label="Statement of purpose rating">
            <Input
              type="number"
              min="1"
              max="5"
              step="0.5"
              value={value.sop_rating}
              onChange={(e) => number("sop_rating", e.target.value)}
              disabled={locked}
              required
            />
          </Field>
          <Field label="Letter of recommendation rating">
            <Input
              type="number"
              min="1"
              max="5"
              step="0.5"
              value={value.lor_rating}
              onChange={(e) => number("lor_rating", e.target.value)}
              disabled={locked}
              required
            />
          </Field>
          <Field label="Research experience">
            <Select
              value={String(value.has_research)}
              onValueChange={(next) =>
                setValue({ ...value, has_research: next === "true" })
              }
              disabled={locked}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Preferred university tier">
            <Select
              value={String(value.academic_reputation_preference)}
              onValueChange={(next) =>
                setValue({
                  ...value,
                  academic_reputation_preference: Number(next),
                })
              }
              disabled={locked}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <SelectItem key={rating} value={String(rating)}>
                    Tier {rating}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2 flex justify-end">
            <Button disabled={saving || locked}>
              {saving ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <CheckCircle2 />
              )}
              Save and continue
              <ChevronRight />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PreferencesForm({
  value,
  setValue,
  onSubmit,
  saving,
  locked,
  onBack,
}: {
  value: PreferenceProfileInput;
  setValue: (value: PreferenceProfileInput) => void;
  onSubmit: (event: FormEvent) => void;
  saving: boolean;
  locked?: boolean;
  onBack: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: University preferences</CardTitle>
        <CardDescription>
          Optional budget and type preferences refine eligibility and ranking.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
          <Field label="Preferred country">
            <Input
              value={value.preferred_country}
              onChange={(e) =>
                setValue({ ...value, preferred_country: e.target.value })
              }
              disabled={locked}
              required
            />
          </Field>
          <Field label="Preferred region">
            <Input
              value={value.preferred_region}
              onChange={(e) =>
                setValue({ ...value, preferred_region: e.target.value })
              }
              disabled={locked}
              required
            />
          </Field>
          <Field label="Preferred city (optional)">
            <Input
              value={value.preferred_city ?? ""}
              onChange={(e) =>
                setValue({ ...value, preferred_city: e.target.value || null })
              }
              disabled={locked}
            />
          </Field>
          <Field label="Degree level">
            <Input
              placeholder="Masters"
              value={value.preferred_degree_level}
              onChange={(e) =>
                setValue({ ...value, preferred_degree_level: e.target.value })
              }
              disabled={locked}
              required
            />
          </Field>
          <Field label="Maximum tuition budget (optional)">
            <Input
              type="number"
              min="0"
              value={value.max_tuition_budget ?? ""}
              onChange={(e) =>
                setValue({
                  ...value,
                  max_tuition_budget: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
              disabled={locked}
            />
          </Field>
          <Field label="Budget currency (ISO code)">
            <Input
              maxLength={3}
              placeholder="USD"
              value={value.budget_currency ?? ""}
              onChange={(e) =>
                setValue({
                  ...value,
                  budget_currency: e.target.value.toUpperCase() || null,
                })
              }
              disabled={locked}
            />
          </Field>
          <Field label="University type (optional)">
            <Input
              placeholder="Public or Private"
              value={value.preferred_university_type ?? ""}
              onChange={(e) =>
                setValue({
                  ...value,
                  preferred_university_type: e.target.value || null,
                })
              }
              disabled={locked}
            />
          </Field>
          <div className="sm:col-span-2 flex justify-between">
            <Button type="button" variant="outline" onClick={onBack}>
              <ChevronLeft />
              Back
            </Button>
            <Button disabled={saving || locked}>
              {saving ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <CheckCircle2 />
              )}
              Save and review
              <ChevronRight />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function Review({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "—"}</p>
    </div>
  );
}
