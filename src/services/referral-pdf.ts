import "server-only";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ApiReferral } from "@/schema/api";
import { transformError } from "@/utils/errors";

interface GenerateReferralPdfParams {
  referrals: ApiReferral[];
  exportedByOwnerid: number;
  exportedAt: Date;
}

const COLUMN_HEADERS = ["Date", "Member Name", "Member Email", "Prospect Name", "Prospect Email", "Code", "Redeemed"];

function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function generateReferralPdf({ referrals, exportedByOwnerid, exportedAt }: GenerateReferralPdfParams): Buffer {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text("Paso Food Co-op Referral Database", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(10);
    doc.text(
      `Exported by ${exportedByOwnerid} on ${formatDate(exportedAt)} (${referrals.length} records)`,
      pageWidth / 2,
      22,
      { align: "center" },
    );

    const tableRows = referrals.map((referral) => [
      formatDate(referral.createdAt),
      referral.memberName,
      referral.memberEmail,
      referral.prospectName,
      referral.prospectEmail,
      referral.referralCode,
      referral.redeemed ? "Yes" : "No",
    ]);

    autoTable(doc, {
      head: [COLUMN_HEADERS],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [131, 16, 2] },
      alternateRowStyles: { fillColor: [237, 221, 204] },
      margin: { left: 10, right: 10 },
    });

    return Buffer.from(doc.output("arraybuffer"));
  } catch (error) {
    throw transformError(error);
  }
}
