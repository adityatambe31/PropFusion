"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/dashboard/NotificationPanel";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Icon,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { farm } from "@lucide/lab";
import {
  getUserAvatarColor,
  getUserInitials,
  getUserDisplayName,
} from "@/lib/helpers/avatar-utils";
import { DashboardIcon } from "@/components/dashboard/DashboardIcon";
import { useRealEstateContext } from "@/app/dashboard/realestate/real-estate-context";
import { useAgricultureContext } from "@/app/dashboard/agriculture/agriculture-context";
import { useLeaseContext } from "@/app/dashboard/leases/lease-context";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <DashboardIcon size={20} />,
  },
];

type RealEstateIconVariant =
  | "home-modern"
  | "home"
  | "office"
  | "office-2"
  | "library"
  | "storefront";

function RealEstateIcon({
  variant,
  className = "h-5 w-5",
}: {
  variant: RealEstateIconVariant;
  className?: string;
}) {
  if (variant === "home-modern") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819"
        />
      </svg>
    );
  }

  if (variant === "home") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    );
  }

  if (variant === "office") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
        />
      </svg>
    );
  }

  if (variant === "office-2") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 21h19.5M4.5 3.75h6.75v17.25H4.5V3.75Zm8.25 5.25h6.75V21h-6.75V9Zm3-3h3.75V9h-3.75V6Zm-9 1.5h1.5m-1.5 3h1.5m-1.5 3h1.5m7.5 0h1.5m-1.5 3h1.5"
        />
      </svg>
    );
  }

  if (variant === "library") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 21h18M4.5 18h15M6 18V9m3 9V9m3 9V9m3 9V9m3 9V9M12 3l9 4.5H3L12 3Z"
        />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21h18M5.25 21V8.25A2.25 2.25 0 0 1 7.5 6h9a2.25 2.25 0 0 1 2.25 2.25V21M9 10.5h6m-6 3h6m-6 3h6M8.25 6V4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V6"
      />
    </svg>
  );
}

const realEstateIconVariants: RealEstateIconVariant[] = [
  "home-modern",
  "home",
  "library",
  "office",
  "office-2",
  "storefront",
];

function getRealEstateIconVariant(seed: string, index = 0): RealEstateIconVariant {
  const total = realEstateIconVariants.length;
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return realEstateIconVariants[(hash + index) % total];
}

