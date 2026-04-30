"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageHistoryTable } from "@/components/messages/message-history-table";
import { ViewMessageModal } from "@/components/messages/view-message-modal";
import { fetchMessageDetail, fetchMessageHistoryPage } from "@/actions/contact-group";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { MessageHistoryPage } from "@/types/message";
import type { MessageDetail, RecipientStatus } from "@/types/message";

type Props = {
  initialPage: MessageHistoryPage;
  isAdmin: boolean;
};

function useMessagePagination(initialPage: MessageHistoryPage) {
  const [page, setPage] = useState(initialPage);
  const [startIndex, setStartIndex] = useState(1);
  const [isPending, startTransition] = useTransition();

  const refetch = (params: {
    search?: string;
    channel?: "email" | "sms";
    sort: "recent" | "oldest";
    pageSize: 10 | 25 | 50;
    cursor?: number;
    direction?: "forward" | "backward";
  }) => {
    if (!params.cursor) setStartIndex(1);
    startTransition(async () => {
      const result = await fetchMessageHistoryPage({
        search: params.search || undefined,
        channel: params.channel,
        sort: params.sort,
        cursor: params.cursor,
        direction: params.direction,
        pageSize: params.pageSize,
      });
      if (result.success && result.data) {
        setPage(result.data);
      } else {
        toast.error(result.error ?? "Failed to load messages");
      }
    });
  };

  const goNext = () => {
    setStartIndex((prev) => prev + page.items.length);
  };

  const goPrev = (currentPageSize: number) => {
    setStartIndex((prev) => Math.max(1, prev - currentPageSize));
  };

  return { page, startIndex, isPending, refetch, goNext, goPrev };
}

export function MessagesContent({ initialPage }: Props) {
  const { page, startIndex, isPending, refetch, goNext, goPrev } = useMessagePagination(initialPage);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(25);
  const [viewModal, setViewModal] = useState<{ message: MessageDetail; recipients: RecipientStatus[] } | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const fetchFirstPage = (overrides?: { channel?: string; sort?: "recent" | "oldest"; pageSize?: 10 | 25 | 50 }) => {
    const ch = overrides?.channel ?? channelFilter;
    const channel = ch === "all" ? undefined : (ch as "email" | "sms");
    refetch({
      search: debouncedSearch,
      channel,
      sort: overrides?.sort ?? sortOrder,
      pageSize: overrides?.pageSize ?? pageSize,
    });
  };

  const handleNextPage = () => {
    if (page.nextCursor) {
      goNext();
      const channel = channelFilter === "all" ? undefined : (channelFilter as "email" | "sms");
      refetch({
        search: debouncedSearch,
        channel,
        sort: sortOrder,
        pageSize,
        cursor: page.nextCursor,
        direction: "forward",
      });
    }
  };

  const handlePrevPage = () => {
    if (page.prevCursor) {
      goPrev(pageSize);
      const channel = channelFilter === "all" ? undefined : (channelFilter as "email" | "sms");
      refetch({
        search: debouncedSearch,
        channel,
        sort: sortOrder,
        pageSize,
        cursor: page.prevCursor,
        direction: "backward",
      });
    }
  };

  const [isViewPending, startViewTransition] = useTransition();

  const handleView = (messageId: number) => {
    startViewTransition(async () => {
      const result = await fetchMessageDetail(messageId);
      if (result.success && result.data) {
        setViewModal({ message: result.data.message, recipients: result.data.recipients });
      } else {
        toast.error(result.error ?? "Failed to load message details");
      }
    });
  };

  const endIndex = Math.min(startIndex + page.items.length - 1, page.totalCount);

  return (
    <div>
      <h1 className="font-angkor text-3xl text-prfc-brown">Message History</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="pl-9"
            aria-label="Search messages"
          />
        </div>
        <Select
          value={channelFilter}
          onValueChange={(v) => {
            setChannelFilter(v);
            fetchFirstPage({ channel: v });
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Message Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortOrder}
          onValueChange={(v) => {
            const sort = v as "recent" | "oldest";
            setSortOrder(sort);
            fetchFirstPage({ sort });
          }}
        >
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

      <div className={cn("mt-6 transition-opacity", (isPending || isViewPending) && "pointer-events-none opacity-60")}>
        <MessageHistoryTable messages={page.items} onView={handleView} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              const size = Number(v) as 10 | 25 | 50;
              setPageSize(size);
              fetchFirstPage({ pageSize: size });
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <span className="text-sm text-muted-foreground">
          {page.totalCount === 0 ? "No messages" : `Showing ${startIndex}-${endIndex} of ${page.totalCount}`}
        </span>

        <nav className="flex items-center gap-2" aria-label="Pagination">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={!page.prevCursor || isPending}
            aria-disabled={!page.prevCursor || isPending}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!page.nextCursor || isPending}
            aria-disabled={!page.nextCursor || isPending}
          >
            Next
          </Button>
        </nav>
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
            groupNames: viewModal.message.groupNames,
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
