import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
export function PendingApprovalPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center animate-scale-in">
        <CardHeader>
          <div className="mx-auto bg-yellow-100 text-yellow-600 rounded-full p-3 w-fit">
            <Clock className="h-8 w-8" />
          </div>
          <CardTitle className="mt-4">{t('pendingApprovalTitle')}</CardTitle>
          <CardDescription>
            {t('pendingApprovalDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('pendingApprovalInfo')}
          </p>
          <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            <Link to="/">{t('backToLoginButton')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}