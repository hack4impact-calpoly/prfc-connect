"use client";

import { useState } from "react";
import { AlertCircle, Check, ChevronDown, Loader2, Mail, MessageCircle, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/utils/avatar";

const SMS_CHAR_LIMIT = 160;

interface ComposeMessageFormProps {
  groups: Array<{ id: number; name: string }>;
  currentUser: { name: string; photoUrl?: string | null };
  smsConsent?: { eligible: number; total: number };
  onSend: (data: {
    groupIds: number[];
    isBlast: boolean;
    subject: string;
    body: string;
    smsBody?: string;
    sendEmail: boolean;
    sendSms: boolean;
  }) => void;
  isSending?: boolean;
  smsFeatureEnabled?: boolean;
}

export function ComposeMessageForm({
  groups,
  currentUser,
  smsConsent,
  onSend,
  isSending = false,
  smsFeatureEnabled = false,
}: ComposeMessageFormProps) {
  const [isBlast, setIsBlast] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set());
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);
  const [sendSms, setSendSms] = useState(false);
  const [sendEmail, setSendEmail] = useState(!smsFeatureEnabled);
  const [smsBody, setSmsBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [error, setError] = useState("");

  const toggleGroup = (id: number) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setIsBlast(false);
  };

  const handleBlastToggle = () => {
    setIsBlast(true);
    setSelectedGroupIds(new Set());
  };

  const selectedGroups = groups.filter((g) => selectedGroupIds.has(g.id));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isBlast && selectedGroupIds.size === 0) {
      setError("Please select at least one recipient group.");
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
      groupIds: Array.from(selectedGroupIds),
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
        {(isBlast || selectedGroups.length > 0) && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {isBlast ? (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1">
                All Members
                <button
                  type="button"
                  onClick={() => setIsBlast(false)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  aria-label="Remove All Members"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : (
              selectedGroups.map((g) => (
                <Badge key={g.id} variant="secondary" className="gap-1 pl-2 pr-1">
                  {g.name}
                  <button
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                    aria-label={`Remove ${g.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        )}
        <Popover open={groupPickerOpen} onOpenChange={setGroupPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={groupPickerOpen} className="w-64 justify-between">
              {isBlast || selectedGroups.length > 0 ? "Add more..." : "Select groups"}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0">
            <Command>
              <CommandInput placeholder="Search groups..." />
              <CommandList>
                <CommandEmpty>No groups found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all-members-blast"
                    onSelect={handleBlastToggle}
                    className="flex items-center gap-2"
                  >
                    <Check className={cn("h-4 w-4", isBlast ? "opacity-100" : "opacity-0")} />
                    All Members
                  </CommandItem>
                  {groups.map((g) => (
                    <CommandItem
                      key={g.id}
                      value={g.name}
                      onSelect={() => toggleGroup(g.id)}
                      className="flex items-center gap-2"
                    >
                      <Check className={cn("h-4 w-4", selectedGroupIds.has(g.id) ? "opacity-100" : "opacity-0")} />
                      {g.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {smsFeatureEnabled && (
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
      )}

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
          <div className="space-y-3 rounded-lg border border-prfc-border/30 p-4">
            <div>
              <p className="text-sm font-semibold">Subject Line</p>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subject"
                maxLength={200}
                className="mt-1 w-full border-none bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
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
