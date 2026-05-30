import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/dal";
import { ReferralExportQuerySchema } from "@/schema/api";
import { getAllReferrals } from "@/services/referral";
import { generateReferralPdf } from "@/services/referral-pdf";
import { apiErrorHandler } from "@/utils/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();

    const url = new URL(req.url);
    const parsed = ReferralExportQuerySchema.safeParse({ ids: url.searchParams.get("ids") });

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid or missing ids parameter" } },
        { status: 400 },
      );
    }

    const ids = parsed.data.ids;
    const idSet = new Set(ids);
    const exportedAt = new Date();

    console.info("[AUDIT] referral_pdf_export", session.ownerid, ids.length);

    const allReferrals = await getAllReferrals();
    const found = allReferrals.filter((referral) => idSet.has(referral.id));

    const pdf = generateReferralPdf({
      referrals: found,
      exportedByOwnerid: session.ownerid,
      exportedAt,
    });

    const filename = `referrals-${exportedAt.toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiErrorHandler(error);
  }
}
