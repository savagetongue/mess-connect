import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
export function MyDuesPage() {
  // This is a placeholder. Full functionality will be added in a later phase.
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>My Dues</CardTitle>
          <CardDescription>Review your payment history and settle outstanding dues.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex flex-col items-center space-y-4">
            <DollarSign className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Current Due: ��0.00</p>
            <p className="text-sm text-muted-foreground">
              Payment history and Razorpay integration will be available here soon.
            </p>
            <Button disabled>Pay Now (Coming Soon)</Button>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}