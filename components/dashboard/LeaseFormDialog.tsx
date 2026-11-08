"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import type { LeaseFormValues, LeaseProperty } from "@/app/dashboard/leases/lease-context";

const emptyValues: LeaseFormValues = {
  propertyId: "",
  tenantName: "",
  tenantEmail: "",
  tenantPhone: "",
  tenantNationalId: "",
  moveInDate: "",
  leaseStart: "",
  leaseEnd: "",
  monthlyRent: "",
  notes: "",
};

interface LeaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
  properties: LeaseProperty[];
  initialValues?: Partial<LeaseFormValues>;
  onSubmit: (values: LeaseFormValues) => Promise<void>;
}

export function LeaseFormDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  properties,
  initialValues,
  onSubmit,
}: LeaseFormDialogProps) {
  const [values, setValues] = useState<LeaseFormValues>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<keyof LeaseFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mergedValues = useMemo(
    () => ({ ...emptyValues, ...initialValues }),
    [initialValues],
  );

  useEffect(() => {
    if (open) {
      setValues(mergedValues);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [mergedValues, open]);

  const validate = () => {
    const nextErrors: Partial<Record<keyof LeaseFormValues, string>> = {};

    if (!values.tenantName.trim()) nextErrors.tenantName = "Tenant name is required";
    if (!values.tenantEmail.trim()) nextErrors.tenantEmail = "Tenant email is required";
    if (!values.tenantPhone.trim()) nextErrors.tenantPhone = "Tenant phone is required";
    if (!values.propertyId) nextErrors.propertyId = "Property is required";
    if (!values.leaseStart) nextErrors.leaseStart = "Lease start is required";
    if (!values.leaseEnd) nextErrors.leaseEnd = "Lease end is required";

    const rentValue = Number(values.monthlyRent);

    if (!values.monthlyRent || Number.isNaN(rentValue) || rentValue <= 0) {
      nextErrors.monthlyRent = "Monthly rent must be greater than 0";
    }

    if (values.leaseStart && values.leaseEnd) {
      const start = new Date(values.leaseStart);
      const end = new Date(values.leaseEnd);

      if (end <= start) {
        nextErrors.leaseEnd = "Lease end must be after lease start";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save lease";
      setErrors((current) => ({ ...current, notes: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tenantName">Tenant Name</Label>
              <Input
                id="tenantName"
                value={values.tenantName}
                onChange={(event) =>
                  setValues((current) => ({ ...current, tenantName: event.target.value }))
                }
                placeholder="Full tenant name"
              />
              {errors.tenantName && <p className="text-sm text-red-500">{errors.tenantName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantEmail">Email</Label>
              <Input
                id="tenantEmail"
                type="email"
                value={values.tenantEmail}
                onChange={(event) =>
                  setValues((current) => ({ ...current, tenantEmail: event.target.value }))
                }
                placeholder="tenant@example.com"
              />
              {errors.tenantEmail && <p className="text-sm text-red-500">{errors.tenantEmail}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantPhone">Phone</Label>
              <Input
                id="tenantPhone"
                value={values.tenantPhone}
                onChange={(event) =>
                  setValues((current) => ({ ...current, tenantPhone: event.target.value }))
                }
                placeholder="Phone number"
              />
              {errors.tenantPhone && <p className="text-sm text-red-500">{errors.tenantPhone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantNationalId">National ID</Label>
              <Input
                id="tenantNationalId"
                value={values.tenantNationalId}
                onChange={(event) =>
                  setValues((current) => ({ ...current, tenantNationalId: event.target.value }))
                }
                placeholder="National ID or passport"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moveInDate">Move-In Date</Label>
              <Input
                id="moveInDate"
                type="date"
                value={values.moveInDate}
                onChange={(event) =>
                  setValues((current) => ({ ...current, moveInDate: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Property</Label>
              <Select
                value={values.propertyId}
                onValueChange={(value) =>
                  setValues((current) => ({ ...current, propertyId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      No properties available
                    </SelectItem>
                  ) : null}
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                      {property.city ? ` • ${property.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.propertyId && <p className="text-sm text-red-500">{errors.propertyId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaseStart">Lease Start</Label>
              <Input
                id="leaseStart"
                type="date"
                value={values.leaseStart}
                onChange={(event) =>
                  setValues((current) => ({ ...current, leaseStart: event.target.value }))
                }
              />
              {errors.leaseStart && <p className="text-sm text-red-500">{errors.leaseStart}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaseEnd">Lease End</Label>
              <Input
                id="leaseEnd"
                type="date"
                value={values.leaseEnd}
                onChange={(event) =>
                  setValues((current) => ({ ...current, leaseEnd: event.target.value }))
                }
              />
              {errors.leaseEnd && <p className="text-sm text-red-500">{errors.leaseEnd}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="monthlyRent">Monthly Rent</Label>
              <Input
                id="monthlyRent"
                type="number"
                min="1"
                step="1"
                value={values.monthlyRent}
                onChange={(event) =>
                  setValues((current) => ({ ...current, monthlyRent: event.target.value }))
                }
                placeholder="1500"
              />
              {errors.monthlyRent && <p className="text-sm text-red-500">{errors.monthlyRent}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={values.notes}
                onChange={(event) =>
                  setValues((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="Optional lease notes, clauses, reminders, or handover details"
              />
              {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}