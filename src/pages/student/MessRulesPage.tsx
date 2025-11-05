import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpen, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { useTranslation } from "@/hooks/useTranslation";
export function MessRulesPage() {
  const { t } = useTranslation();
  const [rules, setRules] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        const data = await api<{ messRules?: string }>('/api/settings');
        setRules(data.messRules || t('noRulesSet'));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch mess rules.");
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, [t]);
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>{t('messRulesTitle')}</CardTitle>
          <CardDescription>{t('messRulesDescription')}</CardDescription>
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
              <AlertTitle>{t('error')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-muted/50 whitespace-pre-wrap">
              {rules === t('noRulesSet') ? (
                <div className="text-center py-10 text-muted-foreground">
                  <BookOpen className="mx-auto h-12 w-12" />
                  <p className="mt-4">{rules}</p>
                </div>
              ) : (
                <p>{rules}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}