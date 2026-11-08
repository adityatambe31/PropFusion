import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getAccessContext } from "@/lib/auth/access";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getAccessContext(session.user.id);

  return NextResponse.json({
    role: access.role,
    leaseId: access.leaseId ?? null,
    email: access.email ?? session.user.email,
  });
}
