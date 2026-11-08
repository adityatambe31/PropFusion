"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import Link from "next/link";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    setIsLoading(true);

    try {
      await authClient.resetPassword(
        {
          newPassword: password,
          token,
        },
        {
          onSuccess: async () => {
            toast.success("Password reset successfully! Signing you out...");
            await authClient.signOut();
            setTimeout(() => {
              router.push("/auth/sign-in");
            }, 1000);
          },
          onError: (ctx) => {
            console.error("Password reset error:", ctx.error);
            toast.error(ctx.error.message || "Failed to reset password");
          },
        },
      );
    } catch (error: unknown) {
      console.error("Caught error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to reset password";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-black dark:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Invalid reset link
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This password reset link is invalid or has expired. Please
                request a new one.
              </p>
              <Link
                href="/auth/forgot-password"
                className="block w-full px-4 py-2 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black text-center rounded-lg font-medium transition-colors"
              >
                Request new reset link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-800">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Set new password
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your new password below. Make sure it&apos;s at least 6
              characters long.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
              >
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
                className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-black dark:text-white">
                Passwords don&apos;t match
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || password !== confirmPassword}
              className="w-full px-4 py-2 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-white dark:text-black rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Resetting..." : "Reset password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/sign-in"
              className="text-sm text-black dark:text-white hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <p className="text-gray-700 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
