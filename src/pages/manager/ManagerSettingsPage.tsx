import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
export function ManagerSettingsPage() {
  const [isClearing, setIsClearing] = useState(false);
  const logout = useAuth(s => s.logout);
  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await api('/api/settings/clear-all-data', { method: 'POST' });
      toast.success("All application data has been cleared.", {
        description: "You will be logged out.",
      });
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clear data.");
      setIsClearing(false);
    }
  };
  return (
    <AppLayout container>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage application-wide settings.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <h3 className="font-semibold">Clear All Data</h3>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all students, complaints, payments, and other data.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isClearing}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isClearing ? "Clearing..." : "Clear Data"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all application data, including all users, complaints, and financial records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90">
                      Yes, delete all data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}