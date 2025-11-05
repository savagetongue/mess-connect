import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Toaster, toast } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { api } from '@/lib/api-client';
import { Utensils, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageToggle } from '@/components/LanguageToggle';
declare global {
  interface Window {
    Razorpay: any;
  }
}
const guestPaymentSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  amount: z.number().positive({ message: 'Amount must be a positive number.' }),
});
type GuestPaymentFormValues = z.infer<typeof guestPaymentSchema>;
export function GuestPaymentPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<GuestPaymentFormValues>({
    resolver: zodResolver(guestPaymentSchema),
    defaultValues: { name: '', phone: '', amount: 0 },
  });
  const onSubmit = async (values: GuestPaymentFormValues) => {
    setIsLoading(true);
    try {
      const order = await api<{ id: string; amount: number; currency: string }>('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount: values.amount, name: values.name, phone: values.phone }),
      });
      const options = {
        key: 'rzp_test_Rc4X9qW2OGg1Ch',
        amount: order.amount,
        currency: order.currency,
        name: 'Mess Connect',
        description: 'Guest Meal Payment',
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await api('/api/payments/verify-payment', {
              method: 'POST',
              body: JSON.stringify({
                ...response,
                amount: values.amount,
                name: values.name,
                phone: values.phone,
              }),
            });
            toast.success('Payment successful!', { description: 'Thank you for dining with us.' });
            form.reset();
          } catch (verifyError: any) {
            toast.error(verifyError.message || 'Payment verification failed.');
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          },
        },
        prefill: {
          name: values.name,
          contact: values.phone,
        },
        theme: {
          color: '#F97316',
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create payment order.');
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle className="relative top-0 right-0" />
      </div>
      <div className="absolute top-4 left-4">
        <Button asChild variant="outline" size="icon">
          <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-white to-orange-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 opacity-50 -z-10" />
      <div className="flex flex-col items-center space-y-4 mb-8">
        <div className="p-4 bg-orange-500 text-white rounded-full shadow-lg">
          <Utensils className="h-8 w-8" />
        </div>
        <h1 className="text-5xl font-bold text-foreground font-display">{t('appName')}</h1>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('guestPaymentTitle')}</CardTitle>
          <CardDescription>{t('guestPaymentDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>{t('fullNameLabel')}</FormLabel><FormControl><Input placeholder={t('fullNamePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>{t('phoneLabel')}</FormLabel><FormControl><Input placeholder={t('phonePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('amountLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('amountPlaceholder')}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isLoading}>
                {isLoading ? t('processingButton') : t('payNowButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Toaster richColors />
    </div>
  );
}