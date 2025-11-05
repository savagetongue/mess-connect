import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, UserCheck, DollarSign, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
interface ManagerStats {
  totalStudents: number;
  pendingApprovals: number;
  monthlyRevenue: number;
}
export function ManagerDashboardPage() {
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api<ManagerStats>('/api/manager/stats');
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard statistics.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  const statCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals,
      icon: <UserCheck className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "This Month's Revenue",
      value: `₹${(stats?.monthlyRevenue ?? 0).toLocaleString()}`,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
  ];
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">An overview of your mess operations.</p>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))
            : statCards.map((card) => (
                <Card key={card.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    {card.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </AppLayout>
  );
}