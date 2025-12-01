import React from 'react';
import { useRouteError, Link } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Home, AlertCircle } from 'lucide-react';
import '@/lib/errorReporter'; // Assuming this sets up a global error reporter
export function RouteErrorBoundary() {
  const error = useRouteError();
  console.error('Route Error:', error);
  // In a real app, you would report this error to a service like Sentry, LogRocket, etc.
  // The imported errorReporter is a placeholder for this functionality.
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Alert variant="destructive" className="max-w-md w-full">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Oops! Something went wrong.</AlertTitle>
        <AlertDescription>
          We're having trouble loading this page. Please try again later.
          <div className="mt-2 p-2 bg-destructive/10 rounded-md text-xs">
            <strong>Error:</strong> {error instanceof Error ? error.message : 'An unknown error occurred.'}
          </div>
        </AlertDescription>
        <div className="flex gap-2 mt-4">
          <Button asChild variant="outline">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </Alert>
    </div>
  );
}