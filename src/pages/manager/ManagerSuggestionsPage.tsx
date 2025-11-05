import { useEffect, useState } from "react";
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
import { AlertCircle } from "lucide-react";
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
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>Student Suggestions</CardTitle>
          <CardDescription>View and respond to student suggestions. This is separate from complaints.</CardDescription>
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
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No suggestions to show.</p>
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
                {suggestions.map((suggestion) => (
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