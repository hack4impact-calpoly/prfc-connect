import { NextRequest, NextResponse } from "next/server";
import { ChecksumSchema } from "@/schema/referral";
import { calculateChecksum } from "@/utils/checksum";
import { AppError, apiErrorHandler } from "@/utils/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nm, em, ref, cs } = ChecksumSchema.parse(body);

    const cleanedName = nm.replace(/\s+/g, "");
    const generatedChecksum = calculateChecksum(`${em}${cleanedName}${ref}`);

    if (generatedChecksum !== cs) {
      throw new AppError("VALIDATION_ERROR", "Checksum mismatch");
    }

    return NextResponse.json({ message: "Checksum validated successfully." }, { status: 200 });
  } catch (error) {
    return apiErrorHandler(error);
  }
}
