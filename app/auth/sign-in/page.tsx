"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthView } from "@daveyplate/better-auth-ui";
import { Building2, Home, ArrowLeft, CheckCircle2 } from "lucide-react";

type LoginRole = "manager" | "tenant";

function SignInContent() {
  const searchParams = useSearchParams();
  const selectedRole = searchParams.get("role") as LoginRole | null;
  const error = searchParams.get("error");
  const actualRole = searchParams.get("actualRole");

  if (!selectedRole || !["manager", "tenant"].includes(selectedRole)) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-10 flex items-center justify-center">
        <section className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-10">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              PropFusion
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Choose how you want to sign in
            </h1>
            <p className="mt-3 text-base text-slate-600">
              Select your account type. Your saved account role will still be verified securely after login.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/auth/sign-in?role=manager"
              className="group rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:border-slate-950 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Building2 className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-950">
                Property Manager
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Manage properties, leases, tenants, transactions, and reports.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                Continue as manager
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>

            <Link
              href="/auth/sign-in?role=tenant"
              className="group rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:border-slate-950 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-950">
                <Home className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-950">Tenant</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                View lease information, payment history, and pay rent through your tenant portal.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                Continue as tenant
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </div>

          <div className="mt-7 flex items-center justify-center gap-2 text-sm text-slate-500">
            <CheckCircle2 className="h-4 w-4" />
            Tenant accounts are created through a property-manager invitation.
          </div>
        </section>
      </main>
    );
  }

  const isTenant = selectedRole === "tenant";
  const callbackURL = `/auth/post-signin-redirect?expectedRole=${selectedRole}`;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-md">
        <Link
          href="/auth/sign-in"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Change account type
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/50">
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Signing in as
            </p>
            <div className="mt-1 flex items-center justify-center gap-2 font-semibold text-slate-950">
              {isTenant ? <Home className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              {isTenant ? "Tenant" : "Property Manager"}
            </div>
          </div>

          {error === "role-mismatch" && (
            <div className="mx-3 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              This account is registered as {actualRole === "tenant" ? "a tenant" : "a property manager"}. Please choose the matching account type.
            </div>
          )}

          <AuthView view="SIGN_IN" callbackURL={callbackURL} />
        </div>

        {isTenant && (
          <p className="mt-4 text-center text-sm text-slate-500">
            Don&apos;t have tenant credentials? Open the invitation sent by your property manager first.
          </p>
        )}
      </section>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading sign in…</div>}>
      <SignInContent />
    </Suspense>
  );
}
