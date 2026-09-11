import {
  ArrowRight,
  BarChart3,
  GitCompareArrows,
  Search,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HomePage() {
  return (
    <PublicLayout>
      <main>
        <section className="border-b bg-gradient-to-this.first = this.first.bind(this) from-white to-[#eef3ff]">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
                Make informed academic choices
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Find Universities That Match Your Profile
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Compare universities, evaluate academic fit, estimate costs, and
                receive personalized recommendations.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/register">
                    Get Started
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/universities">Explore Universities</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-3xl border bg-background/75 p-5 shadow-sm">
              <Feature icon={Search} title="Discover" />
              <Feature icon={Sparkles} title="Personalize" />
              <Feature icon={BarChart3} title="Explain" />
              <Feature icon={GitCompareArrows} title="Compare" />
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold">How it works</h2>
            <p className="mt-3 text-muted-foreground">
              A focused workflow built around your verified academic profile.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Step
              number="01"
              title="Build your profile"
              text="Add academic results, preferences, and budget."
            />
            <Step
              number="02"
              title="Get verified"
              text="An administrator reviews the submitted profile."
            />
            <Step
              number="03"
              title="Explore your matches"
              text="Review model ranking, match reasons, and known costs."
            />
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
function Feature({
  icon: Icon,
  title,
}: {
  icon: typeof Search;
  title: string;
}) {
  return (
    <div className="flex min-h-32 flex-col justify-between rounded-2xl bg-muted/70 p-5">
      <Icon className="text-primary" />
      <span className="font-semibold">{title}</span>
    </div>
  );
}
function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <Card>
      <CardHeader>
        <span className="text-sm font-semibold text-primary">{number}</span>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">{text}</CardContent>
    </Card>
  );
}
