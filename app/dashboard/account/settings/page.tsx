"use client";

import {
  ChangeEmailCard,
  ChangePasswordCard,
  DeleteAccountCard,
  AuthLoading,
} from "@daveyplate/better-auth-ui";
import { CustomTwoFactorCard } from "@/components/auth/CustomTwoFactorCard";
import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestBrowserNotificationPermission,
  NotificationSettings,
} from "@/lib/helpers/notification-helpers";

function SettingsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded w-64 mb-6"></div>
      <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded"></div>
    </div>
  );
}

/* ─── Toggle Row ──────────────────────────────────────────────── */
function ToggleRow({
  label,
  description,
  enabled,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${disabled ? "opacity-50" : ""}`}
    >
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          enabled ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
        } ${disabled ? "cursor-not-allowed" : ""}`}
        aria-pressed={enabled}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

/* ─── Notifications Tab ───────────────────────────────────────── */
function NotificationsTab() {
  const [settings, setSettings] = useState<NotificationSettings | null>(() =>
    getNotificationSettings(),
  );
  const [browserPermission, setBrowserPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (!("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  });

  if (!settings) return null;

  const update = (patch: Partial<NotificationSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveNotificationSettings(next);
  };

  const handleRequestBrowserPermission = async () => {
    const granted = await requestBrowserNotificationPermission();
    setBrowserPermission(granted ? "granted" : "denied");
    if (granted) update({ browserPushEnabled: true });
  };

  return (
    <div className="space-y-6">
      {/* Master toggle */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        {settings.enabled ? (
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        ) : (
          <BellOff className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {settings.enabled
              ? "Notifications are enabled"
              : "Notifications are disabled"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {settings.enabled
              ? "You will receive in-app alerts for rent due, lease expirations, and maintenance."
              : "Turn on notifications to get rent reminders and important alerts."}
          </p>
        </div>
        <button
          onClick={() => update({ enabled: !settings.enabled })}
          className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            settings.enabled
              ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {settings.enabled ? "Disable" : "Enable"}
        </button>
      </div>

      {/* Alert types */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          Alert Types
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Choose which types of alerts you want to receive.
        </p>
        <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl px-4">
          <ToggleRow
            label="Rent Due Reminders"
            description="Get notified when a tenant's rent is due or overdue."
            enabled={settings.rentDueEnabled}
            onChange={(v) => update({ rentDueEnabled: v })}
            disabled={!settings.enabled}
          />
          <ToggleRow
            label="Lease Expiry Alerts"
            description="Get alerted when a lease or agricultural contract is about to expire."
            enabled={settings.leaseExpiryEnabled}
            onChange={(v) => update({ leaseExpiryEnabled: v })}
            disabled={!settings.enabled}
          />
          <ToggleRow
            label="Maintenance Reminders"
            description="Get reminded when a property hasn't been serviced in 6+ months."
            enabled={settings.maintenanceEnabled}
            onChange={(v) => update({ maintenanceEnabled: v })}
            disabled={!settings.enabled}
          />
        </div>
      </div>

      {/* Timing */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Notification Timing
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Rent alert — days before due
            </label>
            <select
              disabled={!settings.enabled}
              value={settings.daysBeforeRentDue}
              onChange={(e) =>
                update({ daysBeforeRentDue: Number(e.target.value) })
              }
              className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:outline-none disabled:opacity-50"
            >
              <option value={3}>3 days before</option>
              <option value={7}>7 days before</option>
              <option value={14}>14 days before</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Lease alert — days before expiry
            </label>
            <select
              disabled={!settings.enabled}
              value={settings.daysBeforeLeaseExpiry}
              onChange={(e) =>
                update({ daysBeforeLeaseExpiry: Number(e.target.value) })
              }
              className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:outline-none disabled:opacity-50"
            >
              <option value={30}>30 days before</option>
              <option value={60}>60 days before</option>
              <option value={90}>90 days before</option>
            </select>
          </div>
        </div>
      </div>

      {/* Browser push */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          Browser Push Notifications
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Receive a native browser notification once a day for urgent alerts,
          even when the tab isn&apos;t in focus.
        </p>

        {browserPermission === "unsupported" ? (
          <p className="text-xs text-gray-400 italic">
            Your browser doesn&apos;t support push notifications.
          </p>
        ) : browserPermission === "denied" ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ Browser notifications are blocked. Please enable them in your
            browser settings and reload the page.
          </p>
        ) : (
          <div className="flex items-center gap-3">
            {browserPermission !== "granted" && (
              <button
                onClick={handleRequestBrowserPermission}
                disabled={!settings.enabled}
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Allow browser notifications
              </button>
            )}
            {browserPermission === "granted" && (
              <ToggleRow
                label="Enable push notifications"
                description="Fire a browser notification daily for unread urgent alerts."
                enabled={settings.browserPushEnabled}
                onChange={(v) => update({ browserPushEnabled: v })}
                disabled={!settings.enabled}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<
    "security" | "account" | "notifications"
  >(() => {
    const tab = searchParams.get("tab");
    if (tab === "notifications") return "notifications";
    return "account";
  });

  const backUrl = useMemo(() => {
    const from = searchParams.get("from");
    if (from === "agriculture") return "/dashboard/agriculture";
    if (from === "realestate") return "/dashboard/realestate";
    if (
      typeof window !== "undefined" &&
      document.referrer.includes("agriculture")
    )
      return "/dashboard/agriculture";
    if (
      typeof window !== "undefined" &&
      document.referrer.includes("realestate")
    )
      return "/dashboard/realestate";
    return "/dashboard";
  }, [searchParams]);

  const tabs = [
    {
      id: "account" as const,
      label: "Account",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: "notifications" as const,
      label: "Notifications",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: "security" as const,
      label: "Security",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
  ];

  const sharedClassNames = {
    base: "border border-gray-300 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] shadow-sm rounded-lg overflow-hidden",
    header:
      "bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800 px-6 py-4",
    title: "text-gray-900 dark:text-white font-semibold text-lg",
    description: "text-gray-600 dark:text-gray-400 text-sm mt-1",
    content: "bg-white dark:bg-[#0a0a0a] px-6 py-4",
    footer:
      "bg-gray-50 dark:bg-[#111111] border-t border-gray-200 dark:border-gray-800 px-6 py-4",
    input:
      "bg-white dark:bg-black text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent",
    button:
      "bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2 rounded-md font-medium transition-colors",
    instructions: "text-gray-600 dark:text-gray-400",
  };

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => router.push("/dashboard/agriculture")}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900 transition-colors"
            >
              <span role="img" aria-label="agriculture">
                🌾
              </span>{" "}
              Agriculture
            </button>
            <button
              onClick={() => router.push("/dashboard/realestate")}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
            >
              <span role="img" aria-label="real estate">
                🏠
              </span>{" "}
              Real Estate
            </button>
            <button
              onClick={() => router.push(backUrl)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white ml-auto"
            >
              <span className="text-lg">←</span> Back to Dashboard
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 ml-12 lg:ml-0">
            Settings
          </h1>

          <AuthLoading>
            <SettingsSkeleton />
          </AuthLoading>

          {/* Tabs Navigation */}
          <div className="border border-gray-300 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] shadow-sm rounded-lg overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-800">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-colors ${
                    activeTab === tab.id
                      ? "text-black dark:text-white bg-gray-100 dark:bg-white/10 border-b-2 border-black dark:border-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2942]"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6">
              {activeTab === "notifications" && <NotificationsTab />}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <CustomTwoFactorCard classNames={sharedClassNames} />
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Change Password
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Update your password regularly for better security
                    </p>
                    <ChangePasswordCard classNames={sharedClassNames} />
                  </div>
                </div>
              )}

              {activeTab === "account" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Email Address
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Update the email address associated with your account
                    </p>
                    <ChangeEmailCard classNames={sharedClassNames} />
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Delete Account
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Permanently delete your account and all associated data
                    </p>
                    <DeleteAccountCard
                      classNames={{
                        ...sharedClassNames,
                        button:
                          "bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2 rounded-md font-medium transition-colors",
                      }}
                      localization={{
                        DELETE_ACCOUNT: "Delete Account",
                        DELETE_ACCOUNT_DESCRIPTION:
                          "This action permanently deletes your account and all associated data. This cannot be undone.",
                        DELETE_ACCOUNT_INSTRUCTIONS:
                          "Please confirm your password to proceed with account deletion.",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </main>
  );
}
