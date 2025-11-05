import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Complaint } from "@shared/types";
import { format } from "date-fns";
export function AdminDashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await api<{ complaints: Complaint[] }>('/api/complaints/all');
      setComplaints(data.complaints.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch complaints.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchComplaints();
  }, []);
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>Admin Oversight</CardTitle>
          <CardDescription>Monitor all student complaints and manager responses.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No complaints have been submitted yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Manager's Reply</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium">{complaint.studentName}</TableCell>
                    <TableCell className="max-w-xs truncate">{complaint.text}</TableCell>
                    <TableCell>
                      {complaint.imageUrl ? (
                        <a href={complaint.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center">
                          View <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{complaint.reply || "No reply yet."}</TableCell>
                    <TableCell>{format(new Date(complaint.createdAt), "PPp")}</TableCell>
                    <TableCell>
                      <Badge variant={complaint.reply ? "default" : "secondary"}>
                        {complaint.reply ? "Replied" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}