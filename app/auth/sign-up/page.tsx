"use client";

import { AuthView } from "@daveyplate/better-auth-ui";

export default function SignUp() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md">
        <AuthView view="SIGN_UP" callbackURL="/auth/post-signin-redirect" />
      </div>
    </div>
  );
}
