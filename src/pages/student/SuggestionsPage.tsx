import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { useState } from "react";
import { api } from "@/lib/api-client";
const suggestionSchema = z.object({
  text: z.string().min(10, "Suggestion must be at least 10 characters long."),
});
type SuggestionFormValues = z.infer<typeof suggestionSchema>;
export function SuggestionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: { text: "" },
  });
  const onSubmit = async (values: SuggestionFormValues) => {
    setIsLoading(true);
    try {
      await api('/api/suggestions', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success("Thank you for your suggestion!");
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit suggestion.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <AppLayout container>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submit a Suggestion</CardTitle>
            <CardDescription>Have an idea to improve our services? We'd love to hear it.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Suggestion</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us your idea..." rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Suggestion"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Past Suggestions</CardTitle>
            <CardDescription>Here are your previously submitted suggestions.</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>You have no past suggestions.</p>
            <p className="text-sm">(This feature is coming soon)</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}