import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
import { useState } from "react";
const complaintSchema = z.object({
  text: z.string().min(10, "Complaint must be at least 10 characters long."),
  image: z.any().optional(),
});
type ComplaintFormValues = z.infer<typeof complaintSchema>;
export function ComplaintsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: { text: "" },
  });
  const onSubmit = async (values: ComplaintFormValues) => {
    setIsLoading(true);
    try {
      // NOTE: Actual file upload is not implemented.
      // We send a placeholder URL to simulate the feature.
      const payload = {
        text: values.text,
        imageUrl: values.image?.[0] ? `https://picsum.photos/seed/${Date.now()}/400/300` : undefined,
      };
      await api('/api/complaints', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success("Complaint submitted successfully!");
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit complaint.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <AppLayout container>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submit a New Complaint</CardTitle>
            <CardDescription>We are sorry for the inconvenience. Please describe your issue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complaint Details</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Please provide as much detail as possible..." rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attach an Image (Optional)</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Complaint"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Past Complaints</CardTitle>
            <CardDescription>Here is a list of your previously submitted complaints.</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>You have no past complaints.</p>
            <p className="text-sm">(This feature is coming soon)</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}