"use client";

import { handleActionError } from "@/utils/auth-redirect";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ComposeMessageForm } from "@/components/messages/compose-message-form";
import { MessageSentConfirmation } from "@/components/messages/message-sent-confirmation";
import { sendMessage, sendBlast } from "@/actions/contact-group";

type Props = {
  groups: Array<{ id: number; name: string }>;
  currentUser: { name: string; photoUrl?: string | null };
  isAdmin: boolean;
  smsFeatureEnabled: boolean;
};

export function ComposeContent({ groups, currentUser, isAdmin, smsFeatureEnabled }: Props) {
  const router = useRouter();
  const [sentResult, setSentResult] = useState<{
    recipientCount: number;
    channels: { email: boolean; sms: boolean };
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSend = (data: {
    groupIds: number[];
    isBlast: boolean;
    subject: string;
    body: string;
    smsBody?: string;
    sendEmail: boolean;
    sendSms: boolean;
  }) => {
    startTransition(async () => {
      if (data.isBlast) {
        if (!isAdmin) {
          toast.error("Only admins can send blast messages");
          return;
        }
        const result = await sendBlast({
          subject: data.subject,
          body: data.body,
          smsBody: data.smsBody,
          sendEmail: data.sendEmail,
          sendSms: data.sendSms,
          confirmationText: "SEND TO ALL",
        });
        if (result.success && result.data) {
          setSentResult({
            recipientCount: result.data.emailCount + result.data.smsCount,
            channels: { email: data.sendEmail, sms: data.sendSms },
          });
        } else {
          toast.error(handleActionError(result.error, "Failed to send message"));
        }
      } else {
        if (data.groupIds.length === 0) {
          toast.error("Please select at least one group");
          return;
        }
        const result = await sendMessage({
          groupIds: data.groupIds,
          subject: data.subject,
          body: data.body,
          smsBody: data.smsBody,
          sendEmail: data.sendEmail,
          sendSms: data.sendSms,
        });
        if (result.success && result.data) {
          setSentResult({
            recipientCount: result.data.emailCount + result.data.smsCount,
            channels: { email: data.sendEmail, sms: data.sendSms },
          });
        } else {
          toast.error(handleActionError(result.error, "Failed to send message"));
        }
      }
    });
  };

  if (sentResult) {
    return (
      <MessageSentConfirmation
        recipientCount={sentResult.recipientCount}
        channels={sentResult.channels}
        onTrackRsvps={() => router.push("/events")}
        onDeliveryStatus={() => router.push("/messages")}
      />
    );
  }

  return (
    <ComposeMessageForm
      groups={groups}
      currentUser={currentUser}
      onSend={handleSend}
      isAdmin={isAdmin}
      isSending={isPending}
      smsFeatureEnabled={smsFeatureEnabled}
    />
  );
}
