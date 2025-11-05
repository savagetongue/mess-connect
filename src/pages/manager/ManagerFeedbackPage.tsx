import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Search } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Complaint } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { AspectRatio } from "@/components/ui/aspect-ratio";
export function ManagerFeedbackPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
  const handleReplySubmit = async () => {
    if (!selectedComplaint || !replyText.trim()) return;
    setIsReplying(true);
    try {
      await api(`/api/complaints/${selectedComplaint.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      toast.success("Reply sent successfully.");
      setSelectedComplaint(null);
      setReplyText("");
      fetchComplaints(); // Refresh the list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reply.");
    } finally {
      setIsReplying(false);
    }
  };
  const filteredComplaints = useMemo(() => {
    return complaints
      .filter(c => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending') return !c.reply;
        if (statusFilter === 'replied') return !!c.reply;
        return true;
      })
      .filter(c =>
        c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [complaints, searchTerm, statusFilter]);
  const complaintInDialog = selectedComplaint ? complaints.find(c => c.id === selectedComplaint.id) : null;
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Student Feedback</CardTitle>
              <CardDescription>View and respond to student complaints.</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search complaints..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
          ) : filteredComplaints.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No complaints match your criteria.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium">{complaint.studentName}</TableCell>
                    <TableCell className="max-w-sm truncate">{complaint.text}</TableCell>
                    <TableCell>{format(new Date(complaint.createdAt), "PP")}</TableCell>
                    <TableCell>
                      <Badge variant={complaint.reply ? "default" : "secondary"}>
                        {complaint.reply ? "Replied" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => setSelectedComplaint(complaint)}>
                        {complaint.reply ? "View" : "View & Reply"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!complaintInDialog} onOpenChange={(isOpen) => !isOpen && setSelectedComplaint(null)}>
        <DialogContent className="sm:max-w-[525px]">
          {complaintInDialog && (
            <>
              <DialogHeader>
                <DialogTitle>Complaint Details</DialogTitle>
                <DialogDescription>From: {complaintInDialog.studentName}</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <Label className="font-semibold">Complaint:</Label>
                  <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted">{complaintInDialog.text}</p>
                </div>
                {complaintInDialog.imageBase64 && (
                  <div>
                    <Label className="font-semibold">Attached Image:</Label>
                    <div className="mt-2 w-full rounded-md overflow-hidden border">
                      <AspectRatio ratio={16 / 9}>
                        <img
                          src={complaintInDialog.imageBase64}
                          alt="Complaint attachment"
                          className="object-cover w-full h-full"
                        />
                      </AspectRatio>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="reply" className="font-semibold">Your Reply:</Label>
                  {complaintInDialog.reply ? (
                     <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted">{complaintInDialog.reply}</p>
                  ) : (
                    <Textarea
                      id="reply"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply here..."
                      rows={4}
                    />
                  )}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                {!complaintInDialog.reply && (
                  <Button onClick={handleReplySubmit} disabled={isReplying}>
                    {isReplying ? "Sending..." : "Send Reply"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}