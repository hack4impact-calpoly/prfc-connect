"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageHistoryTable } from "@/components/messages/message-history-table";
import { ViewMessageModal } from "@/components/messages/view-message-modal";
import { fetchMessageDetail } from "@/actions/contact-group";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import { cn } from "@/lib/utils";
import type { MessageHistoryItem } from "@/types/message";
import type { MessageDetail, RecipientStatus } from "@/types/message";

type Props = {
  initialMessages: MessageHistoryItem[];
  isAdmin: boolean;
};

export function MessagesContent({ initialMessages }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");
  const [viewModal, setViewModal] = useState<{ message: MessageDetail; recipients: RecipientStatus[] } | null>(null);
  const [isPending, startTransition] = useTransition();

  const channelFiltered = useMemo(() => {
    if (channelFilter === "all") return initialMessages;
    if (channelFilter === "email") return initialMessages.filter((m) => m.emailCount > 0);
    return initialMessages.filter((m) => m.smsCount > 0);
  }, [initialMessages, channelFilter]);

  const searched = useFuzzySearch(channelFiltered, { keys: ["subject"] }, searchQuery);

  const sorted = useMemo(() => {
    const copy = [...searched];
    if (sortOrder === "oldest") copy.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
    else copy.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
    return copy;
  }, [searched, sortOrder]);

  const handleView = (messageId: number) => {
    startTransition(async () => {
      const result = await fetchMessageDetail(messageId);
      if (result.success && result.data) {
        setViewModal({ message: result.data.message, recipients: result.data.recipients });
      } else {
        toast.error(result.error ?? "Failed to load message details");
      }
    });
  };

  return (
    <div>
      <h1 className="font-angkor text-3xl text-prfc-brown">Message History</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="pl-9"
            aria-label="Search messages"
          />
        </div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Message Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
        <Link href="/messages/compose" className="ml-auto">
          <Button className="bg-prfc-red text-white hover:bg-prfc-red/90">
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </Link>
      </div>

      <div className={cn("mt-6 transition-opacity", isPending && "pointer-events-none opacity-60")}>
        <MessageHistoryTable messages={sorted} onView={handleView} />
      </div>

      {viewModal && (
        <ViewMessageModal
          open={!!viewModal}
          onOpenChange={(open) => {
            if (!open) setViewModal(null);
          }}
          message={{
            id: viewModal.message.id,
            subject: viewModal.message.subject,
            body: viewModal.message.body,
            sentAt: viewModal.message.sentAt,
            groupName: viewModal.message.groupName,
            isBlast: viewModal.message.isBlast,
          }}
          recipients={viewModal.recipients.map((r) => ({
            memberId: r.memberId,
            memberName: r.memberName,
            status: r.status === "sent" ? "sent" : r.status === "failed" ? "failed" : "pending",
          }))}
        />
      )}
    </div>
  );
}
