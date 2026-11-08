"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authClient.requestPasswordReset(
        {
          email,
          redirectTo: `${window.location.origin}/auth/reset-password`,
        },
        {
          onSuccess: () => {
            setEmailSent(true);
            toast.success("Password reset email sent! Check your inbox.");
          },
          onError: (ctx) => {
            console.error("Password reset error:", ctx.error);
            toast.error(ctx.error.message || "Failed to send reset email");
          },
        },
      );
    } catch (error: unknown) {
      console.error("Caught error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to send reset email";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-800">
            <div className="text-center mb-6">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Check your email
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                We&apos;ve sent a password reset link to{" "}
                <strong>{email}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click the link in the email to reset your password. The link
                will expire in 24 hours.
              </p>

              <div className="pt-4">
                <Link
                  href="/auth/sign-in"
                  className="block w-full px-4 py-2 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black text-center rounded-lg font-medium transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>

              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                className="block w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-center text-sm transition-colors"
              >
                Try another email address
              </button>
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
              Reset your password
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-white dark:text-black rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Sending..." : "Send reset link"}
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
