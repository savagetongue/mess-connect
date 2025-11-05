import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import type { User, UserStatus } from "@shared/types";
import { toast } from "@/components/ui/sonner";
export function StudentManagementPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await api<{ students: User[] }>('/api/students');
      setStudents(data.students);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch student data.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchStudents();
  }, []);
  const handleAction = async (studentId: string, action: 'approve' | 'reject' | 'delete') => {
    const endpointMap = {
      approve: { url: `/api/students/${studentId}/approve`, method: 'POST' },
      reject: { url: `/api/students/${studentId}/reject`, method: 'POST' },
      delete: { url: `/api/students/${studentId}`, method: 'DELETE' },
    };
    try {
      await api(endpointMap[action].url, { method: endpointMap[action].method });
      toast.success(`Student ${action}d successfully.`);
      fetchStudents(); // Refresh the list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} student.`);
    }
  };
  const getBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };
  const pendingStudents = students.filter(s => s.status === 'pending');
  const activeStudents = students.filter(s => s.status === 'approved' || s.status === 'rejected');
  return (
    <AppLayout container>
      <div className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Review and approve new student registrations.</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentTable
              students={pendingStudents}
              loading={loading}
              onAction={handleAction}
              getBadgeVariant={getBadgeVariant}
              isPending
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
            <CardDescription>A list of all active and rejected students.</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentTable
              students={activeStudents}
              loading={loading}
              onAction={handleAction}
              getBadgeVariant={getBadgeVariant}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
interface StudentTableProps {
  students: User[];
  loading: boolean;
  onAction: (studentId: string, action: 'approve' | 'reject' | 'delete') => void;
  getBadgeVariant: (status: UserStatus) => "default" | "secondary" | "destructive" | "outline";
  isPending?: boolean;
}
function StudentTable({ students, loading, onAction, getBadgeVariant, isPending = false }: StudentTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">No students in this category.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="font-medium">{student.name}</TableCell>
            <TableCell>{student.id}</TableCell>
            <TableCell>{student.phone}</TableCell>
            <TableCell>
              <Badge variant={getBadgeVariant(student.status)}>
                {student.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right space-x-2">
              {isPending ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => onAction(student.id, 'reject')}>Reject</Button>
                  <Button size="sm" onClick={() => onAction(student.id, 'approve')}>Approve</Button>
                </>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the student "{student.name}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onAction(student.id, 'delete')} className="bg-destructive hover:bg-destructive/90">
                        Delete Student
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}