import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, DollarSign } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Payment } from "@shared/types";
import { format } from "date-fns";
export function MyDuesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchDues = async () => {
      try {
        setLoading(true);
        const data = await api<{ payments: Payment[] }>('/api/student/dues');
        setPayments(data.payments.sort((a, b) => b.createdAt - a.createdAt));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch payment history.");
      } finally {
        setLoading(false);
      }
    };
    fetchDues();
  }, []);
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>My Dues & Payment History</CardTitle>
          <CardDescription>Review your payment history and settle outstanding dues.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg flex justify-between items-center bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Current Month Due</p>
              <p className="text-2xl font-bold">₹3,000.00</p>
            </div>
            <Button disabled>Pay Now (Coming Soon)</Button>
          </div>
          <h3 className="text-lg font-semibold mb-2">Payment History</h3>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : payments.length === 0 ? (
            <div className="text-center py-10">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No payment history found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{format(new Date(payment.month), "MMMM yyyy")}</TableCell>
                    <TableCell>₹{payment.amount}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'paid' ? 'default' : 'destructive'}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{payment.method.replace('_', ' ')}</TableCell>
                    <TableCell>{format(new Date(payment.createdAt), "PP")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}