import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateLead } from "@/hooks/use-leads";
import type { LeadCreateInput } from "@/types/lead";

type AddLeadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormState = {
  name: string;
  company: string;
  phone: string;
};

const initialFormState: FormState = {
  name: "",
  company: "",
  phone: "",
};

export function AddLeadDialog({ open, onOpenChange }: AddLeadDialogProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({
    name: false,
    company: false,
    phone: false,
  });
  const createLead = useCreateLead();
  const { reset } = createLead;

  const errors = useMemo(() => validateLeadForm(form), [form]);
  const isSaving = createLead.isPending;
  const showNameError = touched.name && errors.name;

  useEffect(() => {
    if (!open) {
      setForm(initialFormState);
      setTouched({ name: false, company: false, phone: false });
      reset();
    }
  }, [open, reset]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const markTouched = (field: keyof FormState) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ name: true, company: true, phone: true });

    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload: LeadCreateInput = {
      name: form.name.trim(),
      company: normalizeOptionalValue(form.company),
      phone: normalizeOptionalValue(form.phone),
      status: "new",
    };

    try {
      await createLead.mutateAsync(payload);
      onOpenChange(false);
    } catch {
      // Mutation-level error handling keeps the form open and shows feedback.
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto">
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <UserPlus className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>Add lead</DialogTitle>
          <DialogDescription>
            Create a new CRM lead with a default status of New.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4">
            <Field
              id="lead-name"
              label="Full name"
              required
              error={showNameError || undefined}
            >
              <Input
                id="lead-name"
                autoFocus
                value={form.name}
                onBlur={() => markTouched("name")}
                onChange={(event) => updateField("name", event.target.value)}
                aria-invalid={Boolean(showNameError)}
                aria-describedby={showNameError ? "lead-name-error" : undefined}
                placeholder="Riya Sharma"
                disabled={isSaving}
              />
            </Field>

            <Field id="lead-company" label="Company">
              <Input
                id="lead-company"
                value={form.company}
                onBlur={() => markTouched("company")}
                onChange={(event) => updateField("company", event.target.value)}
                placeholder="Acme Growth"
                disabled={isSaving}
              />
            </Field>

            <Field id="lead-phone" label="Phone">
              <Input
                id="lead-phone"
                value={form.phone}
                onBlur={() => markTouched("phone")}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+91 98765 43210"
                disabled={isSaving}
              />
            </Field>
          </div>

          {createLead.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(createLead.error)}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isSaving ? "Saving" : "Create lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
};

function Field({ id, label, required, error, children }: FieldProps) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function validateLeadForm(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.name.trim()) {
    errors.name = "Full name is required.";
  } else if (form.name.trim().length > 120) {
    errors.name = "Full name must be 120 characters or fewer.";
  }

  return errors;
}

function normalizeOptionalValue(value: string) {
  return value.trim() || undefined;
}
