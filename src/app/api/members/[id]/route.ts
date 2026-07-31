import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { getMemberById } from "@/lib/api/member-api";
import { StringIntSchema } from "@/schema/common";
import { AppError, apiErrorHandler } from "@/utils/errors";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifySession();

    const { id } = await params;
    const memberId = StringIntSchema.parse(id);
    const member = await getMemberById(memberId);

    if (!member) {
      throw new AppError("NOT_FOUND", "Member not found");
    }

    return NextResponse.json(member, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiErrorHandler(error);
  }
}
