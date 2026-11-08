"use client";

import { useEffect, useState } from "react";
import { RealEstateProvider } from "./realestate/real-estate-context";
import { LeaseProvider } from "./leases/lease-context";
import { AgricultureProvider } from "./agriculture/agriculture-context";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { useSession } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      router.replace("/auth/sign-in?role=manager");
      return;
    }

    async function checkRole() {
      try {
        const response = await fetch("/api/auth/user-access", { cache: "no-store" });
        if (!response.ok) {
          router.replace("/auth/sign-in?role=manager");
          return;
        }
        const access = (await response.json()) as { role: string };
        if (access.role === "tenant") {
          router.replace("/tenant/dashboard");
          return;
        }
        setAccessChecked(true);
      } catch {
        router.replace("/auth/sign-in?role=manager");
      }
    }

    void checkRole();
  }, [isPending, session, router]);

  if (isPending || !session?.user || !accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-gray-500 dark:text-gray-400">
        Loading dashboard...
      </div>
    );
  }

  return (
    <RealEstateProvider>
      <LeaseProvider>
        <AgricultureProvider>
          <div className="flex min-h-screen bg-gray-50 dark:bg-black">
            {/* Global Sidebar */}
            <Sidebar
              isMobileOpen={isMobileMenuOpen}
              setIsMobileOpen={setIsMobileMenuOpen}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
              <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

              <main className="flex-1 overflow-y-auto scroll-smooth">
                {children}
              </main>
            </div>
          </div>
        </AgricultureProvider>
      </LeaseProvider>
    </RealEstateProvider>
  );
}
