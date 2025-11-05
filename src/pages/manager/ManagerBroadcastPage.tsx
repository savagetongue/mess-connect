import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
export function ManagerBroadcastPage() {
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>Broadcast Message</CardTitle>
          <CardDescription>Send an urgent message to all students.</CardDescription>
        </CardHeader>
        <CardContent className="text-center flex flex-col items-center justify-center h-64">
          <Send className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">The broadcast feature is coming soon.</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}