import { Suspense } from "react";
import AcceptTenantInviteClient from "./AcceptTenantInviteClient";

export default function AcceptTenantInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center p-6">Loading invite...</div>}>
      <AcceptTenantInviteClient />
    </Suspense>
  );
}
