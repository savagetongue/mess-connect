import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import type { User } from "@shared/types";
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
  const handleApprove = async (studentId: string) => {
    try {
      await api(`/api/students/${studentId}/approve`, { method: 'POST' });
      toast.success("Student approved successfully.");
      fetchStudents(); // Refresh the list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve student.");
    }
  };
  const pendingStudents = students.filter(s => s.status === 'pending');
  const approvedStudents = students.filter(s => s.status === 'approved');
  return (
    <AppLayout container>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Review and approve new student registrations.</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentTable students={pendingStudents} loading={loading} onApprove={handleApprove} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Approved Students</CardTitle>
            <CardDescription>A list of all active students in the mess.</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentTable students={approvedStudents} loading={loading} />
          </CardContent>
        </Card>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </AppLayout>
  );
}
interface StudentTableProps {
  students: User[];
  loading: boolean;
  onApprove?: (studentId: string) => void;
}
function StudentTable({ students, loading, onApprove }: StudentTableProps) {
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
          {onApprove && <TableHead className="text-right">Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="font-medium">{student.name}</TableCell>
            <TableCell>{student.id}</TableCell>
            <TableCell>{student.phone}</TableCell>
            <TableCell>
              <Badge variant={student.status === 'approved' ? 'default' : 'secondary'}>
                {student.status}
              </Badge>
            </TableCell>
            {onApprove && (
              <TableCell className="text-right">
                <Button size="sm" onClick={() => onApprove(student.id)}>Approve</Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}