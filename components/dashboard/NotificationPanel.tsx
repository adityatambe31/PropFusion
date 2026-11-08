"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  X,
  CheckCheck,
  Home,
  Leaf,
  AlertCircle,
  Clock,
  Wrench,
  ChevronRight,
} from "lucide-react";
import {
  AppNotification,
  NotificationSeverity,
  deriveNotifications,
  getNotificationSettings,
  getReadIds,
  markAsRead,
  markAllAsRead,
  fireBrowserNotifications,
  NOTIFICATION_SETTINGS_UPDATED_EVENT,
  SETTINGS_KEY,
} from "@/lib/helpers/notification-helpers";
import {
  useRealEstateContext,
} from "@/app/dashboard/realestate/real-estate-context";
import {
  useAgricultureContext,
} from "@/app/dashboard/agriculture/agriculture-context";
import Link from "next/link";

/* ─── Severity helpers ─────────────────────────────────────────── */
const severityColors: Record<NotificationSeverity, string> = {
  urgent: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  warning: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  info: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
};

const severityDot: Record<NotificationSeverity, string> = {
  urgent: "bg-red-500",
  warning: "bg-amber-400",
  info: "bg-blue-400",
};

const categoryIcon = {
  rent_due: Clock,
  lease_expiry: ChevronRight,
  maintenance: Wrench,
};

function NotificationItem({
  notif,
  onRead,
}: {
  notif: AppNotification;
  onRead: (id: string) => void;
}) {
  const Icon = categoryIcon[notif.category] ?? AlertCircle;
  const AssetIcon = notif.assetType === "realestate" ? Home : Leaf;

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className={`relative flex gap-3 p-3.5 rounded-xl border text-sm transition-all ${
        notif.read ? "opacity-60" : ""
      } ${severityColors[notif.severity]}`}
    >
      {/* Unread dot */}
      {!notif.read && (
        <span
          className={`absolute top-3 right-3 w-2 h-2 rounded-full ${severityDot[notif.severity]}`}
        />
      )}

      {/* Icon */}
      <div className="mt-0.5 shrink-0">
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-semibold leading-snug">{notif.title}</p>
        <p className="text-xs mt-0.5 opacity-80 leading-relaxed">
          {notif.message}
        </p>
        <div className="flex items-center gap-1 mt-1.5 opacity-60 text-xs">
          <AssetIcon className="w-3 h-3" />
          <span>{notif.assetName}</span>
          {notif.dueDate && (
            <>
              <span>·</span>
              <span>{new Date(notif.dueDate).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>

      {/* Mark as read */}
      {!notif.read && (
        <button
          onClick={() => onRead(notif.id)}
          className="absolute top-2 right-5 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          title="Mark as read"
        >
          <CheckCheck className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}

/* ─── Main Component ───────────────────────────────────────────── */

export function NotificationBell({ align = "right" }: { align?: "left" | "right" }) {
  const realEstateContext = useRealEstateContext();
  const agricultureContext = useAgricultureContext();
  const properties = useMemo(() => realEstateContext?.properties ?? [], [realEstateContext?.properties]);
  const lands = useMemo(() => agricultureContext?.lands ?? [], [agricultureContext?.lands]);

  const [open, setOpen] = useState(false);
  // readIds drives re-renders when user marks notifications read
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    return getReadIds();
  });
  // tick increments every 5 min to force re-derivation from localStorage settings
  const [tick, setTick] = useState(0);
  // settingsVersion increments when notification settings change in this or another tab
  const [settingsVersion, setSettingsVersion] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Poll every 5 minutes; no setState in the effect body itself
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // React immediately to settings updates in current tab + sync across tabs.
  useEffect(() => {
    const refresh = () => setSettingsVersion((v) => v + 1);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SETTINGS_KEY) refresh();
    };

    window.addEventListener(
      NOTIFICATION_SETTINGS_UPDATED_EVENT,
      refresh as EventListener
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        NOTIFICATION_SETTINGS_UPDATED_EVENT,
        refresh as EventListener
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Derive notifications from asset data (re-runs when deps change)
  const notifications = useMemo(() => {
    // tick is referenced so this memo re-runs on polling intervals
    void tick;
    // settingsVersion is referenced so this memo re-runs immediately on settings changes
    void settingsVersion;
    const settings = getNotificationSettings();
    return deriveNotifications(properties, lands, settings).map((n) => ({
      ...n,
      read: readIds.has(n.id),
    }));
  }, [properties, lands, readIds, tick, settingsVersion]);

  // Fire browser push notifications as a side-effect of notifications changing
  useEffect(() => {
    const settings = getNotificationSettings();
    if (settings.enabled && settings.browserPushEnabled) {
      fireBrowserNotifications(notifications);
    }
  }, [notifications]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRead = (id: string) => {
    markAsRead(id);
    setReadIds((prev) => new Set([...prev, id]));
  };

  const handleReadAll = () => {
    const ids = notifications.map((n) => n.id);
    markAllAsRead(ids);
    setReadIds((prev) => new Set([...prev, ...ids]));
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className={`absolute top-full mt-2 w-[calc(100vw-2rem)] sm:w-95 max-w-[380px] bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-[100] overflow-hidden ${
              align === "left" ? "left-0" : "right-0"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleReadAll}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-100 overflow-y-auto p-3 space-y-2">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    All caught up!
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    No alerts at the moment.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n) => (
                    <NotificationItem key={n.id} notif={n} onRead={handleRead} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2.5 flex items-center justify-between">
              <Link
                href="/dashboard/account/settings?tab=notifications"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => setOpen(false)}
              >
                Notification settings →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
