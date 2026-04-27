"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Mail, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAvatarColor, getInitials } from "@/utils/avatar";

const SMS_CHAR_LIMIT = 160;

interface ComposeMessageFormProps {
  groups: Array<{ id: number; name: string }>;
  currentUser: { name: string; photoUrl?: string | null };
  smsConsent?: { eligible: number; total: number };
  onSend: (data: {
    groupId: number | null;
    isBlast: boolean;
    subject: string;
    body: string;
    smsBody?: string;
    sendEmail: boolean;
    sendSms: boolean;
  }) => void;
  isSending?: boolean;
}

export function ComposeMessageForm({
  groups,
  currentUser,
  smsConsent,
  onSend,
  isSending = false,
}: ComposeMessageFormProps) {
  const [groupId, setGroupId] = useState<string>("");
  const [sendSms, setSendSms] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [smsBody, setSmsBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [error, setError] = useState("");

  const isBlast = groupId === "all";
  const selectedGroupId = isBlast ? null : groupId ? Number(groupId) : null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!groupId) {
      setError("Please select a recipient group.");
      return;
    }
    if (!sendSms && !sendEmail) {
      setError("Please select at least one channel.");
      return;
    }
    if (sendEmail && !emailSubject.trim()) {
      setError("Email subject is required.");
      return;
    }
    if (sendEmail && !emailBody.trim()) {
      setError("Email body is required.");
      return;
    }
    if (sendSms && !smsBody.trim()) {
      setError("SMS body is required.");
      return;
    }
    if (sendSms && smsBody.length > SMS_CHAR_LIMIT) {
      setError(`SMS body must be ${SMS_CHAR_LIMIT} characters or fewer.`);
      return;
    }

    onSend({
      groupId: selectedGroupId,
      isBlast,
      subject: emailSubject.trim() || smsBody.trim().slice(0, 200),
      body: emailBody.trim() || smsBody.trim(),
      smsBody: sendSms ? smsBody.trim() : undefined,
      sendEmail,
      sendSms,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="font-angkor text-3xl text-prfc-red">New Message</h1>

      <div>
        <p className="mb-2 text-sm font-semibold">To:</p>
        <div className="flex gap-3">
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Select a Channel</p>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox checked={sendSms} onCheckedChange={(checked) => setSendSms(checked === true)} />
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">Text Message</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox checked={sendEmail} onCheckedChange={(checked) => setSendEmail(checked === true)} />
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">Email</span>
          </label>
        </div>
      </div>

      {sendSms && (
        <div>
          <p className="mb-2 text-sm font-semibold">Send Text</p>
          <div className="flex items-start gap-3">
            <Avatar className="mt-2 h-10 w-10 shrink-0">
              {currentUser.photoUrl && <AvatarImage src={currentUser.photoUrl} alt={currentUser.name} />}
              <AvatarFallback
                style={{ backgroundColor: getAvatarColor(currentUser.name) }}
                className="text-xs font-semibold text-white"
              >
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-lg border border-prfc-border/30 p-4">
              <Textarea
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                placeholder="Write your text here"
                maxLength={SMS_CHAR_LIMIT}
                rows={4}
                className="border-none p-0 shadow-none focus-visible:ring-0"
              />
              <hr className="my-2 border-prfc-border/30" />
              <p className="text-xs text-muted-foreground">
                Character Count{" "}
                <span className="font-semibold">
                  {smsBody.length}/{SMS_CHAR_LIMIT}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {sendEmail && (
        <div>
          <p className="mb-2 text-sm font-semibold">Compose Email</p>
          <div className="rounded-lg border border-prfc-border/30 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold">Subject Line</p>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subject"
                maxLength={200}
                className="mt-1 border-none p-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <hr className="border-prfc-border/30" />
            <Textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Write your email here"
              rows={6}
              className="border-none p-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      )}

      {sendSms && smsConsent && (
        <div>
          <p className="mb-2 text-sm font-semibold">SMS Consent</p>
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p>
                {smsConsent.eligible} of {smsConsent.total} recipients can receive SMS
              </p>
              <p className="font-semibold">{smsConsent.total - smsConsent.eligible} will NOT receive this message</p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-prfc-red">{error}</p>}

      <Button type="submit" disabled={isSending} className="bg-prfc-brown text-white hover:bg-prfc-dark-brown">
        {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isSending ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}
