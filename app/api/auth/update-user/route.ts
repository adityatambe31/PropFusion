import { auth } from "@/lib/auth/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, image } = body;

    if (!name && !image) {
      return NextResponse.json(
        { error: "At least one field is required" },
        { status: 400 },
      );
    }

    const updateData: Record<string, string> = {};

    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (image && typeof image === "string") {
      updateData.image = image;
    }

    // Update user using Better Auth
    await auth.api.updateUser({
      headers: req.headers,
      body: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
