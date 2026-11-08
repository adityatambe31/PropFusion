/**
 * Notification Helpers
 *
 * Derives rent-due / lease-expiry alerts from asset data.
 * All state is persisted in localStorage so no backend is required.
 */

export type NotificationSeverity = "urgent" | "warning" | "info";
export type NotificationCategory = "rent_due" | "lease_expiry" | "maintenance";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  category: NotificationCategory;
  assetId: string;
  assetName: string;
  assetType: "realestate" | "agriculture";
  dueDate?: string;
  read: boolean;
  createdAt: string;
}

const READ_KEY = "propfusion_notifications_read";
const LAST_BROWSER_NOTIF_KEY = "propfusion_last_browser_notif_date";
export const NOTIFICATION_SETTINGS_UPDATED_EVENT =
  "propfusion:notification-settings-updated";

interface NotificationTenant {
  id?: string;
  name: string;
  rentDueDate?: string;
}

interface NotificationPropertyInput {
  id: string;
  name: string;
  tenants?: NotificationTenant[];
  leaseEndDate?: string;
  lastMaintenanceDate?: string;
}

interface NotificationLandInput {
  id: string;
  name: string;
  crop?: string;
  tenants?: NotificationTenant[];
  nextHarvestDate?: string;
}

/* ─── Persist helpers ──────────────────────────────────────────── */

export function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markAsRead(id: string) {
  const ids = getReadIds();
  ids.add(id);
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

export function markAllAsRead(ids: string[]) {
  const existing = getReadIds();
  ids.forEach((id) => existing.add(id));
  localStorage.setItem(READ_KEY, JSON.stringify([...existing]));
}

/* ─── Notification settings ────────────────────────────────────── */

export interface NotificationSettings {
  enabled: boolean;
  rentDueEnabled: boolean;
  leaseExpiryEnabled: boolean;
  maintenanceEnabled: boolean;
  browserPushEnabled: boolean;
  daysBeforeRentDue: number; // 3 | 7 | 14
  daysBeforeLeaseExpiry: number; // 30 | 60 | 90
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  rentDueEnabled: true,
  leaseExpiryEnabled: true,
  maintenanceEnabled: true,
  browserPushEnabled: false,
  daysBeforeRentDue: 7,
  daysBeforeLeaseExpiry: 30,
};

export const SETTINGS_KEY = "propfusion_notif_settings";

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

  // Local storage writes in the same tab do not trigger the "storage" event.
  // Emit a custom event so in-app listeners can react immediately.
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_SETTINGS_UPDATED_EVENT, {
        detail: settings,
      })
    );
  }
}

