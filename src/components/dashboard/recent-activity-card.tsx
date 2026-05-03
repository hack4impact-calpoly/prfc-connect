import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentActivityCardProps {
  activities: Array<{
    type: "message_sent" | "event_created";
    title: string;
    timestamp: Date;
  }>;
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <Card className="flex flex-1 flex-col">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1 space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            activities.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 h-4 w-[3px] shrink-0 rounded-full bg-green-600" />
                <p className="text-sm">{activity.title}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
