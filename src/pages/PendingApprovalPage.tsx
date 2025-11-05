import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
export function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center animate-scale-in">
        <CardHeader>
          <div className="mx-auto bg-yellow-100 text-yellow-600 rounded-full p-3 w-fit">
            <Clock className="h-8 w-8" />
          </div>
          <CardTitle className="mt-4">Verification Pending</CardTitle>
          <CardDescription>
            Your registration has been submitted successfully. Your account is currently awaiting approval from the mess manager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You will be able to log in once your account is approved. Please check back later.
          </p>
          <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            <Link to="/">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}