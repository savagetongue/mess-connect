import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Save, BookOpen } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
const feeSchema = z.object({
  monthlyFee: z.number().positive({ message: "Fee must be a positive number." }),
});
type FeeFormValues = z.infer<typeof feeSchema>;
const rulesSchema = z.object({
  messRules: z.string().min(10, { message: "Rules must be at least 10 characters." }),
});
type RulesFormValues = z.infer<typeof rulesSchema>;
export function ManagerSettingsPage() {
  const [isClearing, setIsClearing] = useState(false);
  const logout = useAuth(s => s.logout);
  const feeForm = useForm<FeeFormValues>({
    resolver: zodResolver(feeSchema),
    defaultValues: { monthlyFee: 0 },
  });
  const rulesForm = useForm<RulesFormValues>({
    resolver: zodResolver(rulesSchema),
    defaultValues: { messRules: "" },
  });
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api<{ monthlyFee: number; messRules?: string }>('/api/settings');
        feeForm.setValue('monthlyFee', data.monthlyFee);
        if (data.messRules) {
          rulesForm.setValue('messRules', data.messRules);
        }
      } catch (error) {
        toast.error("Failed to load current settings.");
      }
    };
    fetchSettings();
  }, [feeForm, rulesForm]);
  const onFeeSubmit = async (values: FeeFormValues) => {
    try {
      await api('/api/settings/fee', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success("Monthly fee updated successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to update fee.");
    }
  };
  const onRulesSubmit = async (values: RulesFormValues) => {
    try {
      await api('/api/settings/rules', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success("Mess rules updated successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to update rules.");
    }
  };
  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await api('/api/settings/clear-all-data', { method: 'POST' });
      toast.success("All application data has been cleared.", {
        description: "You will be logged out.",
      });
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clear data.");
      setIsClearing(false);
    }
  };
  return (
    <AppLayout container>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage application-wide settings.</CardDescription>
          </CardHeader>
        </Card>
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Financial Settings</CardTitle>
              <CardDescription>Set the standard monthly fee for all students.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...feeForm}>
                <form onSubmit={feeForm.handleSubmit(onFeeSubmit)} className="space-y-4">
                  <FormField
                    control={feeForm.control}
                    name="monthlyFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Mess Fee (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 3000"
                            {...field}
                            onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={feeForm.formState.isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {feeForm.formState.isSubmitting ? "Saving..." : "Save Fee"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Mess Rules</CardTitle>
              <CardDescription>Set the rules and regulations for the mess.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...rulesForm}>
                <form onSubmit={rulesForm.handleSubmit(onRulesSubmit)} className="space-y-4">
                  <FormField
                    control={rulesForm.control}
                    name="messRules"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rules</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter mess rules here. Each rule on a new line."
                            rows={8}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={rulesForm.formState.isSubmitting}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {rulesForm.formState.isSubmitting ? "Saving..." : "Save Rules"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <h3 className="font-semibold">Clear All Data</h3>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all students, complaints, payments, and other data.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isClearing}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isClearing ? "Clearing..." : "Clear Data"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all application data, including all users, complaints, and financial records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90">
                      Yes, delete all data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}