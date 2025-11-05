import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useTranslation } from '@/hooks/useTranslation';
export function VerificationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided.');
        return;
      }
      try {
        await api(`/api/verify-email/${token}`);
        setStatus('success');
        setMessage(t('verificationSuccess'));
        setTimeout(() => navigate('/'), 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || t('verificationError'));
      }
    };
    verifyToken();
  }, [token, navigate, t]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center animate-scale-in">
        <CardHeader>
          <div className="mx-auto rounded-full p-3 w-fit">
            {status === 'loading' && <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />}
            {status === 'success' && <CheckCircle className="h-10 w-10 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-10 w-10 text-destructive" />}
          </div>
          <CardTitle className="mt-4">{t('verifyEmailTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'loading' ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          ) : status === 'success' ? (
            <Alert variant="default" className="text-green-700 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <Button onClick={() => navigate('/')} className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white">
            {t('backToLoginButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}