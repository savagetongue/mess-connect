import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
export function VerificationPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [message, setMessage] = useState('Registration successful. Awaiting approval.');
  useEffect(() => {
    // This page now acts as a graceful handler for any old verification links.
    setMessage(t('redirectingToApproval', { defaultValue: 'Redirecting you to the approval status page...' }));
    const timer = setTimeout(() => {
      try {
        navigate('/pending-approval');
      } catch (e) {
        console.warn('Navigation failed, falling back to window.location:', e);
        // Fallback for environments where navigate might fail during HMR or other edge cases.
        window.location.href = '/pending-approval';
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate, t]);
  const handleRedirectManually = () => {
    try {
      navigate('/pending-approval');
    } catch (e) {
      window.location.href = '/pending-approval';
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center animate-scale-in">
        <CardHeader>
          <div className="mx-auto rounded-full p-3 w-fit">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          </div>
          <CardTitle className="mt-4">Registration Submitted</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground" aria-live="polite">{message}</p>
          <Button onClick={handleRedirectManually} className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white">
            Go to Status Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}