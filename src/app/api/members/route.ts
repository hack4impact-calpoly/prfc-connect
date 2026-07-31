import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { getAllMembers } from "@/lib/api/member-api";
import { apiErrorHandler } from "@/utils/errors";

export async function GET() {
  try {
    await verifySession();

    const members = await getAllMembers();

    return NextResponse.json(members, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiErrorHandler(error);
  }
}
