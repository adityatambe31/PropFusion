"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, User, Calendar, DollarSign } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export interface Tenant {
  id: string;
  name: string;
  leaseType?: string;
  duration?: string;
  docs?: string[];
  rentAmount?: string;
  leaseStart?: string;
  leaseEnd?: string;
  paymentStatus?: "current" | "late" | "overdue";
  lastPaymentDate?: string;
}

interface TenantManagementProps {
  tenants: Tenant[];
  onTenantsChange: (tenants: Tenant[]) => void;
  propertyName?: string;
}

const emptyTenant: Omit<Tenant, "id"> = {
  name: "",
  leaseType: "",
  duration: "",
  rentAmount: "",
  leaseStart: "",
  leaseEnd: "",
  paymentStatus: "current",
};

export function TenantManagement({
  tenants,
  onTenantsChange,
  propertyName,
}: TenantManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Tenant, "id">>(emptyTenant);

  const handleSave = () => {
    if (!formData.name) {
      alert("Tenant name is required");
      return;
    }

    if (editingTenant) {
      // Update existing tenant
      const updated = tenants.map((t) =>
        t.id === editingTenant.id ? { ...formData, id: editingTenant.id } : t
      );
      onTenantsChange(updated);
    } else {
      // Add new tenant
      const newTenant: Tenant = {
        ...formData,
        id: crypto.randomUUID(),
      };
      onTenantsChange([...tenants, newTenant]);
    }

    setShowAddModal(false);
    setEditingTenant(null);
    setFormData(emptyTenant);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      leaseType: tenant.leaseType || "",
      duration: tenant.duration || "",
      rentAmount: tenant.rentAmount || "",
      leaseStart: tenant.leaseStart || "",
      leaseEnd: tenant.leaseEnd || "",
      paymentStatus: tenant.paymentStatus || "current",
    });
    setShowAddModal(true);
  };

  const handleDelete = (tenantId: string) => {
    onTenantsChange(tenants.filter((t) => t.id !== tenantId));
    setDeleteConfirm(null);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "current":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "late":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "overdue":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Tenants {tenants.length > 0 && `(${tenants.length})`}
        </h3>
        <Button
          size="sm"
          onClick={() => {
            setEditingTenant(null);
            setFormData(emptyTenant);
            setShowAddModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Add Tenant
        </Button>
      </div>

      {tenants.length === 0 ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No tenants added yet</p>
          <p className="text-sm">Click &quot;Add Tenant&quot; to get started</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {tenant.name}
                    </h4>
                    {tenant.paymentStatus && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusBadge(tenant.paymentStatus)}`}
                      >
                        {tenant.paymentStatus}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {tenant.leaseType && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{tenant.leaseType}</span>
                      </div>
                    )}
                    {tenant.rentAmount && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>{tenant.rentAmount}</span>
                      </div>
                    )}
                    {tenant.leaseStart && tenant.leaseEnd && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {tenant.leaseStart} - {tenant.leaseEnd}
                        </span>
                      </div>
                    )}
                    {tenant.duration && (
                      <div className="text-gray-500">{tenant.duration}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(tenant)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm(tenant.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Tenant Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTenant ? "Edit Tenant" : "Add New Tenant"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tenant Name <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Unit / Lease Type
              </label>
              <input
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g. Apartment 301"
                value={formData.leaseType}
                onChange={(e) =>
                  setFormData({ ...formData, leaseType: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Monthly Rent
              </label>
              <input
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g. $1,500"
                value={formData.rentAmount}
                onChange={(e) =>
                  setFormData({ ...formData, rentAmount: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Lease Start
              </label>
              <input
                type="date"
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={formData.leaseStart}
                onChange={(e) =>
                  setFormData({ ...formData, leaseStart: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Lease End
              </label>
              <input
                type="date"
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={formData.leaseEnd}
                onChange={(e) =>
                  setFormData({ ...formData, leaseEnd: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration
              </label>
              <input
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g. 1 year"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment Status
              </label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    paymentStatus: val as "current" | "late" | "overdue",
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingTenant ? "Save Changes" : "Add Tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Tenant"
        description={`Are you sure you want to remove this tenant from ${propertyName || "this property"}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      />
    </div>
  );
}
