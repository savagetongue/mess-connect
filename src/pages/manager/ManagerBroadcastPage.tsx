import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
import { Send } from "lucide-react";
const broadcastSchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters long."),
});
type BroadcastFormValues = z.infer<typeof broadcastSchema>;
export function ManagerBroadcastPage() {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: { message: "" },
  });
  const onSubmit = async (values: BroadcastFormValues) => {
    setIsLoading(true);
    try {
      await api('/api/broadcast', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success("Broadcast sent successfully!", {
        description: "Your message has been queued for delivery to all students.",
      });
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to send broadcast.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>Broadcast Message</CardTitle>
          <CardDescription>Send an urgent message to all students. (Note: This is a simulation and does not send real emails/SMS).</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Mess will be closed tomorrow due to maintenance."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : <> <Send className="mr-2 h-4 w-4" /> Send Broadcast</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}