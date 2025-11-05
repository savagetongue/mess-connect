import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Search, Bell } from "lucide-react";
import { api } from "@/lib/api-client";
import type { User, UserStatus } from "@shared/types";
import { toast } from "@/components/ui/sonner";
export function StudentManagementPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isNotifying, setIsNotifying] = useState(false);
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
  const handleSendNotification = async () => {
    if (!selectedStudent || !notificationMessage.trim()) return;
    setIsNotifying(true);
    try {
      await api(`/api/students/${selectedStudent.id}/notify`, {
        method: 'POST',
        body: JSON.stringify({ message: notificationMessage.trim() }),
      });
      toast.success(`Notification sent to ${selectedStudent.name}.`);
      setSelectedStudent(null);
      setNotificationMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send notification.");
    } finally {
      setIsNotifying(false);
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
  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);
  const pendingStudents = filteredStudents.filter(s => s.status === 'pending');
  const activeStudents = filteredStudents.filter(s => s.status === 'approved' || s.status === 'rejected');
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
              onNotify={setSelectedStudent}
              isPending
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>All Students</CardTitle>
                <CardDescription>A list of all active and rejected students.</CardDescription>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StudentTable
              students={activeStudents}
              loading={loading}
              onAction={handleAction}
              getBadgeVariant={getBadgeVariant}
              onNotify={setSelectedStudent}
            />
          </CardContent>
        </Card>
      </div>
      <Dialog open={!!selectedStudent} onOpenChange={(isOpen) => !isOpen && setSelectedStudent(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>Send a message to {selectedStudent?.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="notification-message">Message</Label>
              <Textarea
                id="notification-message"
                placeholder="Type your message here..."
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSendNotification} disabled={isNotifying || !notificationMessage.trim()}>
              {isNotifying ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
interface StudentTableProps {
  students: User[];
  loading: boolean;
  onAction: (studentId: string, action: 'approve' | 'reject' | 'delete') => void;
  getBadgeVariant: (status: UserStatus) => "default" | "secondary" | "destructive" | "outline";
  onNotify: (student: User) => void;
  isPending?: boolean;
}
function StudentTable({ students, loading, onAction, getBadgeVariant, onNotify, isPending = false }: StudentTableProps) {
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
    return <p className="text-sm text-muted-foreground text-center py-4">No students found.</p>;
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
                <>
                  {student.status === 'approved' && (
                    <Button size="sm" variant="outline" onClick={() => onNotify(student)}>
                      <Bell className="h-4 w-4 mr-2" /> Notify
                    </Button>
                  )}
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
                </>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}