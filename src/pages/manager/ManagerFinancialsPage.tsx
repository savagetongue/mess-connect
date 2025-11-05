import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, DollarSign } from "lucide-react";
import { api } from "@/lib/api-client";
import type { User, Payment, GuestPayment } from "@shared/types";
import { format } from "date-fns";
interface FinancialsData {
  students: User[];
  payments: Payment[];
  guestPayments: GuestPayment[];
}
export function ManagerFinancialsPage() {
  const [data, setData] = useState<FinancialsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        setLoading(true);
        const financialData = await api<FinancialsData>('/api/financials');
        setData(financialData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch financial data.");
      } finally {
        setLoading(false);
      }
    };
    fetchFinancials();
  }, []);
  const currentMonthStr = format(new Date(), "yyyy-MM");
  const approvedStudents = data?.students.filter(s => s.status === 'approved') ?? [];
  const studentPaymentStatus = approvedStudents.map(student => {
    const payment = data?.payments.find(p => p.userId === student.id && p.month === currentMonthStr);
    return {
      ...student,
      paymentStatus: payment ? "Paid" : "Due",
      amountPaid: payment ? payment.amount : 0,
    };
  });
  return (
    <AppLayout container>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Financials Overview</CardTitle>
            <CardDescription>Track monthly revenue, dues, and guest payments.</CardDescription>
          </CardHeader>
        </Card>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Student Dues - {format(new Date(), "MMMM yyyy")}</CardTitle>
                <CardDescription>Status of monthly payments from all approved students.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentPaymentStatus.map(student => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.id}</TableCell>
                          <TableCell>
                            <Badge variant={student.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
                              {student.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {student.paymentStatus === 'Paid' ? `₹${student.amountPaid}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Guest Payments</CardTitle>
                <CardDescription>One-time payments from guests.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : data?.guestPayments && data.guestPayments.length > 0 ? (
                  <div className="space-y-4">
                    {data.guestPayments.map(gp => (
                      <div key={gp.id} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium">{gp.name}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(gp.createdAt), "PPp")}</p>
                        </div>
                        <p className="font-semibold">₹{gp.amount}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No guest payments recorded yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}