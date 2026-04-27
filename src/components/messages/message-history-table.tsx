import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { coopFormatTimed } from "@/utils/time";

interface MessageHistoryTableProps {
  messages: Array<{
    id: number;
    subject: string;
    sentAt: Date;
    groupName: string | null;
    isBlast: boolean;
  }>;
  onView: (messageId: number) => void;
}

function formatDeliveredAt(date: Date): string {
  return coopFormatTimed(date, "M/d/yyyy h:mm:ss a zzz");
}

export function MessageHistoryTable({ messages, onView }: MessageHistoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-bold text-foreground">Message Preview</TableHead>
          <TableHead className="font-bold text-foreground">Delivered at</TableHead>
          <TableHead className="w-[80px]">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {messages.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
              No messages yet.
            </TableCell>
          </TableRow>
        ) : (
          messages.map((message) => (
            <TableRow key={message.id}>
              <TableCell className="max-w-[300px] truncate text-sm">{message.subject}</TableCell>
              <TableCell className="text-sm">{formatDeliveredAt(message.sentAt)}</TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onView(message.id)}
                  aria-label={`View message: ${message.subject}`}
                  className="text-sm underline hover:text-prfc-brown"
                >
                  View
                </button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
