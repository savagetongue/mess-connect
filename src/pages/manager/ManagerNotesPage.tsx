import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Trash2, Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Note } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";
const noteSchema = z.object({
  text: z.string().min(1, "Note cannot be empty."),
});
type NoteFormValues = z.infer<typeof noteSchema>;
export function ManagerNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { text: "" },
  });
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await api<{ notes: Note[] }>('/api/notes');
      setNotes(data.notes.sort((a, b) => a.createdAt - b.createdAt));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch notes.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchNotes();
  }, []);
  const onSubmit = async (values: NoteFormValues) => {
    try {
      const newNote = await api<Note>('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ text: values.text.trim() }),
      });
      setNotes(prev => [...prev, newNote]);
      form.reset();
      toast.success("Note added successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add note.");
    }
  };
  const handleToggleNote = async (noteId: string, completed: boolean) => {
    try {
      const updatedNote = await api<Note>(`/api/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !completed }),
      });
      setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update note.");
    }
  };
  const handleDeleteNote = async (noteId: string) => {
    try {
      await api(`/api/notes/${noteId}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success("Note deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete note.");
    }
  };
  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle>Notes & To-Do</CardTitle>
          <CardDescription>Manage your daily expenses and tasks. Your notes are saved automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 mb-4 items-start">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input placeholder="Add a new task or note..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="icon" disabled={form.formState.isSubmitting}>
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </Form>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : notes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No notes yet. Add one above to get started.</p>
            ) : (
              notes.map(note => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 p-2 border rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    id={`note-${note.id}`}
                    checked={note.completed}
                    onCheckedChange={() => handleToggleNote(note.id, note.completed)}
                  />
                  <label
                    htmlFor={`note-${note.id}`}
                    className={`flex-grow text-sm cursor-pointer ${note.completed ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {note.text}
                  </label>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleDeleteNote(note.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}