/* ─── Alert generation ─────────────────────────────────────────── */

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function deriveNotifications(
  properties: NotificationPropertyInput[],
  lands: NotificationLandInput[],
  settings: NotificationSettings
): AppNotification[] {
  if (!settings.enabled) return [];

  const notifications: AppNotification[] = [];
  const readIds = getReadIds();

  /* ── Real estate ───────────────────────────────────────────── */
  for (const prop of properties) {
    // Rent due — check tenants array
    if (settings.rentDueEnabled && prop.tenants?.length) {
      for (const tenant of prop.tenants) {
        const days = daysUntil(tenant.rentDueDate);
        if (days === null) continue;

        if (days < 0) {
          // Overdue
          const id = `rent_overdue_${prop.id}_${tenant.id || tenant.name}`;
          notifications.push({
            id,
            title: "Rent Overdue",
            message: `${tenant.name}'s rent for ${prop.name} was due ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago.`,
            severity: "urgent",
            category: "rent_due",
            assetId: prop.id,
            assetName: prop.name,
            assetType: "realestate",
            dueDate: tenant.rentDueDate,
            read: readIds.has(id),
            createdAt: new Date().toISOString(),
          });
        } else if (days <= settings.daysBeforeRentDue) {
          // Upcoming
          const id = `rent_due_${prop.id}_${tenant.id || tenant.name}`;
          notifications.push({
            id,
            title: "Rent Due Soon",
            message: `${tenant.name}'s rent for ${prop.name} is due in ${days} day${days !== 1 ? "s" : ""}.`,
            severity: days <= 3 ? "urgent" : "warning",
            category: "rent_due",
            assetId: prop.id,
            assetName: prop.name,
            assetType: "realestate",
            dueDate: tenant.rentDueDate,
            read: readIds.has(id),
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // Lease expiry
    if (settings.leaseExpiryEnabled) {
      const days = daysUntil(prop.leaseEndDate);
      if (days !== null && days >= 0 && days <= settings.daysBeforeLeaseExpiry) {
        const id = `lease_expiry_${prop.id}`;
        notifications.push({
          id,
          title: "Lease Expiring",
          message: `Lease for ${prop.name} expires in ${days} day${days !== 1 ? "s" : ""}. Consider renewing.`,
          severity: days <= 14 ? "urgent" : "warning",
          category: "lease_expiry",
          assetId: prop.id,
          assetName: prop.name,
          assetType: "realestate",
          dueDate: prop.leaseEndDate,
          read: readIds.has(id),
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Maintenance overdue
    if (settings.maintenanceEnabled && prop.lastMaintenanceDate) {
      const monthsAgo =
        (Date.now() - new Date(prop.lastMaintenanceDate).getTime()) /
        (1000 * 60 * 60 * 24 * 30);
      if (monthsAgo > 6) {
        const id = `maintenance_${prop.id}`;
        notifications.push({
          id,
          title: "Maintenance Overdue",
          message: `${prop.name} hasn't had maintenance in ${Math.floor(monthsAgo)} months. Schedule an inspection.`,
          severity: monthsAgo > 12 ? "urgent" : "warning",
          category: "maintenance",
          assetId: prop.id,
          assetName: prop.name,
          assetType: "realestate",
          read: readIds.has(id),
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  /* ── Agriculture ───────────────────────────────────────────── */
  for (const land of lands) {
    // Rent / lease due for agriculture tenants
    if (settings.rentDueEnabled && land.tenants?.length) {
      for (const tenant of land.tenants) {
        const days = daysUntil(tenant.rentDueDate);
        if (days === null) continue;

        if (days < 0) {
          const id = `agri_rent_overdue_${land.id}_${tenant.id || tenant.name}`;
          notifications.push({
            id,
            title: "Land Rent Overdue",
            message: `${tenant.name}'s rent for ${land.name} was due ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago.`,
            severity: "urgent",
            category: "rent_due",
            assetId: land.id,
            assetName: land.name,
            assetType: "agriculture",
            dueDate: tenant.rentDueDate,
            read: readIds.has(id),
            createdAt: new Date().toISOString(),
          });
        } else if (days <= settings.daysBeforeRentDue) {
          const id = `agri_rent_due_${land.id}_${tenant.id || tenant.name}`;
          notifications.push({
            id,
            title: "Land Rent Due Soon",
            message: `${tenant.name}'s rent for ${land.name} is due in ${days} day${days !== 1 ? "s" : ""}.`,
            severity: days <= 3 ? "urgent" : "warning",
            category: "rent_due",
            assetId: land.id,
            assetName: land.name,
            assetType: "agriculture",
            dueDate: tenant.rentDueDate,
            read: readIds.has(id),
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // Harvest date reminder
    if (settings.leaseExpiryEnabled && land.nextHarvestDate) {
      const days = daysUntil(land.nextHarvestDate);
      if (days !== null && days >= 0 && days <= 14) {
        const id = `harvest_${land.id}`;
        notifications.push({
          id,
          title: "Harvest Coming Up",
          message: `${land.name} (${land.crop}) harvest is in ${days} day${days !== 1 ? "s" : ""}.`,
          severity: days <= 3 ? "urgent" : "info",
          category: "lease_expiry",
          assetId: land.id,
          assetName: land.name,
          assetType: "agriculture",
          dueDate: land.nextHarvestDate,
          read: readIds.has(id),
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // Sort: unread urgent first, then by date
  return notifications.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    const order: Record<NotificationSeverity, number> = {
      urgent: 0,
      warning: 1,
      info: 2,
    };
    return order[a.severity] - order[b.severity];
  });
}

/* ─── Browser push notifications ───────────────────────────────── */

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function fireBrowserNotifications(
  notifications: AppNotification[]
): void {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Only fire once per day
  const today = new Date().toDateString();
  const lastFired = localStorage.getItem(LAST_BROWSER_NOTIF_KEY);
  if (lastFired === today) return;

  const unread = notifications.filter((n) => !n.read && n.severity === "urgent");
  if (unread.length === 0) return;

  localStorage.setItem(LAST_BROWSER_NOTIF_KEY, today);

  if (unread.length === 1) {
    new Notification(unread[0].title, {
      body: unread[0].message,
      icon: "/favicon.ico",
    });
  } else {
    new Notification(`PropFusion — ${unread.length} urgent alerts`, {
      body: unread.map((n) => `• ${n.title}`).join("\n"),
      icon: "/favicon.ico",
    });
  }
}
