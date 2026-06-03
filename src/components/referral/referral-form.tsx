"use client";

import { useState, useRef, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Component-specific UI state (different from API schema Prospect type)
interface ProspectFormFields {
  email: string;
  fullName: string;
}

export function ReferralForm() {
  const searchParams = useSearchParams();

  // Derive referrer info directly from URL params (no state needed)
  const fullName = (searchParams?.get("nm") || "").trim();
  const nameParts = fullName.split(" ");
  const referrerFirstName = nameParts[0] || "";
  const referrerLastName = nameParts.slice(1).join(" ") || "";
  const referrerEmail = searchParams?.get("em") || "";
  const referralCode = searchParams?.get("ref") || "";
  const signature = searchParams?.get("cs") || "";

  // Lazy initialization for yourEmail (gets cleared on success)
  const [yourEmail, setYourEmail] = useState(() => searchParams?.get("em") || "");
  const [prospects, setProspects] = useState<ProspectFormFields[]>([{ email: "", fullName: "" }]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Idempotency key persists across retries, regenerated only on success
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (isPending) return;
    setErrorMessage("");

    for (let i = 0; i < prospects.length; i++) {
      const prospect = prospects[i];
      if (!prospect.email.trim() || !prospect.fullName.trim()) {
        setErrorMessage(`Please fill out all fields for Prospect ${i + 1}.`);
        return;
      }
    }

    const memberFullName = `${referrerFirstName} ${referrerLastName}`;

    startTransition(async () => {
      try {
        const referralData = {
          memberName: memberFullName.trim(),
          memberEmail: referrerEmail,
          referralCode,
          signature,
          prospects: prospects.map((prospect) => ({
            prospectName: prospect.fullName.trim(),
            prospectEmail: prospect.email,
          })),
        };

        const response = await fetch("/api/referrals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKeyRef.current,
          },
          body: JSON.stringify(referralData),
        });

        if (response.ok) {
          setProspects([{ email: "", fullName: "" }]);
          setYourEmail("");
          setShowConfirmation(true);
          idempotencyKeyRef.current = crypto.randomUUID();
        } else {
          const errorBody = await response.json();
          setErrorMessage(errorBody.error?.message || "Failed to submit the form. Please try again!");
        }
      } catch {
        setErrorMessage("An error occurred while submitting the form.");
      }
    });
  };

  const handleProspectChange = (index: number, field: "email" | "fullName", value: string) => {
    const newProspects = [...prospects];
    newProspects[index][field] = value;
    setProspects(newProspects);
  };

  const addProspect = () => {
    if (prospects.length >= 5) {
      setErrorMessage("You can only refer up to 5 prospects at a time.");
      return;
    }
    setProspects([...prospects, { email: "", fullName: "" }]);
    setErrorMessage("");
  };

  const deleteProspect = (index: number) => {
    const newProspects = [...prospects];
    newProspects.splice(index, 1);
    setProspects(newProspects);
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  return (
    <div className="w-full max-w-[800px] rounded-2xl flex flex-col justify-center items-start">
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="bg-white p-5 rounded-lg text-center">
          <DialogHeader>
            <DialogTitle className="text-xl">Success!</DialogTitle>
            <DialogDescription className="text-lg">Referral submitted successfully!</DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => setShowConfirmation(false)}
            className="mt-[10px] px-4 py-2 bg-prfc-red hover:bg-prfc-red/90 rounded"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7 w-full">
        <div className="flex flex-row gap-2 items-start w-full">
          <Label htmlFor="referrer-email" className="sr-only">
            Referrer Email
          </Label>
          <Input
            id="referrer-email"
            type="email"
            value={yourEmail}
            onChange={(event) => setYourEmail(event.target.value)}
            placeholder="Referrer's Email Address"
            className="flex-1 min-w-0 px-[18px] py-3 rounded-lg border-2 border-prfc-brown bg-white"
            readOnly
          />
        </div>

        <div className="w-full h-[15vh] max-h-[15vh] overflow-y-auto">
          {prospects.map((prospect, index) => (
            <div key={index} className="relative flex w-full mb-[1vh] gap-2">
              <button
                type="button"
                onClick={() => deleteProspect(index)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center bg-transparent border-none text-red-500 cursor-pointer self-end hover:text-red-700"
                aria-label="Delete prospect"
              >
                <Image src="/assets/trash.png" alt="Delete" width={18} height={18} />
              </button>
              <div className="flex flex-col md:flex-row md:items-center w-full gap-2">
                <div className="flex-1 min-w-0">
                  <Label htmlFor={`prospect-name-${index}`} className="sr-only">
                    Prospect {index + 1} Full Name
                  </Label>
                  <Input
                    id={`prospect-name-${index}`}
                    type="text"
                    value={prospect.fullName}
                    onChange={(event) => handleProspectChange(index, "fullName", event.target.value)}
                    placeholder="Enter Referee Full Name"
                    className="w-full px-[18px] py-3 rounded-lg border-2 border-prfc-brown bg-white"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor={`prospect-email-${index}`} className="sr-only">
                    Prospect {index + 1} Email
                  </Label>
                  <Input
                    id={`prospect-email-${index}`}
                    type="email"
                    value={prospect.email}
                    onChange={(event) => handleProspectChange(index, "email", event.target.value)}
                    placeholder="Enter Referee Email Address"
                    className="w-full px-[18px] py-3 rounded-lg border-2 border-prfc-brown bg-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="submit"
          aria-disabled={isPending}
          className="self-end px-6 py-2 bg-prfc-red text-white rounded-lg hover:bg-prfc-red/90 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-prfc-red"
        >
          {isPending ? "Sending..." : "Invite"}
        </Button>

        <p aria-live="polite" className="sr-only">
          {isPending ? "Sending your referral, please wait." : ""}
        </p>

        {errorMessage && <p className="text-red-500 font-bold self-end -mt-6">{errorMessage}</p>}

        {prospects.length < 5 ? (
          <button
            type="button"
            onClick={addProspect}
            className="flex w-auto h-8 justify-center items-center shrink-0 rounded-lg bg-prfc-brown text-white cursor-pointer"
            aria-label="Add prospect"
          >
            <Plus className="h-6 w-6" strokeWidth={2} />
          </button>
        ) : (
          <p className="text-[1.8rem] font-semibold text-prfc-brown m-0">You've reached the max of 5 referrals.</p>
        )}

        <input type="hidden" name="referrerEmail" value={referrerEmail} />
        <input type="hidden" name="referrerFirstName" value={referrerFirstName} />
        <input type="hidden" name="referrerLastName" value={referrerLastName} />
        <input type="hidden" name="referralCode" value={referralCode} />
      </form>
    </div>
  );
}

export default ReferralForm;
