import React from 'react';
import { useRouteError, Link } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Home, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import '@/lib/errorReporter'; // Assuming this sets up a global error reporter
export function RouteErrorBoundary({ error: propError }: { error?: unknown }) {
  const routeError = useRouteError();
  const error = propError ?? routeError;
  console.error('Boundary Error:', error);
  // In a real app, you would report this error to a service like Sentry, LogRocket, etc.
  // The imported errorReporter is a placeholder for this functionality.
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Alert variant="destructive" className="max-w-md w-full" role="alert" aria-live="assertive">
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
      </motion.div>
    </div>
  );
}