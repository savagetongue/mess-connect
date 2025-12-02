import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
export function VerificationPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [message, setMessage] = useState('Registration successful. Awaiting approval.');
  useEffect(() => {
    // This page is no longer used for verification.
    // It now acts as a graceful handler for any old links.
    setMessage('Redirecting you to the approval status page...');
    setTimeout(() => navigate('/pending-approval'), 2000);
  }, [navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center animate-scale-in">
        <CardHeader>
          <div className="mx-auto rounded-full p-3 w-fit">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
          <CardTitle className="mt-4">Registration Submitted</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{message}</p>
          <Button onClick={() => navigate('/pending-approval')} className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white">
            Go to Status Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}