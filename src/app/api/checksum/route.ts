import { NextRequest, NextResponse } from "next/server";
import { ChecksumSchema } from "@/schema/api";
import { calculateChecksum } from "@/utils/checksum";
import { AppError, apiErrorHandler } from "@/utils/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberName, memberEmail, referralCode, checksum } = ChecksumSchema.parse(body);

    const nameWithoutSpaces = memberName.replace(/\s+/g, "");
    const expectedChecksum = calculateChecksum(`${memberEmail}${nameWithoutSpaces}${referralCode}`);

    if (expectedChecksum !== checksum) {
      throw new AppError("VALIDATION_ERROR", "Checksum mismatch");
    }

    return NextResponse.json({ message: "Checksum validated successfully." }, { status: 200 });
  } catch (error) {
    return apiErrorHandler(error);
  }
}
