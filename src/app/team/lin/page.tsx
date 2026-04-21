"use client";
import { SmsConsentCard } from "@/components/settings/sms-consent-card";
import { EntityCard } from "@/components/groups/entity-card";
import { useState } from "react";

export default function LinPage() {
  const [hasConsent1, setHasConsent1] = useState(false);
  const [hasConsent2, setHasConsent2] = useState(true);
  const [isRevoking1, setIsRevoking1] = useState(false);
  const [isRevoking2, setIsRevoking2] = useState(false);

  const handleRevoke1 = async () => {
    setIsRevoking1(true);
    // Simulate async revoke call
    await new Promise((r) => setTimeout(r, 1000));
    setHasConsent1(false);
    setIsRevoking1(false);
  };

  const handleRevoke2 = async () => {
    setIsRevoking2(true);
    // Simulate async revoke call
    await new Promise((r) => setTimeout(r, 1000));
    setHasConsent2(false);
    setIsRevoking2(false);
  };

  return (
    <div className="p-20 flex flex-col items-center gap-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">SMS Consent Card Preview</h1>

      <SmsConsentCard
        phone="+1 (111) 111-1111"
        hasConsent={hasConsent1}
        onRevoke={handleRevoke1}
        isRevoking={isRevoking1}
      />
      <SmsConsentCard
        phone="+1 (222) 222-2222"
        hasConsent={hasConsent2}
        onRevoke={handleRevoke2}
        isRevoking={isRevoking2}
      />

      <h1 className="text-2xl font-bold mb-4">Entity Card Preview</h1>

      <EntityCard
        name="Garden Club"
        memberCount={5}
        description="A group for garden enthusiasts who love growing vegetables and sharing tips about sustainable farming practices."
        onClick={() => alert("Clicked Garden Club")}
      />

      <EntityCard
        name="Volunteer Team"
        memberCount={1}
        description={null}
        onClick={() => alert("Clicked Volunteer Team")}
      />

      <EntityCard
        name="Community Outreach"
        memberCount={12}
        description="Short description"
        onClick={() => alert("Clicked Community Outreach")}
      />

      <EntityCard variant="add" onClick={() => alert("Add new group")} />
    </div>
  );
}
