import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AboutPage() {
  return (
    <PublicLayout>
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            About ScholarAI
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Efficient university discovery
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            ScholarAI is an project that combines verified dtudent data,
             university information, model-assisted ranking, and an
            explainable deterministic match score.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>What it does</CardTitle>
            </CardHeader>
            <CardContent className="leading-7 text-muted-foreground">
              Helps students browse, compare, simulate profile changes, and
              understand why a university may fit.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>What it does not do</CardTitle>
            </CardHeader>
            <CardContent className="leading-7 text-muted-foreground">
              It does not guarantee admission, scholarship awards, or replace
              official university guidance.
            </CardContent>
          </Card>
        </div>
      </main>
    </PublicLayout>
  );
}
