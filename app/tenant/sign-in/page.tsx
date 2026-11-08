import { redirect } from "next/navigation";

export default function TenantSignIn() {
  // Force tenant login mode so role checks and redirects stay in the tenant flow.
  redirect("/auth/sign-in?role=tenant");
}
