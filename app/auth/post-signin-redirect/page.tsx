"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/auth-client";

type AppRole = "manager" | "tenant" | "admin";

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const expectedRole = searchParams.get("expectedRole");

  useEffect(() => {
    async function redirectUser() {
      if (isPending) return;

      if (!session?.user) {
        const roleQuery = expectedRole ? `?role=${expectedRole}` : "";
        router.replace(`/auth/sign-in${roleQuery}`);
        return;
      }

      if (!session.user.emailVerified) {
        router.replace("/auth/verify-email");
        return;
      }

      try {
        const response = await fetch("/api/auth/user-access", {
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/auth/sign-in");
          return;
        }

        const access = (await response.json()) as { role: AppRole };
        const actualLoginType = access.role === "tenant" ? "tenant" : "manager";

        if (
          (expectedRole === "tenant" || expectedRole === "manager") &&
          expectedRole !== actualLoginType
        ) {
          router.replace(
            `/auth/sign-in?role=${expectedRole}&error=role-mismatch&actualRole=${actualLoginType}`,
          );
          return;
        }

        if (access.role === "tenant") {
          router.replace("/tenant/dashboard");
          return;
        }

        if (access.role === "admin") {
          router.replace("/dashboard/admin/audit");
          return;
        }

        const onboarded = localStorage.getItem(`onboarded_${session.user.id}`);
        router.replace(
          onboarded === "true" ? "/dashboard" : "/onboarding/select-portfolio",
        );
      } catch (error) {
        console.error("Unable to determine account access:", error);
        router.replace("/auth/sign-in");
      }
    }

    void redirectUser();
  }, [expectedRole, isPending, router, session]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-base text-slate-700">
      Checking your account and redirecting…
    </div>
  );
}

export default function PostSignInRedirect() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Redirecting…</div>}>
      <RedirectContent />
    </Suspense>
  );
}
