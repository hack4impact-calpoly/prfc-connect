import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { coopDateParts, coopFormatTimed } from "@/utils/time";

interface MessageHistoryTableProps {
  messages: Array<{
    id: number;
    subject: string;
    body?: string;
    sentAt: Date;
    groupNames: string[];
    isBlast: boolean;
  }>;
  onView: (messageId: number) => void;
}

function formatSmartTimestamp(date: Date): string {
  const now = new Date();
  const nowParts = coopDateParts(now);
  const dateParts = coopDateParts(date);

  if (nowParts.year === dateParts.year && nowParts.month0 === dateParts.month0 && nowParts.day === dateParts.day) {
    return coopFormatTimed(date, "h:mm a");
  }
  if (nowParts.year === dateParts.year) {
    return coopFormatTimed(date, "MMM d");
  }
  return coopFormatTimed(date, "MMM d, yyyy");
}

function RecipientLabel({ message }: { message: { isBlast: boolean; groupNames: string[] } }) {
  if (message.isBlast) return <>All Members</>;
  if (message.groupNames.length === 0) return <>Unknown</>;
  if (message.groupNames.length <= 2) return <>{message.groupNames.join(", ")}</>;
  return (
    <>
      {message.groupNames.slice(0, 2).join(", ")} +{message.groupNames.length - 2} more
    </>
  );
}

function MessagePreview({ message }: { message: { subject: string; body?: string } }) {
  return (
    <>
      <span className="font-medium">{message.subject}</span>
      {message.body && <span className="text-muted-foreground"> - {message.body}</span>}
    </>
  );
}

export function MessageHistoryTable({ messages, onView }: MessageHistoryTableProps) {
  if (messages.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No messages yet.</p>;
  }

  return (
    <>
      <Table className="hidden sm:table">
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-foreground">To</TableHead>
            <TableHead className="w-full font-bold text-foreground">Message</TableHead>
            <TableHead className="font-bold text-foreground">Delivered</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((message) => (
            <TableRow key={message.id} onClick={() => onView(message.id)} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="whitespace-nowrap text-sm">
                <RecipientLabel message={message} />
              </TableCell>
              <TableCell className="truncate text-sm">
                <MessagePreview message={message} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {formatSmartTimestamp(message.sentAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="divide-y sm:hidden">
        {messages.map((message) => (
          <button
            key={message.id}
            type="button"
            onClick={() => onView(message.id)}
            className="w-full px-3 py-3 text-left hover:bg-muted/50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                <RecipientLabel message={message} />
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatSmartTimestamp(message.sentAt)}</span>
            </div>
            <p className="mt-1 truncate text-sm">
              <MessagePreview message={message} />
            </p>
          </button>
        ))}
      </div>
    </>
  );
}
