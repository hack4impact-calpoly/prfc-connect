import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { ReferralDataGrid } from "@/components/referral/referral-data-grid";

export default async function ReferralDatabasePage() {
  const session = await verifySession();
  if (!session.isAdmin) redirect("/forbidden");

  return (
    <div>
      <h1 className="font-komika text-[2rem] text-[#333] mb-4">Referral History</h1>
      <ReferralDataGrid />
    </div>
  );
}
