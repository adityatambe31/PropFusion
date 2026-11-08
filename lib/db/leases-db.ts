import { Db } from "mongodb";

export type LeaseStatus = "active" | "expired" | "pending";

export interface LeaseTenantRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId?: string;
  moveInDate?: string;
}

export interface LeasePropertyRecord {
  id: string;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  type?: string;
  unit?: string;
  status?: string;
}

export interface LeaseRecord {
  id: string;
  userId: string;
  propertyId: string;
  tenantId: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  status: LeaseStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeasePaymentRecord {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "due" | "late";
  reference?: string;
  receiptNumber?: string;
  paymentMethod?: string;
  paymentLast4?: string;
}

export interface PopulatedLeaseRecord extends LeaseRecord {
  tenant: LeaseTenantRecord | null;
  property: LeasePropertyRecord | null;
  daysRemaining: number;
  paymentHistory: LeasePaymentRecord[];
}

export interface LeaseTenantInput {
  name: string;
  email: string;
  phone: string;
  nationalId?: string;
  moveInDate?: string;
}

export interface LeaseUpsertInput {
  propertyId: string;
  tenant: LeaseTenantInput;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  notes?: string;
  status?: LeaseStatus;
}

const leaseCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatLeaseCurrency(value: number) {
  return leaseCurrencyFormatter.format(value);
}

export function calculateDaysRemaining(leaseEnd?: string) {
  if (!leaseEnd) return 0;
  const endDate = new Date(leaseEnd);
  const today = new Date();
  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateLeaseStatus(
  leaseStart?: string,
  leaseEnd?: string,
  explicitStatus?: LeaseStatus,
): LeaseStatus {
  if (explicitStatus) {
    return explicitStatus;
  }

  const startDate = leaseStart ? new Date(leaseStart) : null;
  const endDate = leaseEnd ? new Date(leaseEnd) : null;
  const now = new Date();

  if (endDate && endDate.getTime() < now.getTime()) {
    return "expired";
  }

  if (startDate && startDate.getTime() > now.getTime()) {
    return "pending";
  }

  return "active";
}

function toPlainLeaseRecord(lease: Record<string, unknown>): LeaseRecord {
  return {
    id: String(lease.id || lease._id || ""),
    userId: String(lease.userId || ""),
    propertyId: String(lease.propertyId || ""),
    tenantId: String(lease.tenantId || ""),
    leaseStart: String(lease.leaseStart || ""),
    leaseEnd: String(lease.leaseEnd || ""),
    monthlyRent: Number(lease.monthlyRent || 0),
    status: (lease.status as LeaseStatus) || "pending",
    notes: typeof lease.notes === "string" ? lease.notes : undefined,
    createdAt: String(lease.createdAt || new Date().toISOString()),
    updatedAt: String(lease.updatedAt || new Date().toISOString()),
  };
}

export async function populateLeaseRecord(
  db: Db,
  lease: Record<string, unknown>,
): Promise<PopulatedLeaseRecord> {
  const plainLease = toPlainLeaseRecord(lease);

  const [tenant, property, paymentDocs] = await Promise.all([
    db.collection("tenants").findOne({
      id: plainLease.tenantId,
      userId: plainLease.userId,
    }),
    db.collection("properties").findOne({
      id: plainLease.propertyId,
      userId: plainLease.userId,
    }),
    db.collection("payments").find({ leaseId: plainLease.id }).sort({ date: -1 }).toArray(),
  ]);

  return {
    ...plainLease,
    tenant: tenant
      ? {
          id: String(tenant.id || tenant._id || ""),
          name: String(tenant.name || ""),
          email: String(tenant.email || ""),
          phone: String(tenant.phone || ""),
          nationalId: typeof tenant.nationalId === "string" ? tenant.nationalId : undefined,
          moveInDate: typeof tenant.moveInDate === "string" ? tenant.moveInDate : undefined,
        }
      : null,
    property: property
      ? {
          id: String(property.id || property._id || ""),
          name: String(property.name || ""),
          location: typeof property.location === "string" ? property.location : undefined,
          city: typeof property.city === "string" ? property.city : undefined,
          state: typeof property.state === "string" ? property.state : undefined,
          type: typeof property.type === "string" ? property.type : undefined,
          unit: typeof property.unit === "string" ? property.unit : undefined,
          status: typeof property.status === "string" ? property.status : undefined,
        }
      : null,
    daysRemaining: calculateDaysRemaining(plainLease.leaseEnd),
    paymentHistory: paymentDocs.map((payment) => ({
      id: String(payment.id || payment._id || ""),
      date: String(payment.date || ""),
      amount: Number(payment.amount || 0),
      status: (String(payment.status || "pending") as "paid" | "pending" | "due" | "late"),
      reference: String(payment.receiptNumber || payment.period || "Monthly rent"),
      receiptNumber: typeof payment.receiptNumber === "string" ? payment.receiptNumber : undefined,
      paymentMethod: typeof payment.paymentMethod === "string" ? payment.paymentMethod : undefined,
      paymentLast4: typeof payment.paymentLast4 === "string" ? payment.paymentLast4 : undefined,
    })),
  };
}

export async function getPopulatedLeases(
  db: Db,
  userId: string,
  propertyId?: string,
): Promise<PopulatedLeaseRecord[]> {
  const query: Record<string, unknown> = { userId };

  if (propertyId) {
    query.propertyId = propertyId;
  }

  const leases = await db
    .collection("leases")
    .find(query)
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();

  return Promise.all(leases.map((lease) => populateLeaseRecord(db, lease)));
}

export async function getPopulatedLeaseById(
  db: Db,
  userId: string,
  id: string,
): Promise<PopulatedLeaseRecord | null> {
  const lease = await db.collection("leases").findOne({ id, userId });

  if (!lease) {
    return null;
  }

  return populateLeaseRecord(db, lease);
}

export async function syncPropertyLeaseSnapshot(
  db: Db,
  userId: string,
  propertyId: string,
) {
  const property = await db.collection("properties").findOne({ id: propertyId, userId });

  if (!property) {
    return;
  }

  const leases = await db
    .collection("leases")
    .find({ userId, propertyId })
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();

  const activeLeases = leases.filter((lease) => {
    const status = calculateLeaseStatus(
      String(lease.leaseStart || ""),
      String(lease.leaseEnd || ""),
      lease.status as LeaseStatus | undefined,
    );

    return status === "active" || status === "pending";
  });

  const tenantDocs = await Promise.all(
    activeLeases.map(async (lease) => {
      const tenant = await db.collection("tenants").findOne({
        id: String(lease.tenantId || ""),
        userId,
      });

      if (!tenant) {
        return null;
      }

      return {
        id: String(tenant.id || tenant._id || ""),
        name: String(tenant.name || ""),
        leaseType: String(property.unit || property.name || "Lease"),
        duration:
          lease.leaseStart && lease.leaseEnd ? `${lease.leaseStart} - ${lease.leaseEnd}` : "",
        rentAmount: `${formatLeaseCurrency(Number(lease.monthlyRent || 0))}/month`,
        leaseStart: String(lease.leaseStart || ""),
        leaseEnd: String(lease.leaseEnd || ""),
        paymentStatus:
          lease.status === "expired"
            ? "overdue"
            : lease.status === "pending"
              ? "late"
              : "current",
        lastPaymentDate: undefined,
      };
    }),
  );

  const syncedTenants = tenantDocs.filter(Boolean);
  const totalMonthlyRent = activeLeases.reduce(
    (sum, lease) => sum + Number(lease.monthlyRent || 0),
    0,
  );

  const leaseStartDate =
    activeLeases.length > 0 ? String(activeLeases[activeLeases.length - 1].leaseStart || "") : undefined;
  const leaseEndDate =
    activeLeases.length > 0 ? String(activeLeases[0].leaseEnd || "") : undefined;

  await db.collection("properties").updateOne(
    { id: propertyId, userId },
    {
      $set: {
        tenants: syncedTenants,
        tenantCount: syncedTenants.length,
        price: totalMonthlyRent > 0 ? `${formatLeaseCurrency(totalMonthlyRent)}/month` : "$0/month",
        leaseStartDate,
        leaseEndDate,
        status:
          String(property.status || "") === "Under Maintenance"
            ? property.status
            : activeLeases.length > 0
              ? "Occupied"
              : "Vacant",
        updatedAt: new Date().toISOString(),
      },
    },
  );
}

export async function syncPropertyLeaseSnapshots(
  db: Db,
  userId: string,
  propertyIds: Array<string | undefined>,
) {
  const uniqueIds = [...new Set(propertyIds.filter(Boolean))] as string[];

  await Promise.all(
    uniqueIds.map((propertyId) => syncPropertyLeaseSnapshot(db, userId, propertyId)),
  );
}