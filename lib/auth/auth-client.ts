import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { resolveAppURL } from "@/lib/url";

const envBaseURL = process.env.NEXT_PUBLIC_APP_URL;
const browserOrigin =
  typeof window !== "undefined" ? window.location.origin : undefined;

const resolvedBaseURL = resolveAppURL({
  browserOrigin,
  requestOrigin: envBaseURL,
});

export const authClient = createAuthClient({
  baseURL: resolvedBaseURL,
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        // This is called when user signs in and has 2FA enabled
        window.location.href = "/dashboard/account/verify-2fa";
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
