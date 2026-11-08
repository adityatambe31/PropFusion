"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";

export default function Verify2FAPage() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid verification code");
        setIsLoading(false);
      } else {
        toast.success("2FA verified successfully!");
        // Wait a moment for the session to update
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 500);
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      toast.error((error as Error)?.message || "Failed to verify 2FA code");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
      <div className="w-full max-w-md p-8 bg-white dark:bg-[#0a0a0a] rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Two-Factor Authentication
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Enter the 6-digit code from your authenticator app
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
            >
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="w-full px-4 py-3 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-center text-lg tracking-widest font-mono"
              maxLength={6}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full px-4 py-2 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-white dark:text-black rounded-lg font-medium transition-colors"
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>

          <button
            type="button"
            onClick={() => router.push(backUrl)}
            className="w-full text-gray-600 dark:text-gray-400 text-sm hover:text-gray-900 dark:hover:text-gray-200"
          >
            ← Back to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
