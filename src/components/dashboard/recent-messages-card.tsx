import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentMessagesCardProps {
  messages: Array<{
    id: number;
    subject: string;
    groupName: string | null;
    isBlast: boolean;
    sentAt: Date;
  }>;
}

export function RecentMessagesCard({ messages }: RecentMessagesCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Recent Messages</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Send your first message to boost engagement.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-sm font-semibold text-green-600">Sent</span>
                <div className="mt-0.5 h-8 w-[3px] shrink-0 rounded-full bg-green-600" />
                <div>
                  <p className="text-sm font-semibold">
                    To: {message.isBlast ? "All Members" : (message.groupName ?? "Unknown Group")}
                  </p>
                  <p className="text-sm italic text-muted-foreground">&ldquo;{message.subject}&rdquo;</p>
                </div>
              </div>
            ))
          )}
        </div>
        <hr className="mt-3 border-prfc-border/30" />
        <Link
          href="/messages"
          className="mt-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
