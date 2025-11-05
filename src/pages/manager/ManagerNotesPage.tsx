import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Notebook } from "lucide-react";
export function ManagerNotesPage() {
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>Notes & To-Do</CardTitle>
          <CardDescription>Manage your daily expenses and tasks.</CardDescription>
        </CardHeader>
        <CardContent className="text-center flex flex-col items-center justify-center h-64">
          <Notebook className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">The notes and to-do list feature is coming soon.</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}