import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageSentConfirmationProps {
  recipientCount: number;
  channels: { email: boolean; sms: boolean };
  onTrackRsvps: () => void;
  onDeliveryStatus: () => void;
}

function channelLabel(channels: { email: boolean; sms: boolean }): string {
  if (channels.email && channels.sms) return "Text/Email";
  if (channels.sms) return "Text";
  return "Email";
}

export function MessageSentConfirmation({
  recipientCount,
  channels,
  onTrackRsvps,
  onDeliveryStatus,
}: MessageSentConfirmationProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-prfc-border/30 py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-400">
        <Check className="h-8 w-8 text-white" strokeWidth={3} />
      </div>
      <h2 className="font-angkor text-2xl">Message Sent!</h2>
      <p className="text-sm text-muted-foreground">
        {channelLabel(channels)} sent to {recipientCount} members
      </p>
      <div className="flex flex-col gap-2">
        <Button onClick={onTrackRsvps} className="bg-prfc-brown text-white hover:bg-prfc-dark-brown">
          Track RSVPs
        </Button>
        <Button onClick={onDeliveryStatus} className="bg-prfc-brown text-white hover:bg-prfc-dark-brown">
          Delivery Status
        </Button>
      </div>
    </div>
  );
}
