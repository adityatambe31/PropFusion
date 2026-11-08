import { auth } from "@/lib/auth/auth";
import { getDb } from "@/lib/db/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = "";
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    id = resolvedParams.id;
    const body = await req.json();

    const db = await getDb();
    const collection = db.collection("properties");

    // Exclude immutable fields from update
    const { _id, id: bodyId, userId, createdAt, ...updateFields } = body;

    const result = await collection.findOneAndUpdate(
      { id, userId: session.user.id },
      {
        $set: {
          ...updateFields,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Remove _id from result
    const { _id: resultDbId, ...responseProperty } = result;

    return NextResponse.json({ property: responseProperty });
  } catch (error) {
    console.error(`Error in PUT /api/properties/${id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = "";
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    id = resolvedParams.id;

    const db = await getDb();
    const result = await db
      .collection("properties")
      .deleteOne({ id, userId: session.user.id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error in DELETE /api/properties/${id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
