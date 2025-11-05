import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
export function ManagerFinancialsPage() {
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>Financials</CardTitle>
          <CardDescription>Track monthly revenue, dues, and guest payments.</CardDescription>
        </CardHeader>
        <CardContent className="text-center flex flex-col items-center justify-center h-64">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Financial tracking and reporting features are coming soon.</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}