import { NextRequest, NextResponse } from "next/server";
import { ReferralFormSchema } from "@/schema/referral";
import { createManyReferrals, getAllReferrals } from "@/services/referral-store";
import { sendReferralEmails } from "@/services/email-service";
import { apiErrorHandler } from "@/utils/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberName, memberEmail, referralCode, prospects } = ReferralFormSchema.parse(body);

    await sendReferralEmails({ prospects, referralCode, memberName });

    const referrals = prospects.map((prospect) => ({
      memberName,
      memberEmail,
      prospectName: prospect.prospectName,
      prospectEmail: prospect.prospectEmail,
      referralCode,
      redeemed: false,
    }));

    const newReferrals = await createManyReferrals(referrals);

    return NextResponse.json({ message: "Referrals created successfully!", referrals: newReferrals }, { status: 201 });
  } catch (error) {
    return apiErrorHandler(error);
  }
}

export async function GET() {
  try {
    const referrals = await getAllReferrals();
    return NextResponse.json(referrals, { status: 200 });
  } catch (error) {
    return apiErrorHandler(error);
  }
}
