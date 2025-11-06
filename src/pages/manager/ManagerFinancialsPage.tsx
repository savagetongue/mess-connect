import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, DollarSign, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api-client";
import type { User, Payment, GuestPayment } from "@shared/types";
import { format, subMonths, addMonths, getYear, getMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
interface FinancialsData {
  students: User[];
  payments: Payment[];
  guestPayments: GuestPayment[];
}
export function ManagerFinancialsPage() {
  const [data, setData] = useState<FinancialsData | null>(null);
  const [monthlyFee, setMonthlyFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const [financialData, feeData] = await Promise.all([
        api<FinancialsData>('/api/financials'),
        api<{ monthlyFee: number }>('/api/settings/fee')
      ]);
      setData(financialData);
      setMonthlyFee(feeData.monthlyFee);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch financial data.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchFinancials();
  }, []);
  const handleMarkAsPaid = async (studentId: string) => {
    if (!monthlyFee) {
      toast.error("Monthly fee is not set. Please set it in settings.");
      return;
    }
    try {
      await api('/api/payments/mark-as-paid', {
        method: 'POST',
        body: JSON.stringify({ studentId, amount: monthlyFee }),
      });
      toast.success("Payment marked as paid successfully.");
      fetchFinancials(); // Refresh data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as paid.");
    }
  };
  const studentPaymentStatus = useMemo(() => {
    const selectedMonthStr = format(selectedDate, "yyyy-MM");
    const approvedStudents = data?.students.filter(s => s.status === 'approved') ?? [];
    return approvedStudents
      .map(student => {
        const payment = data?.payments.find(p => p.userId === student.id && p.month === selectedMonthStr);
        return {
          ...student,
          paymentStatus: payment ? "Paid" : "Due",
          amountPaid: payment ? payment.amount : 0,
          paymentMethod: payment?.method
        };
      })
      .filter(student => {
        const nameMatch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = statusFilter === 'all' || student.paymentStatus.toLowerCase() === statusFilter;
        return nameMatch && statusMatch;
      });
  }, [data, searchTerm, statusFilter, selectedDate]);
  const guestPaymentsForMonth = useMemo(() => {
    return data?.guestPayments.filter(gp => {
      const paymentDate = new Date(gp.createdAt);
      return getYear(paymentDate) === getYear(selectedDate) && getMonth(paymentDate) === getMonth(selectedDate);
    }) ?? [];
  }, [data, selectedDate]);
  const handleMonthChange = (direction: 'prev' | 'next') => {
    setSelectedDate(currentDate => direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                    <CardTitle className="text-lg sm:text-xl whitespace-nowrap">Student Dues - {format(selectedDate, "MMMM yyyy")}</CardTitle>
                    <Button variant="outline" size="icon" onClick={() => handleMonthChange('next')}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search by name..."
                        className="pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="due">Due</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : studentPaymentStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No students match your criteria for this month.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentPaymentStatus.map(student => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>
                            <Badge variant={student.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
                              {student.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {student.paymentStatus === 'Due' ? (
                              <Button size="sm" onClick={() => handleMarkAsPaid(student.id)}>
                                Mark as Paid (Cash)
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground capitalize">
                                Paid ₹{student.amountPaid} via {student.paymentMethod}
                              </span>
                            )}
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
                <CardDescription>One-time payments from guests for {format(selectedDate, "MMMM yyyy")}.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : guestPaymentsForMonth.length > 0 ? (
                  <div className="space-y-4">
                    {guestPaymentsForMonth.sort((a,b) => b.createdAt - a.createdAt).map(gp => (
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
                    <p className="mt-2 text-sm text-muted-foreground">No guest payments recorded for this month.</p>
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