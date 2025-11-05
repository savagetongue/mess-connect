import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpen, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
export function MessRulesPage() {
  const [rules, setRules] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        const data = await api<{ messRules?: string }>('/api/settings');
        setRules(data.messRules || "No rules have been set by the manager yet.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch mess rules.");
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>Mess Rules & Regulations</CardTitle>
          <CardDescription>Please adhere to the following rules to maintain a pleasant dining environment.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-muted/50 whitespace-pre-wrap">
              {rules ? (
                <p>{rules}</p>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <BookOpen className="mx-auto h-12 w-12" />
                  <p className="mt-4">No rules have been set by the manager yet.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}