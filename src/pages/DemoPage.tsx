import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
export function DemoPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/');
  }, [navigate]);
  return (
    <AppLayout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <p>Redirecting to homepage...</p>
      </div>
    </AppLayout>
  );
}