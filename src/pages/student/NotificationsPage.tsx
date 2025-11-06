import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Notification } from "@shared/types";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
export function NotificationsPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await api<{ notifications: Notification[] }>('/api/student/notifications');
        setNotifications(data.notifications.sort((a, b) => b.createdAt - a.createdAt));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch notifications.");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>{t('notificationsTitle')}</CardTitle>
          <CardDescription>{t('notificationsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('error')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Bell className="mx-auto h-12 w-12" />
              <p className="mt-4">{t('noNotifications')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="mt-1">
                    <Bell className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notification.createdAt), "PPp")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}