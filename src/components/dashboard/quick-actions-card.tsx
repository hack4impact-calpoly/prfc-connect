import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SquarePen, UsersRound, Plus } from "lucide-react";

interface QuickActionsCardProps {
  onCreateEvent: () => void;
  onCreateGroup: () => void;
  onSendMessage: () => void;
}

export function QuickActionsCard({ onCreateEvent, onCreateGroup, onSendMessage }: QuickActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="ghost"
          size="lg"
          onClick={onCreateEvent}
          className="w-full justify-start bg-gray-50 text-left hover:bg-gray-100 border border-gray-100 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={onCreateGroup}
          className="w-full justify-start bg-gray-50 text-left hover:bg-gray-100 border border-gray-100 shadow-sm"
        >
          <UsersRound className="mr-2 h-4 w-4" />
          Create Group
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={onSendMessage}
          className="w-full justify-start bg-gray-50 text-left hover:bg-gray-100 border border-gray-100 shadow-sm"
        >
          <SquarePen className="mr-2 h-4 w-4" />
          Send Message
        </Button>
      </CardContent>
    </Card>
  );
}
