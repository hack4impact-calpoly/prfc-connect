import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SmsConsentCardProps {
  phone: string;
  hasConsent: boolean;
  onRevoke: () => void;
  isRevoking?: boolean;
}

export function SmsConsentCard({ phone, hasConsent, onRevoke, isRevoking = false }: SmsConsentCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOptOutClick = () => {
    setDialogOpen(true);
  };

  const handleConfirmRevoke = () => {
    setDialogOpen(false);
    onRevoke();
  };

  return (
    <>
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-3">
          <p className="font-bold text-base">SMS Consent</p>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{phone}</p>

            <p className="text-sm">{hasConsent ? "Opted in" : "Not opted in"}</p>
          </div>

          {hasConsent && (
            <Button
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive/10"
              onClick={handleOptOutClick}
              disabled={isRevoking}
            >
              {isRevoking ? "Opting out…" : "Opt Out"}
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            Message &amp; data rates may apply. Reply STOP to any message to unsubscribe.
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opt out of SMS?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer receive SMS messages. You can opt back in at any time from your profile settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevoke}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Opt Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
