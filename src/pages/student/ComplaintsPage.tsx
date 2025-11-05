import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
import { useState, useEffect, useRef } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, FileText } from "lucide-react";
import { format } from "date-fns";
import type { Complaint } from "@shared/types";
import { useTranslation } from '@/hooks/useTranslation';
const complaintSchema = z.object({
  text: z.string().min(10, "Complaint must be at least 10 characters long."),
  image: z.instanceof(FileList).optional(),
});
type ComplaintFormValues = z.infer<typeof complaintSchema>;
export function ComplaintsPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [pastComplaints, setPastComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const data = await api<{ complaints: Complaint[] }>('/api/student/complaints');
      setPastComplaints(data.complaints.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      toast.error("Failed to load past complaints.");
    } finally {
      setLoadingComplaints(false);
    }
  };
  useEffect(() => {
    fetchComplaints();
  }, []);
  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: { text: "" },
  });
  const onSubmit = async (values: ComplaintFormValues) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('text', values.text);
      if (values.image && values.image.length > 0) {
        formData.append('image', values.image[0]);
      }
      await api('/api/complaints', {
        method: 'POST',
        body: formData,
      });
      toast.success("Complaint submitted successfully!");
      form.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchComplaints(); // Refresh the list
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
            <CardTitle>{t('submitNewComplaintTitle')}</CardTitle>
            <CardDescription>{t('submitNewComplaintDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('complaintDetailsLabel')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('complaintDetailsPlaceholder')} rows={5} {...field} />
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
                      <FormLabel>{t('attachImageLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={(e) => field.onChange(e.target.files)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('submittingButton') : t('submitComplaintButton')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('pastComplaintsTitle')}</CardTitle>
            <CardDescription>{t('pastComplaintsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingComplaints ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : pastComplaints.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12" />
                <p className="mt-4">{t('noPastComplaints')}</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {pastComplaints.map((complaint) => (
                  <AccordionItem value={complaint.id} key={complaint.id}>
                    <AccordionTrigger>
                      <div className="flex justify-between items-center w-full pr-4">
                        <span className="truncate max-w-xs">{complaint.text}</span>
                        <Badge variant={complaint.reply ? "default" : "secondary"}>
                          {complaint.reply ? t('replied') : t('pending')}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 px-2">
                        <p className="text-sm text-muted-foreground">{complaint.text}</p>
                        <p className="text-xs text-muted-foreground">{t('date')}: {format(new Date(complaint.createdAt), "PPp")}</p>
                        {complaint.reply ? (
                          <div className="p-3 bg-muted rounded-md">
                            <p className="text-sm font-semibold flex items-center"><MessageSquare className="h-4 w-4 mr-2" /> {t('managerReply')}</p>
                            <p className="text-sm text-muted-foreground pl-6">{complaint.reply}</p>
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