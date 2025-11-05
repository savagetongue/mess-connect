import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
export function ManagerFeedbackPage() {
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>Student Feedback</CardTitle>
          <CardDescription>View and respond to student complaints and suggestions.</CardDescription>
        </CardHeader>
        <CardContent className="text-center flex flex-col items-center justify-center h-64">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Feedback management is coming soon.</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}