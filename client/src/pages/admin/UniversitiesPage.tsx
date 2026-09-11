import { Building2, MoreHorizontal, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { getApiError } from "@/api/axios";
import {
  universitiesApi,
  type UniversityFilters,
} from "@/api/universities.api";
import { ScholarshipManager } from "@/components/admin/ScholarshipManager";
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
import { Badge } from "@/components/ui/badge";
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
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { adminNavigation } from "@/lib/navigation";
import type { Page, University, UniversityInput } from "@/types/university";

const emptyForm: UniversityInput = {
  name: "",
  country: "",
  region: "",
  city: null,
  website_url: null,
  ranking: 1,
  academic_reputation_score: 0,
  minimum_gpa: null,
  minimum_gre_score: null,
  tuition_fee: null,
  estimated_living_cost: null,
  application_fee: null,
  currency: null,
  acceptance_rate: null,
  programs: null,
  university_type: null,
  degree_levels: null,
  description: null,
};

export function AdminUniversitiesPage() {
  const [data, setData] = useState<Page<University> | null>(null);
  const [filters, setFilters] = useState<UniversityFilters>({
    page: 1,
    page_size: 20,
  });
  const [editing, setEditing] = useState<University | "new" | null>(null);
  const [form, setForm] = useState<UniversityInput>(emptyForm);
  const [deleting, setDeleting] = useState<University | null>(null);
  const [scholarshipUniversity, setScholarshipUniversity] =
    useState<University | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const debouncedFilters = useDebouncedValue(filters);

  const load = useCallback(async () => {
    try {
      setData(await universitiesApi.adminList(filters));
      setError("");
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    universitiesApi
      .adminList(debouncedFilters, controller.signal)
      .then(setData)
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(getApiError(requestError));
      });
    return () => controller.abort();
  }, [debouncedFilters]);

  function patchFilters(next: Partial<UniversityFilters>) {
    setFilters((current) => ({ ...current, page: 1, ...next }));
  }

  function openCreate() {
    setForm(emptyForm);
    setEditing("new");
  }

  function openEdit(university: University) {
    setForm({
      name: university.name,
      country: university.country,
      region: university.region,
      city: university.city,
      website_url: university.website_url,
      ranking: university.ranking,
      academic_reputation_score: Number(university.academic_reputation_score),
      minimum_gpa: university.minimum_gpa
        ? Number(university.minimum_gpa)
        : null,
      minimum_gre_score: university.minimum_gre_score,
      tuition_fee: university.tuition_fee
        ? Number(university.tuition_fee)
        : null,
      estimated_living_cost: university.estimated_living_cost
        ? Number(university.estimated_living_cost)
        : null,
      application_fee: university.application_fee
        ? Number(university.application_fee)
        : null,
      currency: university.currency,
      acceptance_rate: university.acceptance_rate
        ? Number(university.acceptance_rate)
        : null,
      programs: university.programs,
      university_type: university.university_type,
      degree_levels: university.degree_levels,
      description: university.description,
      is_active: university.is_active,
    });
    setEditing(university);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing === "new") await universitiesApi.create(form);
      else if (editing) await universitiesApi.update(editing.id, form);
      setEditing(null);
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(university: University) {
    try {
      await universitiesApi.update(university.id, {
        is_active: !university.is_active,
      });
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }

  async function remove() {
    if (!deleting) return;
    try {
      await universitiesApi.remove(deleting.id);
      setDeleting(null);
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }

  return (
    <DashboardLayout title="University Management" navItems={adminNavigation}>
      <div className="space-y-6">
        <PageHeader onCreate={openCreate} />
        {error && <Alert>{error}</Alert>}
        <UniversityFilterCard filters={filters} onChange={patchFilters} />
        <UniversityTable
          data={data}
          onEdit={openEdit}
          onScholarships={setScholarshipUniversity}
          onToggle={toggle}
          onDelete={setDeleting}
        />
        <Pagination data={data} filters={filters} onChange={setFilters} />
      </div>
      <UniversityFormDialog
        editing={editing}
        form={form}
        saving={saving}
        setForm={setForm}
        onClose={() => setEditing(null)}
        onSubmit={save}
      />
      <ScholarshipManager
        university={scholarshipUniversity}
        onClose={() => setScholarshipUniversity(null)}
      />
      <UniversityDeleteDialog
        university={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
    </DashboardLayout>
  );
}

function PageHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-3xl font-semibold">Universities</h2>
        <p className="mt-2 text-muted-foreground">
          Manage QS records and optional administrative enrichment.
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus />
        Add university
      </Button>
    </div>
  );
}

function UniversityFilterCard({
  filters,
  onChange,
}: {
  filters: UniversityFilters;
  onChange: (value: Partial<UniversityFilters>) => void;
}) {
  return (
    <Card>
      <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search"
            value={filters.search ?? ""}
            onChange={(event) =>
              onChange({ search: event.target.value || undefined })
            }
          />
        </div>
        <Input
          placeholder="Country"
          value={filters.country ?? ""}
          onChange={(event) =>
            onChange({ country: event.target.value || undefined })
          }
        />
        <Input
          placeholder="Region"
          value={filters.region ?? ""}
          onChange={(event) =>
            onChange({ region: event.target.value || undefined })
          }
        />
        <Select
          value={
            filters.is_active === undefined ? "all" : String(filters.is_active)
          }
          onValueChange={(value) =>
            onChange({
              is_active: value === "all" ? undefined : value === "true",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

function UniversityTable({
  data,
  onEdit,
  onScholarships,
  onToggle,
  onDelete,
}: {
  data: Page<University> | null;
  onEdit: (item: University) => void;
  onScholarships: (item: University) => void;
  onToggle: (item: University) => void;
  onDelete: (item: University) => void;
}) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>University</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>QS rank</TableHead>
            <TableHead>Reputation</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.items.map((university) => (
            <TableRow key={university.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Building2 className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium">{university.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {university.university_type ?? "Type not available"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {university.country}
                <p className="text-xs text-muted-foreground">
                  {university.region}
                </p>
              </TableCell>
              <TableCell>
                #{university.ranking}
                <p className="text-xs text-muted-foreground">Source: QS</p>
              </TableCell>
              <TableCell>
                {Number(university.academic_reputation_score).toFixed(1)}
                <p className="text-xs text-muted-foreground">Source: QS</p>
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    university.is_active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }
                >
                  {university.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <UniversityActions
                  university={university}
                  onEdit={onEdit}
                  onScholarships={onScholarships}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data?.items.length === 0 && (
        <div className="p-12 text-center text-muted-foreground">
          No universities match these filters.
        </div>
      )}
    </Card>
  );
}

function UniversityActions({
  university,
  onEdit,
  onScholarships,
  onToggle,
  onDelete,
}: {
  university: University;
  onEdit: (item: University) => void;
  onScholarships: (item: University) => void;
  onToggle: (item: University) => void;
  onDelete: (item: University) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(university)}>
          View / edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onScholarships(university)}>
          Manage scholarships
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void onToggle(university)}>
          {university.is_active ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onSelect={() => onDelete(university)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Pagination({
  data,
  filters,
  onChange,
}: {
  data: Page<University> | null;
  filters: UniversityFilters;
  onChange: React.Dispatch<React.SetStateAction<UniversityFilters>>;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {data?.total ?? 0} universities
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={(data?.page ?? 1) <= 1}
          onClick={() =>
            onChange({ ...filters, page: (filters.page ?? 1) - 1 })
          }
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={!data || data.page >= data.pages}
          onClick={() =>
            onChange({ ...filters, page: (filters.page ?? 1) + 1 })
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function UniversityFormDialog({
  editing,
  form,
  saving,
  setForm,
  onClose,
  onSubmit,
}: {
  editing: University | "new" | null;
  form: UniversityInput;
  saving: boolean;
  setForm: (value: UniversityInput) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Dialog open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing === "new" ? "Add university" : "Edit university"}
          </DialogTitle>
          <DialogDescription>
            QS fields can be enriched with verified admission, cost, and program
            data.
          </DialogDescription>
        </DialogHeader>
        <UniversityForm
          value={form}
          setValue={setForm}
          onSubmit={onSubmit}
          saving={saving}
        />
      </DialogContent>
    </Dialog>
  );
}

function UniversityDeleteDialog({
  university,
  onClose,
  onConfirm,
}: {
  university: University | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <AlertDialog
      open={university !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Soft delete university?</AlertDialogTitle>
          <AlertDialogDescription>
            The record remains for historical recommendations but disappears
            from browsing and future recommendations.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onConfirm()}>
            Soft delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function UniversityForm({
  value,
  setValue,
  onSubmit,
  saving,
}: {
  value: UniversityInput;
  setValue: (value: UniversityInput) => void;
  onSubmit: (event: FormEvent) => void;
  saving: boolean;
}) {
  const number = (key: keyof UniversityInput, input: string) =>
    setValue({ ...value, [key]: input ? Number(input) : null });
  const list = (input: string) =>
    input
      ? input
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : null;
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
      <Field label="Name">
        <Input
          value={value.name}
          onChange={(event) => setValue({ ...value, name: event.target.value })}
          required
        />
      </Field>
      <Field label="Country">
        <Input
          value={value.country}
          onChange={(event) =>
            setValue({ ...value, country: event.target.value })
          }
          required
        />
      </Field>
      <Field label="Region">
        <Input
          value={value.region}
          onChange={(event) =>
            setValue({ ...value, region: event.target.value })
          }
          required
        />
      </Field>
      <Field label="City">
        <Input
          value={value.city ?? ""}
          onChange={(event) =>
            setValue({ ...value, city: event.target.value || null })
          }
        />
      </Field>
      <Field label="QS ranking">
        <Input
          type="number"
          min="1"
          value={value.ranking}
          onChange={(event) => number("ranking", event.target.value)}
          required
        />
      </Field>
      <Field label="Academic reputation">
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={value.academic_reputation_score}
          onChange={(event) =>
            number("academic_reputation_score", event.target.value)
          }
          required
        />
      </Field>
      <Field label="Minimum GPA">
        <Input
          type="number"
          min="0"
          max="4"
          step="0.01"
          value={value.minimum_gpa ?? ""}
          onChange={(event) => number("minimum_gpa", event.target.value)}
        />
      </Field>
      <Field label="Minimum GRE">
        <Input
          type="number"
          min="260"
          max="340"
          value={value.minimum_gre_score ?? ""}
          onChange={(event) => number("minimum_gre_score", event.target.value)}
        />
      </Field>
      <Field label="Tuition fee">
        <Input
          type="number"
          min="0"
          value={value.tuition_fee ?? ""}
          onChange={(event) => number("tuition_fee", event.target.value)}
        />
      </Field>
      <Field label="Estimated living cost">
        <Input
          type="number"
          min="0"
          value={value.estimated_living_cost ?? ""}
          onChange={(event) =>
            number("estimated_living_cost", event.target.value)
          }
        />
      </Field>
      <Field label="Application fee">
        <Input
          type="number"
          min="0"
          value={value.application_fee ?? ""}
          onChange={(event) => number("application_fee", event.target.value)}
        />
      </Field>
      <Field label="Currency (ISO code)">
        <Input
          maxLength={3}
          placeholder="USD"
          value={value.currency ?? ""}
          onChange={(event) =>
            setValue({
              ...value,
              currency: event.target.value.toUpperCase() || null,
            })
          }
        />
      </Field>
      <Field label="Acceptance rate (%)">
        <Input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={value.acceptance_rate ?? ""}
          onChange={(event) => number("acceptance_rate", event.target.value)}
        />
      </Field>
      <Field label="University type">
        <Input
          value={value.university_type ?? ""}
          onChange={(event) =>
            setValue({ ...value, university_type: event.target.value || null })
          }
        />
      </Field>
      <Field label="Website URL">
        <Input
          type="url"
          value={value.website_url ?? ""}
          onChange={(event) =>
            setValue({ ...value, website_url: event.target.value || null })
          }
        />
      </Field>
      <Field label="Degree levels (comma separated)">
        <Input
          value={value.degree_levels?.join(", ") ?? ""}
          onChange={(event) =>
            setValue({ ...value, degree_levels: list(event.target.value) })
          }
        />
      </Field>
      <Field label="Programs (comma separated)">
        <Input
          value={value.programs?.join(", ") ?? ""}
          onChange={(event) =>
            setValue({ ...value, programs: list(event.target.value) })
          }
        />
      </Field>
      <div className="space-y-2 sm:col-span-2">
        <Label>Description</Label>
        <Textarea
          value={value.description ?? ""}
          onChange={(event) =>
            setValue({ ...value, description: event.target.value || null })
          }
        />
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button disabled={saving}>
          {saving ? "Saving..." : "Save university"}
        </Button>
      </div>
    </form>
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
