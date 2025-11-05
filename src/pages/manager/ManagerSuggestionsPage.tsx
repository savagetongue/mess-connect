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
import type { Suggestion } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
// This page is for managing student suggestions.
// For complaints, please see ManagerFeedbackPage.tsx
export function ManagerSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const data = await api<{ suggestions: Suggestion[] }>('/api/suggestions/all');
      setSuggestions(data.suggestions.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch suggestions.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSuggestions();
  }, []);
  const handleReplySubmit = async () => {
    if (!selectedSuggestion || !replyText.trim()) return;
    setIsReplying(true);
    try {
      await api(`/api/suggestions/${selectedSuggestion.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      toast.success("Reply sent successfully.");
      setSelectedSuggestion(null);
      setReplyText("");
      fetchSuggestions(); // Refresh the list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reply.");
    } finally {
      setIsReplying(false);
    }
  };
  const filteredSuggestions = useMemo(() => {
    return suggestions
      .filter(s => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending') return !s.reply;
        if (statusFilter === 'replied') return !!s.reply;
        return true;
      })
      .filter(s =>
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [suggestions, searchTerm, statusFilter]);
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Student Suggestions</CardTitle>
              <CardDescription>View and respond to student suggestions. This is separate from complaints.</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search suggestions..."
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
          ) : filteredSuggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No suggestions match your criteria.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Suggestion</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuggestions.map((suggestion) => (
                  <TableRow key={suggestion.id}>
                    <TableCell className="font-medium">{suggestion.studentName}</TableCell>
                    <TableCell className="max-w-sm truncate">{suggestion.text}</TableCell>
                    <TableCell>{format(new Date(suggestion.createdAt), "PP")}</TableCell>
                    <TableCell>
                      <Badge variant={suggestion.reply ? "default" : "secondary"}>
                        {suggestion.reply ? "Replied" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => setSelectedSuggestion(suggestion)}>
                        {suggestion.reply ? "View" : "View & Reply"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!selectedSuggestion} onOpenChange={(isOpen) => !isOpen && setSelectedSuggestion(null)}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Suggestion Details</DialogTitle>
            <DialogDescription>From: {selectedSuggestion?.studentName}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="font-semibold">Suggestion:</Label>
              <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted">{selectedSuggestion?.text}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply" className="font-semibold">Your Reply:</Label>
              {selectedSuggestion?.reply ? (
                 <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted">{selectedSuggestion.reply}</p>
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
            {!selectedSuggestion?.reply && (
              <Button onClick={handleReplySubmit} disabled={isReplying}>
                {isReplying ? "Sending..." : "Send Reply"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}