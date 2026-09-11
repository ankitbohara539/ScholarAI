import { Bell, Building2, Sparkles, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiError } from "@/api/axios";
import { dashboardApi, type StudentDashboardData } from "@/api/dashboard.api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { studentNavigation } from "@/lib/navigation";

export function StudentDashboard() {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    dashboardApi
      .student()
      .then(setData)
      .catch((requestError) =>
        setError(getApiError(requestError, "Could not load dashboard data.")),
      );
  }, []);
  return (
    <DashboardLayout title="Student Dashboard" navItems={studentNavigation}>
      <div className="space-y-7">
        <div>
          <p className="text-sm font-medium text-primary">Welcome back</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Hello, {user?.full_name}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Track your profile, verification, and recommendation progress.
          </p>
        </div>
        {error && <Alert>{error}</Alert>}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={UserRound}
            title="Profile Completion"
            value={data ? `${data.profile_completion_percentage}%` : undefined}
          />
          <MetricCard
            icon={Sparkles}
            title="Recommendations"
            value={data?.recommendations_available}
          />
          <MetricCard
            icon={Bell}
            title="Unread Notifications"
            value={data?.unread_notifications}
          />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Profile status</CardTitle>
                  <CardDescription className="mt-2">
                    Complete and verify your profile before generating matches.
                  </CardDescription>
                </div>
                {data && <StatusBadge status={data.verification_status} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={data?.profile_completion_percentage ?? 0} />
              <div className="flex justify-between text-sm">
                <span>
                  {data?.profile_completion_percentage ?? 0}% complete
                </span>
                <Button asChild size="sm">
                  <Link to="/student/profile">Manage profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5 text-primary" />
                Recent notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                <div>
                  {notifications.slice(0, 3).map((item, index) => (
                    <div key={item.id}>
                      {index > 0 && <Separator />}
                      <div className="py-3">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              University recommendations
            </CardTitle>
            <CardDescription>
              Review model ranking alongside explainable profile fit and known
              costs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/35 p-6 text-center">
              <Sparkles className="mb-3 text-primary" />
              <p className="font-medium">
                {data?.recommendations_available
                  ? `${data.recommendations_available} recommendations available`
                  : "No recommendation set generated yet"}
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/student/recommendations">View recommendations</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
function MetricCard({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof UserRound;
  title: string;
  value: number | string | undefined;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardDescription>{title}</CardDescription>
        <span className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-3xl">
          {value === undefined ? <Skeleton className="h-9 w-20" /> : value}
        </CardTitle>
      </CardContent>
    </Card>
  );
}
