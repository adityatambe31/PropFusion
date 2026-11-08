"use client";

import { authClient } from "@/lib/auth/auth-client";
import { useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { toast } from "sonner";

interface CustomTwoFactorCardProps {
  classNames: {
    base: string;
    header: string;
    title: string;
    description: string;
    content: string;
    footer: string;
    input: string;
    button: string;
    instructions: string;
  };
}

export function CustomTwoFactorCard({ classNames }: CustomTwoFactorCardProps) {
  const { data: session } = authClient.useSession();
  const [step, setStep] = useState<"initial" | "qr" | "verify" | "backup">(
    "initial",
  );
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.enable({
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to enable 2FA");
        setIsLoading(false);
        return;
      }

      if (result.data?.totpURI) {
        // Generate QR code from TOTP URI
        const qrUrl = await QRCode.toDataURL(result.data.totpURI);
        setQrCodeUrl(qrUrl);
        setTotpUri(result.data.totpURI);
        setBackupCodes(result.data.backupCodes || []);
        setStep("qr");
        toast.success("Scan the QR code with your authenticator app");
      }
    } catch (error) {
      toast.error((error as Error)?.message || "Failed to enable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: totpCode,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid code. Please try again.");
        setIsLoading(false);
        return;
      }

      toast.success("2FA enabled successfully!");
      setStep("backup");
    } catch (error) {
      toast.error((error as Error)?.message || "Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm("Are you sure you want to disable 2FA?")) return;

    setIsLoading(true);
    try {
      const result = await authClient.twoFactor.disable({
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to disable 2FA");
        return;
      }

      toast.success("2FA disabled successfully");
      setStep("initial");
      setPassword("");
      window.location.reload();
    } catch (error) {
      toast.error((error as Error)?.message || "Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  };

  const handleFinish = () => {
    setStep("initial");
    setPassword("");
    setTotpCode("");
    setQrCodeUrl("");
    setTotpUri("");
    window.location.reload();
  };

  // If 2FA is already enabled
  if (session?.user?.twoFactorEnabled && step === "initial") {
    return (
      <div className={classNames.base}>
        <div className={classNames.header}>
          <h3 className={classNames.title}>Two-Factor Authentication</h3>
          <p className={classNames.description}>
            Two-factor authentication is currently enabled for your account
          </p>
        </div>
        <div className={classNames.content}>
          <p className={classNames.instructions}>
            Your account is protected with two-factor authentication.
            You&apos;ll need to enter a code from your authenticator app when
            signing in.
          </p>
        </div>
        <div className={classNames.footer}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDisable2FA();
            }}
            className="flex items-center gap-4"
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password to disable"
              className={classNames.input}
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className={classNames.button}
            >
              {isLoading ? "Disabling..." : "Disable 2FA"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step 1: Enter password to enable 2FA
  if (step === "initial") {
    return (
      <div className={classNames.base}>
        <div className={classNames.header}>
          <h3 className={classNames.title}>Enable Two-Factor Authentication</h3>
          <p className={classNames.description}>
            Add an extra layer of security to your account
          </p>
        </div>
        <div className={classNames.content}>
          <form onSubmit={handleEnable2FA} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Enter your password to continue
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className={classNames.input}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={classNames.button}
            >
              {isLoading ? "Enabling..." : "Enable 2FA"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step 2: Scan QR Code
  if (step === "qr") {
    return (
      <div className={classNames.base}>
        <div className={classNames.header}>
          <h3 className={classNames.title}>Scan QR Code</h3>
          <p className={classNames.description}>
            Use your authenticator app to scan this QR code
          </p>
        </div>
        <div className={classNames.content}>
          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
              {qrCodeUrl && (
                <Image
                  src={qrCodeUrl}
                  alt="2FA QR Code"
                  className="w-64 h-64"
                  width={256}
                  height={256}
                />
              )}
            </div>

            {/* Manual Entry Option */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                Can&apos;t scan? Enter this code manually:
              </p>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {totpUri.split("secret=")[1]?.split("&")[0] || ""}
              </code>
            </div>

            {/* Verification Form */}
            <form
              onSubmit={handleVerifyTOTP}
              className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800"
            >
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Enter the 6-digit code from your app
                </label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className={`${classNames.input} text-center text-lg tracking-widest font-mono`}
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || totpCode.length !== 6}
                className={classNames.button}
              >
                {isLoading ? "Verifying..." : "Verify & Enable"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Show Backup Codes
  if (step === "backup") {
    return (
      <div className={classNames.base}>
        <div className={classNames.header}>
          <h3 className={classNames.title}>Backup Codes</h3>
          <p className={classNames.description}>
            Save these backup codes in a secure place
          </p>
        </div>
        <div className={classNames.content}>
          <div className="space-y-4">
            <p className={classNames.instructions}>
              You can use these codes to access your account if you lose your
              two-factor authentication method. Each code can only be used once.
            </p>

            {/* Backup Codes Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {backupCodes.map((code, index) => (
                <code
                  key={index}
                  className="text-sm bg-white dark:bg-black text-gray-900 dark:text-white px-3 py-2 rounded border border-gray-200 dark:border-gray-800 font-mono text-center"
                >
                  {code}
                </code>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={copyBackupCodes}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Copy All Codes
              </button>
              <button onClick={handleFinish} className={classNames.button}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