export function Sidebar({
  type = "default",
  data = [],
  isMobileOpen = false,
  setIsMobileOpen = () => {},
}: {
  type?: "agriculture" | "real-estate" | "default";
  data?: Array<{
    id: string;
    name: string;
    tenants?: Array<{ id: string; name: string }>;
  }>;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Get user avatar color based on user ID
  const avatarColor = session?.user?.id
    ? getUserAvatarColor(session.user.id)
    : { from: "from-blue-500", to: "to-purple-600" };

  // Get user initials
  const userInitials = getUserInitials(
    session?.user?.name,
    session?.user?.email,
  );

  // Get display name
  const displayName = getUserDisplayName(
    session?.user?.name,
    session?.user?.email,
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth/sign-in");
  };

  // Call hooks unconditionally at the top level
  // Hooks must always be called in the same order on every render
  const realEstateContext = useRealEstateContext();
  const agricultureContext = useAgricultureContext();
  const leaseContext = useLeaseContext();

  const properties = realEstateContext?.properties || [];
  const lands = agricultureContext?.lands || [];
  const leases = leaseContext?.leases || [];

  // Calculate sections to show
  const showRealEstate =
    type === "real-estate" ||
    (type === "default" && properties && properties.length > 0);
  const showAgriculture =
    type === "agriculture" || (type === "default" && lands && lands.length > 0);

  // States for collapsible sections
  const [isRealEstateOpen, setIsRealEstateOpen] = useState(true);
  const [isAgricultureOpen, setIsAgricultureOpen] = useState(true);
  const [isLeasesOpen, setIsLeasesOpen] = useState(true);

  // Section toggle for detail views
  const [sectionOpen, setSectionOpen] = useState(true);
  const [itemTenantsOpen, setItemTenantsOpen] = useState<
    Record<string, boolean>
  >({});

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={`flex flex-col h-screen bg-white dark:bg-black text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out z-50 ${
          isMobileOpen
            ? "fixed left-0 top-0"
            : "fixed -left-full lg:sticky top-0"
        }`}
        style={{ width: isCollapsed ? "4.5rem" : "16rem" }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
            <div
              className={`flex items-center gap-2 overflow-hidden transition-all duration-200 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-white dark:text-black font-bold text-sm">
                    P
                  </span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  PropFusion
                </span>
              </Link>
            </div>
            {/* Collapsed state logo */}
            <div
              className={`absolute left-4 top-4 transition-all duration-200 ${isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white dark:text-black font-bold text-sm">
                  P
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="hidden lg:block">
                {!isCollapsed && <NotificationBell align="left" />}
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`p-1.5 hover:bg-gray-100 dark:hover:bg-[#0a0a0a] rounded-lg transition-colors shrink-0 ${isCollapsed ? "mx-auto mt-12" : ""}`}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div
            className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-4"
            style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
          >
            {/* Main Menu */}
            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-xl transition-colors
                      ${
                        isActive
                          ? "bg-gray-100 dark:bg-[#1f1f1f] text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#111]"
                      }
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <span
                      className={
                        isActive
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-400"
                      }
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Real Estate Section */}
            {showRealEstate && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                {!isCollapsed ? (
                  <div className="px-3 mb-2 flex items-center justify-between group">
                    <Link
                      href="/dashboard/realestate"
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Real Estate
                    </Link>
                    <button
                      onClick={() => setIsRealEstateOpen(!isRealEstateOpen)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isRealEstateOpen ? "" : "-rotate-90"
                        }`}
                      />
                    </button>
                  </div>
                ) : (
                  <div
                    className="px-3 mb-2 flex justify-center"
                    title="Real Estate"
                  >
                    <span className="text-xs font-bold text-gray-500">RE</span>
                  </div>
                )}

                {isRealEstateOpen && (
                  <div className="space-y-1">
                    {properties?.map((property) => (
                      <Link
                        key={property.id}
                        href={`/dashboard/realestate/${property.id}`}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-xl transition-colors
                          text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#111]
                        `}
                        title={isCollapsed ? property.name : undefined}
                      >
                        <span className="text-gray-500 dark:text-gray-400">
                          <RealEstateIcon
                            variant={getRealEstateIconVariant(
                              `${property.id}-${property.name}`,
                            )}
                          />
                        </span>
                        {!isCollapsed && (
                          <span className="truncate">{property.name}</span>
                        )}
                      </Link>
                    ))}
                    {(!properties || properties.length === 0) &&
                      !isCollapsed && (
                        <div className="px-3 py-2 text-sm text-gray-400 italic">
                          No properties
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* Agriculture Section */}
            {showAgriculture && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                {!isCollapsed ? (
                  <div className="px-3 mb-2 flex items-center justify-between group">
                    <Link
                      href="/dashboard/agriculture"
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Agriculture
                    </Link>
                    <button
                      onClick={() => setIsAgricultureOpen(!isAgricultureOpen)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isAgricultureOpen ? "" : "-rotate-90"
                        }`}
                      />
                    </button>
                  </div>
                ) : (
                  <div className="px-3 mb-2 flex justify-center" title="Agriculture">
                    <span className="text-xs font-bold text-gray-500">AG</span>
                  </div>
                )}

                {isAgricultureOpen && (
                  <div className="space-y-1">
                    {lands?.map((land) => (
                      <Link
                        key={land.id}
                        href={`/dashboard/agriculture/${land.id}`}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-xl transition-colors
                          text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#111]
                        `}
                        title={isCollapsed ? land.name : undefined}
                      >
                        <Icon
                          iconNode={farm}
                          className="h-5 w-5 text-green-600 dark:text-green-400"
                        />
                        {!isCollapsed && <span className="truncate">{land.name}</span>}
                      </Link>
                    ))}
                    {(!lands || lands.length === 0) && !isCollapsed && (
                      <div className="px-3 py-2 text-sm text-gray-400 italic">
                        No lands
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Leases Section */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              {!isCollapsed ? (
                <div className="px-3 mb-2 flex items-center justify-between group">
                  <Link
                    href="/dashboard/leases"
                    className="text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Leases
                  </Link>
                  <button
                    onClick={() => setIsLeasesOpen(!isLeasesOpen)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isLeasesOpen ? "" : "-rotate-90"}`}
                    />
                  </button>
                </div>
              ) : (
                <div className="px-3 mb-2 flex justify-center" title="Leases">
                  <span className="text-xs font-bold text-gray-500">LS</span>
                </div>
              )}

              {isLeasesOpen && (
                <div className="space-y-1">
                  {leaseContext.loading ? (
                    !isCollapsed && (
                      <div className="px-3 py-2 text-sm text-gray-400 italic">
                        Loading leases...
                      </div>
                    )
                  ) : leases.length > 0 ? (
                    leases.map((lease) => (
                      <Link
                        key={lease.id}
                        href={`/dashboard/leases/${lease.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#111]"
                        title={isCollapsed ? lease.tenant?.name || "Lease" : undefined}
                      >
                        <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />
                        {!isCollapsed && (
                          <div className="min-w-0">
                            <div className="truncate font-medium text-gray-700 dark:text-gray-200">
                              {lease.tenant?.name || "Unnamed tenant"}
                            </div>
                            <div className="truncate text-xs text-gray-400">
                              {lease.property?.name || "Unknown property"}
                            </div>
                          </div>
                        )}
                      </Link>
                    ))
                  ) : (
                    !isCollapsed && (
                      <div className="px-3 py-2 text-sm text-gray-400 italic">
                        No leases
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Reports Section */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              {!isCollapsed ? (
                <div className="px-3 mb-2 flex items-center justify-between group">
                  <Link
                    href="/dashboard/reports"
                    className="text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Reports
                  </Link>
                </div>
              ) : (
                <div className="px-3 mb-2 flex justify-center" title="Reports">
                  <span className="text-xs font-bold text-gray-500">RP</span>
                </div>
              )}
              {/* Optionally, you could preview recent reports or add quick links here in the future */}
            </div>

            {/* Dynamic Section for specific context view - maintained for backward compatibility with page details */}
            {type !== "default" && data.length > 0 && (
              <div className="pt-4">
                <button
                  onClick={() => setSectionOpen((v) => !v)}
                  className={`flex items-center gap-2 px-3 py-2 w-full text-sm font-semibold ${
                    type === "agriculture"
                      ? "text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900"
                      : "text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900"
                  } rounded-lg`}
                >
                  <span>
                    {type === "agriculture" ? (
                      <Icon
                        iconNode={farm}
                        className="h-5 w-5 text-green-600 dark:text-green-400"
                      />
                    ) : (
                      <RealEstateIcon variant="office" className="h-5 w-5" />
                    )}
                  </span>
                  <span className="flex-1 text-left">
                    {type === "agriculture"
                      ? "Agriculture Lands"
                      : "Real Estate Properties"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${sectionOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {sectionOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {data.map((item) => (
                      <div key={item.id}>
                        <button
                          onClick={() =>
                            setItemTenantsOpen((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                          className="flex items-center gap-2 px-2 py-1 w-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0a0a0a] rounded"
                        >
                          <span className="truncate flex-1">{item.name}</span>
                          <ChevronDown
                            className={`w-3 h-3 transition-transform ${itemTenantsOpen[item.id] ? "rotate-180" : ""}`}
                          />
                        </button>
                        {itemTenantsOpen[item.id] && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.tenants?.map((tenant, idx: number) => (
                              <span
                                key={idx}
                                className="block px-2 py-1 text-xs text-gray-500 dark:text-gray-400 truncate"
                              >
                                👤 {tenant.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <Link
                      href={
                        type === "agriculture"
                          ? "/dashboard/agriculture/reports"
                          : "/dashboard/realestate/reports"
                      }
                      className={`flex items-center gap-2 px-2 py-1 text-sm ${type === "agriculture" ? "text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900" : "text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900"} rounded mt-2`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Reports</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div
            className="p-3 border-t border-gray-200 dark:border-gray-800 mt-auto relative overflow-visible"
            ref={profileMenuRef}
          >
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className={`flex items-center ${isCollapsed ? "justify-center px-2" : "gap-2 sm:gap-3 px-2 sm:px-3"} py-2 w-full text-sm hover:bg-gray-100 dark:hover:bg-[#0a0a0a] rounded-lg transition-colors`}
                title={isCollapsed ? displayName : undefined}
              >
                <div
                  className={`w-8 h-8 shrink-0 rounded-full ${!session?.user?.image ? `bg-linear-to-b ${avatarColor.from} ${avatarColor.to}` : ""} flex items-center justify-center text-white font-semibold text-xs sm:text-sm overflow-hidden`}
                >
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={displayName}
                      className="w-full h-full object-cover rounded-full"
                      width={32}
                      height={32}
                    />
                  ) : (
                    userInitials
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm truncate">
                        {displayName}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 truncate">
                        {session?.user?.email || "user@example.com"}
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                        profileMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </>
                )}
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div
                  className={`absolute bottom-full mb-2 bg-white dark:bg-[#0a0a0a] rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden z-50 ${
                    isCollapsed ? "left-full ml-2 w-48" : "left-0 right-0"
                  }`}
                >
                  <Link
                    href="/dashboard/account/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a2942] transition-colors"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setIsMobileOpen(false);
                    }}
                  >
                    <User className="w-5 h-5" />
                    <span>View Profile</span>
                  </Link>
                  <ThemeToggle />
                  <Link
                    href="/dashboard/account/settings"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a2942] transition-colors"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setIsMobileOpen(false);
                    }}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-3 px-4 py-3 w-full text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#1a2942] transition-colors border-t border-gray-200 dark:border-gray-800"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
