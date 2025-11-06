import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Toaster, toast } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { Utensils } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageToggle } from '@/components/LanguageToggle';
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});
type LoginFormValues = z.infer<typeof loginSchema>;
export function HomePage() {
  const { t } = useTranslation();
  const login = useAuth(state => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
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
      <div className="flex flex-col items-center space-y-4 mb-8 animate-fade-in">
        <div className="p-4 bg-orange-500 text-white rounded-full shadow-lg">
          <Utensils className="h-8 w-8" />
        </div>
        <h1 className="text-5xl font-bold text-foreground font-display">{t('appName')}</h1>
        <p className="text-muted-foreground text-lg">{t('appSlogan')}</p>
      </div>
      <Tabs defaultValue="student" className="w-full max-w-md animate-slide-up">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="student">{t('studentLoginTitle')}</TabsTrigger>
          <TabsTrigger value="manager">{t('managerLoginTitle')}</TabsTrigger>
          <TabsTrigger value="admin">{t('adminLoginTitle')}</TabsTrigger>
        </TabsList>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="student">
              <LoginCard role="Student" />
            </TabsContent>
            <TabsContent value="manager">
              <LoginCard role="Manager" />
            </TabsContent>
            <TabsContent value="admin">
              <LoginCard role="Admin" />
            </TabsContent>
          </form>
        </Form>
      </Tabs>

      <Toaster richColors />
    </div>
  );
}
function LoginCard({ role }: { role: 'Student' | 'Manager' | 'Admin' }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const form = useFormContext<LoginFormValues>();
  const isLoading = form.formState.isSubmitting;
  const roleTitleKey = `${role.toLowerCase()}LoginTitle`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(roleTitleKey)}</CardTitle>
        <CardDescription>{t('loginDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('emailLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('emailPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('passwordLabel')}</FormLabel>
              <FormControl>
                <Input type="password" placeholder={t('passwordPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isLoading}>
          {isLoading ? t('signingInButton') : t('signInButton')}
        </Button>
        {role === 'Student' && (
          <div className="text-center text-sm">
            {t('noAccount')}{' '}
            <Button variant="link" className="p-0 h-auto text-orange-500" onClick={() => navigate('/register')}>
              {t('registerHere')}
            </Button>
          </div>
        )}
        <div className="text-center text-sm">
            <Button variant="link" className="p-0 h-auto text-orange-500" onClick={() => navigate('/guest-payment')}>
              {t('guestPaymentLink')}
            </Button>
          </div>
      </CardContent>
    </Card>
  );
}
import { useFormContext } from 'react-hook-form';