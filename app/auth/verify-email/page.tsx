"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!token) return;

    setRedirecting(true);
    const callbackURL = "/auth/post-signin-redirect";
    const target = `/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent(callbackURL)}`;
    window.location.replace(target);
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-4">
      <div className="w-full max-w-md text-center">
        {redirecting ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verifying Email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting to secure email verification...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Mail className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Check Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              We sent you a verification link. Open it to activate your account,
              then continue to sign in.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/auth/sign-in"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Go to Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="inline-block px-6 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition"
              >
                Create Another Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-4">
          <div className="w-full max-w-md text-center space-y-4">
            <div className="flex justify-center">
              <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verifying Email
            </h1>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
