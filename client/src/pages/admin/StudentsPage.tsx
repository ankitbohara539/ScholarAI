import { MoreHorizontal, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  adminStudentsApi,
  type StudentFilters,
} from "@/api/admin-students.api";
import { getApiError } from "@/api/axios";
import { StatusBadge } from "@/components/StatusBadge";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Alert } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { adminNavigation } from "@/lib/navigation";
import type {
  AdminStudent,
  AdminStudentDetail,
  AdminStudentPage,
} from "@/types/admin";
import type { VerificationStatus } from "@/types/profile";

type ConfirmAction = "suspend" | "reactivate" | "delete";

export function StudentsPage() {
  const [data, setData] = useState<AdminStudentPage | null>(null);
  const [filters, setFilters] = useState<StudentFilters>({
    page: 1,
    page_size: 20,
  });
  const [selected, setSelected] = useState<AdminStudent | null>(null);
  const [detail, setDetail] = useState<AdminStudentDetail | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      adminStudentsApi
        .list(filters)
        .then(setData)
        .catch((requestError) => setError(getApiError(requestError))),
    [filters],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const patchFilters = (next: Partial<StudentFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...next }));

  async function view(student: AdminStudent) {
    setSelected(student);
    try {
      setDetail(await adminStudentsApi.get(student.id));
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }
  async function verify(student: AdminStudent) {
    try {
      await adminStudentsApi.verify(student.id);
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }
  async function reject() {
    if (!selected) return;
    try {
      await adminStudentsApi.reject(selected.id, rejectReason);
      setRejectOpen(false);
      setRejectReason("");
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }
  async function confirm() {
    if (!selected || !confirmAction) return;
    try {
      if (confirmAction === "suspend")
        await adminStudentsApi.suspend(selected.id);
      else if (confirmAction === "reactivate")
        await adminStudentsApi.reactivate(selected.id);
      else await adminStudentsApi.remove(selected.id);
      setConfirmAction(null);
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }

  return (
    <DashboardLayout title="Student Management" navItems={adminNavigation}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold">Students</h2>
          <p className="mt-2 text-muted-foreground">
            Review verification submissions and manage account access.
          </p>
        </div>
        {error && <Alert>{error}</Alert>}
        <Card>
          <CardContent className="grid gap-3 pt-6 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name or email"
                value={filters.search ?? ""}
                onChange={(e) =>
                  patchFilters({ search: e.target.value || undefined })
                }
              />
            </div>
            <Select
              value={filters.verification_status ?? "all"}
              onValueChange={(value) =>
                patchFilters({
                  verification_status:
                    value === "all" ? undefined : (value as VerificationStatus),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Verification status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All verification states</SelectItem>
                {["draft", "pending", "verified", "rejected"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.account_status ?? "all"}
              onValueChange={(value) =>
                patchFilters({
                  account_status:
                    value === "all"
                      ? undefined
                      : (value as "active" | "suspended"),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All account states</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <p className="font-medium">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.email}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="w-28 space-y-1">
                      <Progress value={student.profile_completion_percentage} />
                      <span className="text-xs">
                        {student.profile_completion_percentage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={student.verification_status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={student.account_status} />
                  </TableCell>
                  <TableCell>
                    {new Date(student.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => void view(student)}>
                          View profile
                        </DropdownMenuItem>
                        {student.verification_status === "pending" && (
                          <>
                            <DropdownMenuItem
                              onSelect={() => void verify(student)}
                            >
                              Verify
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setSelected(student);
                                setRejectOpen(true);
                              }}
                            >
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {student.account_status === "active" ? (
                          <DropdownMenuItem
                            onSelect={() => {
                              setSelected(student);
                              setConfirmAction("suspend");
                            }}
                          >
                            Suspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onSelect={() => {
                              setSelected(student);
                              setConfirmAction("reactivate");
                            }}
                          >
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => {
                            setSelected(student);
                            setConfirmAction("delete");
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data?.items.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No students match these filters.
            </div>
          )}
        </Card>
        <Pagination
          page={data?.page ?? 1}
          pages={data?.pages ?? 0}
          onPage={(page) => setFilters((current) => ({ ...current, page }))}
        />
      </div>
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.full_name}</DialogTitle>
            <DialogDescription>{detail?.email}</DialogDescription>
          </DialogHeader>
          {detail?.profile ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <StatusBadge status={detail.profile.verification_status} />
                <StatusBadge status={detail.account_status} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Info
                  label="Academic field"
                  value={detail.profile.academic_field}
                />
                <Info
                  label="GPA / GRE / TOEFL"
                  value={`${detail.profile.gpa ?? "—"} / ${detail.profile.gre_score ?? "—"} / ${detail.profile.toefl_score ?? "—"}`}
                />
                <Info
                  label="SOP / LOR"
                  value={`${detail.profile.sop_rating ?? "—"} / ${detail.profile.lor_rating ?? "—"}`}
                />
                <Info
                  label="Research"
                  value={detail.profile.has_research ? "Yes" : "No"}
                />
                <Info
                  label="Preferred location"
                  value={`${detail.profile.preferred_country ?? "—"}, ${detail.profile.preferred_region ?? "—"}`}
                />
                <Info
                  label="Degree level"
                  value={detail.profile.preferred_degree_level}
                />
              </div>
              {detail.profile.rejection_reason && (
                <Alert>{detail.profile.rejection_reason}</Alert>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">
              This student has not started a profile.
            </p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject profile</DialogTitle>
            <DialogDescription>
              Explain what the student needs to correct before resubmitting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection reason</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectReason.trim().length < 5}
              onClick={() => void reject()}
            >
              Reject profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {confirmAction}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "delete"
                ? "This preserves historical data but prevents login and removes the student from normal lists."
                : `This will ${confirmAction} the selected student account.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirm()}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "—"}</p>
    </div>
  );
}
function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {pages || 1}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
