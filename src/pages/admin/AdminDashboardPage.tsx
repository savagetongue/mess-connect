import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Search } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Complaint } from "@shared/types";
import { format } from "date-fns";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { motion } from "framer-motion";
export function AdminDashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Admin Oversight</CardTitle>
                <CardDescription>Monitor all student complaints and manager responses.</CardDescription>
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
                    aria-label="Search complaints by student name or text"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]" aria-label="Filter complaints by status">
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
                    <TableHead>Image</TableHead>
                    <TableHead>Manager's Reply</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((complaint) => (
                    <motion.tr
                      key={complaint.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.01 }}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{complaint.studentName}</TableCell>
                      <TableCell className="max-w-xs truncate">{complaint.text}</TableCell>
                      <TableCell>
                        {complaint.imageBase64 ? (
                          <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setSelectedImage(complaint.imageBase64!)}>
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
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
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