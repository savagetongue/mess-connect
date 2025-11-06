import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Utensils } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageToggle } from '@/components/LanguageToggle';
const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});
type RegisterFormValues = z.infer<typeof registerSchema>;
export function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  });
  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await api('/api/register', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('Registration successful!', {
        description: 'Your account is pending approval. Redirecting...',
        duration: 2000,
        onAutoClose: () => navigate('/pending-approval'),
      });
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle className="relative top-0 right-0" />
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
          <CardTitle>{t('registerTitle')}</CardTitle>
          <CardDescription>{t('registerDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>{t('fullNameLabel')}</FormLabel><FormControl><Input placeholder={t('fullNamePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>{t('emailLabel')}</FormLabel><FormControl><Input placeholder={t('emailPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>{t('phoneLabel')}</FormLabel><FormControl><Input placeholder={t('phonePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>{t('passwordLabel')}</FormLabel><FormControl><Input type="password" placeholder={t('passwordPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isLoading}>
                {isLoading ? t('registeringButton') : t('registerButton')}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            {t('haveAccount')}{' '}
            <Link to="/" className="font-medium text-orange-500 hover:underline">
              {t('loginHere')}
            </Link>
          </div>
        </CardContent>
      </Card>
      <Toaster richColors />
    </div>
  );
}