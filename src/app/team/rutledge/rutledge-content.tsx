"use client";

import { MessageSentConfirmation } from "@/components/messages/message-sent-confirmation";

export function RutledgeContent() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Message Sent Confirmation Preview</h2>
          <div className="mt-4 space-y-6">
            <MessageSentConfirmation
              recipientCount={120}
              channels={{ email: true, sms: true }}
              onTrackRsvps={() => console.log("Track RSVPs")}
              onDeliveryStatus={() => console.log("Delivery Status")}
            />
            <MessageSentConfirmation
              recipientCount={45}
              channels={{ email: true, sms: false }}
              onTrackRsvps={() => console.log("Track RSVPs")}
              onDeliveryStatus={() => console.log("Delivery Status")}
            />
            <MessageSentConfirmation
              recipientCount={30}
              channels={{ email: false, sms: true }}
              onTrackRsvps={() => console.log("Track RSVPs")}
              onDeliveryStatus={() => console.log("Delivery Status")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
