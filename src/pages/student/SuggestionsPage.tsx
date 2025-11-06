import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import type { Suggestion } from "@shared/types";
import { useTranslation } from "@/hooks/useTranslation";
const suggestionSchema = z.object({
  text: z.string().min(10, "Suggestion must be at least 10 characters long."),
});
type SuggestionFormValues = z.infer<typeof suggestionSchema>;
export function SuggestionsPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [pastSuggestions, setPastSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await api<{ suggestions: Suggestion[] }>('/api/student/suggestions');
      setPastSuggestions(data.suggestions.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      toast.error("Failed to load past suggestions.");
    } finally {
      setLoadingSuggestions(false);
    }
  };
  useEffect(() => {
    fetchSuggestions();
  }, []);
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
      fetchSuggestions(); // Refresh the list
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
            <CardTitle>{t('submitSuggestionTitle')}</CardTitle>
            <CardDescription>{t('submitSuggestionDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('yourSuggestionLabel')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('yourSuggestionPlaceholder')} rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('submittingButton') : t('submitSuggestionButton')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('pastSuggestionsTitle')}</CardTitle>
            <CardDescription>{t('pastSuggestionsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSuggestions ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : pastSuggestions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Lightbulb className="mx-auto h-12 w-12" />
                <p className="mt-4">{t('noPastSuggestions')}</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {pastSuggestions.map((suggestion) => (
                  <AccordionItem value={suggestion.id} key={suggestion.id}>
                    <AccordionTrigger>
                      <div className="flex justify-between items-center w-full pr-4">
                        <span className="truncate max-w-xs">{suggestion.text}</span>
                        <Badge variant={suggestion.reply ? "default" : "secondary"}>
                          {suggestion.reply ? t('replied') : t('pending')}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 px-2">
                        <p className="text-sm text-muted-foreground">{suggestion.text}</p>
                        <p className="text-xs text-muted-foreground">{t('date')}: {format(new Date(suggestion.createdAt), "PPp")}</p>
                        {suggestion.reply ? (
                          <div className="p-3 bg-muted rounded-md">
                            <p className="text-sm font-semibold flex items-center"><MessageSquare className="h-4 w-4 mr-2" /> {t('managerReply')}</p>
                            <p className="text-sm text-muted-foreground pl-6">{suggestion.reply}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-yellow-600">{t('awaitingReply')}</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}