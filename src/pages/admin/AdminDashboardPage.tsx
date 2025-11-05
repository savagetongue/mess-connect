import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Complaint } from "@shared/types";
import { format } from "date-fns";
import { AspectRatio } from "@/components/ui/aspect-ratio";
export function AdminDashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
                        <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setSelectedImage(complaint.imageUrl!)}>
                          View Image
                        </Button>
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
      <Dialog open={!!selectedImage} onOpenChange={(isOpen) => !isOpen && setSelectedImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complaint Image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="mt-2 w-full rounded-md overflow-hidden border">
                <AspectRatio ratio={16 / 9}>
                <img
                    src={selectedImage}
                    alt="Complaint attachment"
                    className="object-cover w-full h-full"
                />
                </AspectRatio>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}