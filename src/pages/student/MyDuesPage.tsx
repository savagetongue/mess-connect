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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/useTranslation";
declare global {
  interface Window {
    Razorpay: any;
  }
}
export function MyDuesPage() {
  const { t } = useTranslation();
  const user = useAuth(s => s.user);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [monthlyFee, setMonthlyFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchData = async () => {
    try {
      setLoading(true);
      const [duesData, feeData] = await Promise.all([
        api<{ payments: Payment[] }>('/api/student/dues'),
        api<{ monthlyFee: number }>('/api/settings')
      ]);
      setPayments(duesData.payments.sort((a, b) => b.createdAt - a.createdAt));
      setMonthlyFee(feeData.monthlyFee);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch payment history.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handlePayment = async () => {
    if (!monthlyFee || !user) return;
    try {
      const order = await api<{ id: string; amount: number; currency: string }>('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount: monthlyFee, studentId: user.id }),
      });
      const options = {
        key: 'rzp_test_Rc4X9qW2OGg1Ch',
        amount: order.amount,
        currency: order.currency,
        name: 'Mess Connect',
        description: `Monthly Fee for ${format(new Date(), "MMMM yyyy")}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await api('/api/payments/verify-payment', {
              method: 'POST',
              body: JSON.stringify({
                ...response,
                amount: monthlyFee,
                studentId: user.id,
              }),
            });
            toast.success('Payment successful!');
            fetchData(); // Refresh dues
          } catch (verifyError: any) {
            toast.error(verifyError.message || 'Payment verification failed.');
          }
        },
        prefill: {
          name: user.name,
          email: user.id,
          contact: user.phone,
        },
        theme: {
          color: '#F97316',
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create payment order.');
    }
  };
  const currentMonthStr = format(new Date(), "yyyy-MM");
  const isCurrentMonthPaid = payments.some(p => p.month === currentMonthStr && p.status === 'paid');
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>{t('myDuesTitle')}</CardTitle>
          <CardDescription>{t('myDuesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg flex justify-between items-center bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">{t('currentMonthDue')}</p>
              {loading ? (
                <Skeleton className="h-8 w-32 mt-1" />
              ) : isCurrentMonthPaid ? (
                <p className="text-2xl font-bold text-green-600">{t('paid')}</p>
              ) : (
                <p className="text-2xl font-bold">₹{monthlyFee?.toLocaleString() ?? '...'}</p>
              )}
            </div>
            <Button onClick={handlePayment} disabled={isCurrentMonthPaid || loading || !monthlyFee}>
              {isCurrentMonthPaid ? t('paid') : t('payNowButton')}
            </Button>
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('paymentHistory')}</h3>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('error')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : payments.length === 0 ? (
            <div className="text-center py-10">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">{t('noPaymentHistory')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('month')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('method')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{format(new Date(payment.month), "MMMM yyyy")}</TableCell>
                    <TableCell>₹{payment.amount}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'paid' ? 'default' : 'destructive'}>
                        {t(payment.status)}
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