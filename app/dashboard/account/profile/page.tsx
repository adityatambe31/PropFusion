"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AuthLoading } from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth/auth-client";
import { getUserAvatarColor, getUserInitials } from "@/lib/helpers/avatar-utils";
import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
    </div>
  );
}

function CombinedProfileCard() {
  const { data: session, refetch } = authClient.useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user avatar color based on user ID
  const avatarColor = session?.user?.id
    ? getUserAvatarColor(session.user.id)
    : { from: "from-blue-500", to: "to-purple-600" };

  const userInitials = getUserInitials(
    session?.user?.name,
    session?.user?.email,
  );

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update name if changed
      if (name.trim() && name !== session?.user?.name) {
        const response = await fetch("/api/auth/update-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            image: avatarPreview || undefined,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update profile");
        }

        toast.success("Profile updated successfully!");

        // Force refetch session data to update sidebar
        await refetch();

        // Reset form state
        setAvatarFile(null);
        setAvatarPreview(null);
      } else if (avatarPreview) {
        const response = await fetch("/api/auth/update-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: avatarPreview,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update avatar");
        }

        toast.success("Avatar updated successfully!");

        // Force refetch session data instead of full page reload
        await refetch();

        // Reset form state
        setAvatarFile(null);
        setAvatarPreview(null);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="border border-gray-300 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] shadow-sm rounded-lg overflow-hidden">
        <div className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <h3 className="text-gray-900 dark:text-white font-semibold text-lg">
            Profile Information
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Update your avatar and display name
          </p>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] px-6 py-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                type="button"
                onClick={handleAvatarClick}
                className="relative group cursor-pointer"
              >
                {avatarPreview || session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview || session?.user?.image || ""}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div
                    className={`w-24 h-24 rounded-full bg-linear-to-br ${avatarColor.from} ${avatarColor.to} flex items-center justify-center text-white text-2xl font-semibold border-4 border-gray-200 dark:border-gray-700`}
                  >
                    {userInitials}
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                Profile Picture
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Click on the avatar to upload a custom image. JPG, PNG or GIF
                (max. 5MB)
              </p>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-white dark:bg-black text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-[#111111] border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Changes will be reflected across the application
          </p>
          <button
            type="submit"
            disabled={
              isLoading ||
              (!name.trim() && !avatarFile) ||
              (name === session?.user?.name && !avatarFile)
            }
            className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-white dark:text-black px-6 py-2 rounded-md font-medium transition-colors"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}


export default function ProfilePage() {
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

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push(backUrl)}
            className="mb-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
          >
            <span className="text-lg">←</span> Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
            Profile
          </h1>

          <AuthLoading>
            <ProfileSkeleton />
          </AuthLoading>

          <CombinedProfileCard />
        </div>
    </main>
  );
}
