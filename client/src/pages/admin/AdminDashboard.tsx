import {
  Building2,
  CircleCheck,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { dashboardApi, type AdminDashboardData } from "@/api/dashboard.api";
import { getApiError } from "@/api/axios";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { adminNavigation } from "@/lib/navigation";

export function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi
      .admin()
      .then(setData)
      .catch((requestError) =>
        setError(getApiError(requestError, "Could not load dashboard data.")),
      );
  }, []);

  return (
    <DashboardLayout title="Admin Dashboard" navItems={adminNavigation}>
      <div className="space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Administration</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              Welcome, {user?.full_name}
            </h2>
            <p className="mt-2 text-muted-foreground">
              Live Stats
            </p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800">
            System operational
          </Badge>
        </div>
        {error && <Alert>{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AdminMetric
            icon={Users}
            title="Total Students"
            value={data?.total_students}
            note="Non-deleted student accounts"
          />
          <AdminMetric
            icon={UserCheck}
            title="Pending Verification"
            value={data?.pending_verification}
            note="Profiles awaiting review"
          />
          <AdminMetric
            icon={CircleCheck}
            title="Verified Students"
            value={data?.verified_students}
            note="Approved student profiles"
          />
          <AdminMetric
            icon={ShieldAlert}
            title="Suspended Students"
            value={data?.suspended_students}
            note="Accounts without protected access"
          />
          <AdminMetric
            icon={Building2}
            title="Total Universities"
            value={data?.total_universities}
            note="Non-deleted university records"
          />
          <AdminMetric
            icon={Building2}
            title="Active Universities"
            value={data?.active_universities}
            note="Visible to students and ML"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function AdminMetric({
  icon: Icon,
  title,
  value,
  note,
}: {
  icon: typeof Users;
  title: string;
  value: number | undefined;
  note: string;
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
        <p className="mt-2 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
