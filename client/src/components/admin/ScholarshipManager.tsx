import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { getApiError } from "@/api/axios";
import { scholarshipsApi, type ScholarshipInput } from "@/api/scholarships.api";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Scholarship, University } from "@/types/university";

const emptyForm: ScholarshipInput = {
  name: "",
  amount: 0,
  minimum_gpa: null,
  minimum_test_score: null,
  eligibility_description: null,
  is_active: true,
};

export function ScholarshipManager({
  university,
  onClose,
}: {
  university: University | null;
  onClose: () => void;
}) {
  const [items, setItems] = useState<Scholarship[]>([]);
  const [editing, setEditing] = useState<Scholarship | "new" | null>(null);
  const [deleting, setDeleting] = useState<Scholarship | null>(null);
  const [form, setForm] = useState<ScholarshipInput>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!university) return;
    try {
      setItems(await scholarshipsApi.list(university.id));
      setError("");
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }, [university]);

  useEffect(() => {
    if (university) void load();
  }, [university, load]);

  function openEdit(item: Scholarship) {
    setForm({
      name: item.name,
      amount: Number(item.amount),
      minimum_gpa: item.minimum_gpa ? Number(item.minimum_gpa) : null,
      minimum_test_score: item.minimum_test_score,
      eligibility_description: item.eligibility_description,
      is_active: item.is_active,
    });
    setEditing(item);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!university) return;
    setSaving(true);
    try {
      if (editing === "new") await scholarshipsApi.create(university.id, form);
      else if (editing)
        await scholarshipsApi.update(university.id, editing.id, form);
      setEditing(null);
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(item: Scholarship) {
    if (!university) return;
    try {
      await scholarshipsApi.update(university.id, item.id, {
        is_active: !item.is_active,
      });
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }

  async function remove() {
    if (!university || !deleting) return;
    try {
      await scholarshipsApi.remove(university.id, deleting.id);
      setDeleting(null);
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }

  return (
    <Dialog
      open={university !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Scholarships · {university?.name}</DialogTitle>
          <DialogDescription>
            Amounts use the university currency:{" "}
            {university?.currency ?? "currency unavailable"}.
          </DialogDescription>
        </DialogHeader>
        {error && <Alert>{error}</Alert>}
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setForm(emptyForm);
              setEditing("new");
            }}
          >
            <Plus />
            Add scholarship
          </Button>
        </div>
        <ScholarshipTable
          items={items}
          currency={university?.currency ?? null}
          onEdit={openEdit}
          onToggle={toggle}
          onDelete={setDeleting}
        />
        <ScholarshipFormDialog
          editing={editing}
          value={form}
          saving={saving}
          setValue={setForm}
          onClose={() => setEditing(null)}
          onSubmit={save}
        />
        <AlertDialog
          open={deleting !== null}
          onOpenChange={(open) => !open && setDeleting(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete scholarship?</AlertDialogTitle>
              <AlertDialogDescription>
                This backend does not support scholarship soft deletion. This
                permanently removes the record; deactivate it instead if history
                should be retained.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void remove()}>
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

function ScholarshipTable({
  items,
  currency,
  onEdit,
  onToggle,
  onDelete,
}: {
  items: Scholarship[];
  currency: string | null;
  onEdit: (item: Scholarship) => void;
  onToggle: (item: Scholarship) => void;
  onDelete: (item: Scholarship) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Eligibility</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                {currency
                  ? `${currency} ${Number(item.amount).toLocaleString()}`
                  : `${Number(item.amount).toLocaleString()} (currency unavailable)`}
              </TableCell>
              <TableCell>
                {item.eligibility_description || "Not specified"}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {item.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${item.name}`}
                    onClick={() => onEdit(item)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void onToggle(item)}
                  >
                    {item.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${item.name}`}
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {items.length === 0 && (
        <p className="p-8 text-center text-sm text-muted-foreground">
          No scholarships have been entered.
        </p>
      )}
    </div>
  );
}

export function ScholarshipFormDialog({
  editing,
  value,
  saving,
  setValue,
  onClose,
  onSubmit,
}: {
  editing: Scholarship | "new" | null;
  value: ScholarshipInput;
  saving: boolean;
  setValue: (value: ScholarshipInput) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const number = (
    key: "amount" | "minimum_gpa" | "minimum_test_score",
    input: string,
  ) => setValue({ ...value, [key]: input ? Number(input) : null });
  return (
    <Dialog open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing === "new" ? "Add scholarship" : "Edit scholarship"}
          </DialogTitle>
        </DialogHeader>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <Field label="Name">
            <Input
              value={value.name}
              onChange={(event) =>
                setValue({ ...value, name: event.target.value })
              }
              required
            />
          </Field>
          <Field label="Amount">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={value.amount}
              onChange={(event) => number("amount", event.target.value)}
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
          <Field label="Minimum test score">
            <Input
              type="number"
              min="0"
              max="340"
              value={value.minimum_test_score ?? ""}
              onChange={(event) =>
                number("minimum_test_score", event.target.value)
              }
            />
          </Field>
          <Field label="Status">
            <Select
              value={value.is_active ? "active" : "inactive"}
              onValueChange={(next) =>
                setValue({ ...value, is_active: next === "active" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="space-y-2 sm:col-span-2">
            <Label>Eligibility information</Label>
            <Textarea
              value={value.eligibility_description ?? ""}
              onChange={(event) =>
                setValue({
                  ...value,
                  eligibility_description: event.target.value || null,
                })
              }
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button disabled={saving}>
              {saving ? "Saving..." : "Save scholarship"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
