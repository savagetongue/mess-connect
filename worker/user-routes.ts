import { Hono } from "hono";
import { z } from 'zod';
import type { Env } from './core-utils';
import { UserEntity, ComplaintEntity, MenuEntity, GuestPaymentEntity, PaymentEntity, NoteEntity, SuggestionEntity, SettingEntity, NotificationEntity, VerificationTokenEntity, ResetTokenEntity } from "./entities";
import { ok, bad, notFound, Index } from './core-utils';
function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
import type { User, WeeklyMenu, Complaint, Note, Payment, Setting } from "@shared/types";
import { format } from "date-fns";
export type HonoVariables = {
    user?: User;
};
// Schemas
const RegisterSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
const ForgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});
const ResetPasswordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
});
const SuggestionSchema = z.object({ text: z.string().min(10, "Suggestion must be at least 10 characters."), });
const ReplySchema = z.object({ reply: z.string().min(1, "Reply cannot be empty."), });
const MenuSchema = z.object({ id: z.literal('singleton'), days: z.array(z.object({ day: z.string(), breakfast: z.string(), lunch: z.string(), dinner: z.string(), })).length(7), });
const NoteSchema = z.object({ text: z.string().min(1, "Note cannot be empty."), });
const UpdateNoteSchema = z.object({ completed: z.boolean(), });
const BroadcastSchema = z.object({ message: z.string().min(10, "Message must be at least 10 characters."), });
const NotificationSchema = z.object({ message: z.string().min(10, "Message must be at least 10 characters."), });
const MarkAsPaidSchema = z.object({ studentId: z.string(), amount: z.number().positive(), });
const FeeSchema = z.object({ monthlyFee: z.number().positive("Fee must be a positive number."), });
const RulesSchema = z.object({ messRules: z.string().min(10, "Rules must be at least 10 characters."), });
const CreateOrderSchema = z.object({ amount: z.number().positive(), name: z.string().optional(), phone: z.string().optional(), studentId: z.string().optional(), });
const VerifyPaymentSchema = z.object({ razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string(), amount: z.number(), name: z.string().optional(), phone: z.string().optional(), studentId: z.string().optional(), });
// In-memory cache for settings
const settingsCache = new Map<string, { data: Partial<Setting>; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
async function getCachedSettings(env: Env): Promise<Partial<Setting> | null> {
    const now = Date.now();
    const cached = settingsCache.get('singleton');
    if (cached && now - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    try {
        const settingEntity = new SettingEntity(env, 'singleton');
        if (!await settingEntity.exists()) {
            await settingEntity.save(SettingEntity.initialState);
        }
        const settings = await settingEntity.getState();
        const dataToCache = { monthlyFee: settings.monthlyFee, messRules: settings.messRules };
        settingsCache.set('singleton', { data: dataToCache, timestamp: now });
        return dataToCache;
    } catch (e) {
        console.error("Failed to fetch/cache settings:", e);
        return null;
    }
}
// Email Sending Helper
async function sendEmail(env: Env, to: string, subject: string, html: string) {
    const { RESEND_API_KEY, WORKER_DOMAIN } = env;
    if (typeof RESEND_API_KEY === 'undefined' || RESEND_API_KEY.trim() === '') {
        console.error("RESEND_API_KEY is not configured. Email functionality is disabled.");
        return { success: false, error: "email_not_configured" };
    }
    const fromAddress = `Mess Connect <no-reply@${WORKER_DOMAIN || 'messconnect.app'}>`;
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: fromAddress, to: [to], subject, html }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Failed to send email via Resend: status=${response.status} body=${errorBody}`);
            return { success: false, error: "email_send_failed" };
        }
        return { success: true };
    } catch (error) {
        console.error('Error sending email via Resend:', error);
        return { success: false, error: "email_exception" };
    }
}
const getEmailTemplate = (title: string, body: string, buttonText: string, link: string) => `
  <!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h1 style="color: #333;">${title}</h1>
      <p style="color: #555; line-height: 1.6;">${body}</p>
      <a href="${link}" style="display: inline-block; background-color: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px;">${buttonText}</a>
    </div>
  </body></html>`;
// Auth Middleware
const getUser = async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer fake-token-for-')) {
        const email = authHeader.substring('Bearer fake-token-for-'.length);
        const userEntity = new UserEntity(c.env, email);
        if (await userEntity.exists()) {
            (c as any).set('user', await userEntity.getState());
        }
    }
    await next();
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
app.use('/*', async (c, next) => {
    const adminEmail = 'admin@messconnect.com';
    const managerEmail = 'manager@messconnect.com';
    const adminUser = new UserEntity(c.env, adminEmail);
    const managerUser = new UserEntity(c.env, managerEmail);
    if (!await adminUser.exists()) {
        await UserEntity.create(c.env, { id: adminEmail, name: 'Admin', phone: '0000000000', passwordHash: 'password', role: 'admin', status: 'approved', verified: true });
    }
    if (!await managerUser.exists()) {
        await UserEntity.create(c.env, { id: managerEmail, name: 'Manager', phone: '1111111111', passwordHash: 'password', role: 'manager', status: 'approved', verified: true });
    }
    const { items: allUsers } = await UserEntity.list(c.env, undefined, 100);
    const unverifiedStudents = allUsers.filter(u => u.role === 'student' && !u.verified);
    if (unverifiedStudents.length > 0) {
        for (const student of unverifiedStudents) {
            await new UserEntity(c.env, student.id).patch({ verified: true });
        }
    }
    await next();
});
// PUBLIC ROUTES
app.post('/api/register', async (c) => {
    const body = await c.req.json();
    const validation = RegisterSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { name, email, phone, password } = validation.data;
    if (await new UserEntity(c.env, email).exists()) return bad(c, 'User with this email already exists.');
    const newUser = await UserEntity.create(c.env, {
        id: email, name, phone, passwordHash: password, role: 'student', status: 'pending', verified: true
    });
    const { passwordHash, ...userResponse } = newUser;
    return ok(c, userResponse);
});
app.post('/api/login', async (c) => {
    const body = await c.req.json();
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) return bad(c, 'Invalid email or password format.');
    const { email, password } = validation.data;
    const userEntity = new UserEntity(c.env, email);
    if (!await userEntity.exists()) return notFound(c, 'User not found.');
    const user = await userEntity.getState();
    if (user.passwordHash !== password) return bad(c, 'Invalid credentials.');
    if (user.role === 'student' && user.status !== 'approved') {
        return c.json({ success: true, data: { status: user.status } }, 200);
    }
    const { passwordHash, ...userResponse } = user;
    return ok(c, { ...userResponse, token: `fake-token-for-${user.id}` });
});
app.post('/api/forgot-password', async (c) => {
    const body = await c.req.json();
    const validation = ForgotPasswordSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { email } = validation.data;
    const userEntity = new UserEntity(c.env, email);
    if (!await userEntity.exists()) {
        return ok(c, { message: 'If an account with this email exists, a password reset link has been sent.' });
    }
    const token = crypto.randomUUID();
    await ResetTokenEntity.create(c.env, { id: token, userId: email, expiresAt: Date.now() + 3600000, used: false });
    const appUrl = (c.env.APP_URL || `https://${c.env.WORKER_DOMAIN}`).replace(/\/$/, "");
    const resetLink = `${appUrl}/reset/${token}`;
    const emailHtml = getEmailTemplate("Reset Your Password", "Click the button below to set a new password.", "Reset Password", resetLink);
    await sendEmail(c.env, email, "Mess Connect - Password Reset Request", emailHtml);
    return ok(c, { message: 'If an account with this email exists, a password reset link has been sent.' });
});
app.post('/api/reset-password/:token', async (c) => {
    const token = c.req.param('token');
    const body = await c.req.json();
    const validation = ResetPasswordSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const tokenEntity = new ResetTokenEntity(c.env, token);
    if (!await tokenEntity.exists()) return notFound(c, 'Invalid reset token.');
    const tokenData = await tokenEntity.getState();
    if (tokenData.used || Date.now() > tokenData.expiresAt) return bad(c, 'This reset link is invalid or has expired.');
    const userEntity = new UserEntity(c.env, tokenData.userId);
    if (!await userEntity.exists()) return notFound(c, 'User not found.');
    await userEntity.patch({ passwordHash: validation.data.password });
    await tokenEntity.patch({ used: true });
    return ok(c, { message: 'Password has been reset successfully.' });
});
app.use('/*', getUser);
app.get('/api/menu', async (c) => {
    const menuEntity = new MenuEntity(c.env, 'singleton');
    if (!await menuEntity.exists()) await menuEntity.save(MenuEntity.initialState);
    return ok(c, await menuEntity.getState());
});
app.post('/api/complaints', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const formData = await c.req.formData();
    const text = formData.get('text') as string;
    const imageFile = formData.get('image') as File;
    if (!text || text.length < 10) return bad(c, "Complaint must be at least 10 characters long.");
    let imageBase64: string | undefined = undefined;
    if (imageFile && imageFile.size > 0) {
        imageBase64 = `data:${imageFile.type};base64,${bufferToBase64(await imageFile.arrayBuffer())}`;
    }
    const complaint = await ComplaintEntity.create(c.env, {
        id: crypto.randomUUID(), studentId: user.id, studentName: user.name, text, imageBase64, createdAt: Date.now()
    });
    return ok(c, complaint);
});
app.post('/api/suggestions', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = SuggestionSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const suggestion = await SuggestionEntity.create(c.env, { id: crypto.randomUUID(), studentId: user.id, studentName: user.name, text: validation.data.text, createdAt: Date.now() });
    return ok(c, suggestion);
});
app.get('/api/settings', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const settings = await getCachedSettings(c.env);
    if (settings) return ok(c, settings);
    return bad(c, "Could not retrieve settings.");
});
app.post('/api/payments/create-order', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    const body = await c.req.json();
    const validation = CreateOrderSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = c.env;
    console.info(`RAZORPAY_KEYS: ID=${!!RAZORPAY_KEY_ID}, SECRET=${!!RAZORPAY_KEY_SECRET}`);
    const notes: Record<string, string> = { app_name: "Mess Connect" };
    if (user && user.role === 'student') {
        notes.payment_type = "student_due"; notes.student_id = user.id; notes.student_name = user.name;
    } else if (validation.data.name && validation.data.phone) {
        notes.payment_type = "guest_payment"; notes.guest_name = validation.data.name; notes.guest_phone = validation.data.phone;
    }
    const options = {
        amount: validation.data.amount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes,
    };
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        console.warn("Razorpay credentials missing. Returning mock order.");
        return ok(c, { id: 'mock_order_' + Date.now(), amount: options.amount, currency: 'INR' });
    }
    try {
        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}` },
            body: JSON.stringify(options)
        });
        const order = await response.json() as { id: string; error?: { description: string } };
        if (!response.ok) return bad(c, order.error?.description || 'Failed to create Razorpay order.');
        return ok(c, order);
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        return bad(c, 'An error occurred while creating the payment order.');
    }
});
app.post('/api/payments/verify-payment', async (c) => {
    const body = await c.req.json();
    const validation = VerifyPaymentSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { RAZORPAY_KEY_SECRET } = c.env;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, name, phone, studentId } = validation.data;
    if (!RAZORPAY_KEY_SECRET) {
        console.warn(`Verification: Mock success (no keys) for order ${razorpay_order_id}`);
        // Fallback for mock payments when keys are not set
        if (studentId) {
            const student = await new UserEntity(c.env, studentId).getState();
            await PaymentEntity.create(c.env, { id: crypto.randomUUID(), userId: studentId, userName: student.name, amount, month: format(new Date(), "yyyy-MM"), status: 'paid', method: 'razorpay', createdAt: Date.now() });
        } else if (name && phone) {
            await GuestPaymentEntity.create(c.env, { id: crypto.randomUUID(), name, phone, amount, createdAt: Date.now() });
        }
        return ok(c, { status: 'success' });
    }
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    try {
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(RAZORPAY_KEY_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
        const generated_signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (generated_signature !== razorpay_signature) return bad(c, 'Payment verification failed.');
        if (studentId) {
            const student = await new UserEntity(c.env, studentId).getState();
            await PaymentEntity.create(c.env, { id: crypto.randomUUID(), userId: studentId, userName: student.name, amount, month: format(new Date(), "yyyy-MM"), status: 'paid', method: 'razorpay', createdAt: Date.now() });
        } else if (name && phone) {
            await GuestPaymentEntity.create(c.env, { id: crypto.randomUUID(), name, phone, amount, createdAt: Date.now() });
        }
        return ok(c, { status: 'success' });
    } catch (error) {
        console.error('Payment verification error:', error);
        return bad(c, 'An error occurred during payment verification.');
    }
});
// STUDENT ROUTES
app.get('/api/student/dues', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allPayments = (await PaymentEntity.list(c.env)).items;
    return ok(c, { payments: allPayments.filter(p => p.userId === user.id) });
});
app.get('/api/student/complaints', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allComplaints = (await ComplaintEntity.list(c.env)).items;
    return ok(c, { complaints: allComplaints.filter(c => c.studentId === user.id) });
});
app.get('/api/student/suggestions', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allSuggestions = (await SuggestionEntity.list(c.env)).items;
    return ok(c, { suggestions: allSuggestions.filter(s => s.studentId === user.id) });
});
app.get('/api/student/notifications', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allNotifications = (await NotificationEntity.list(c.env)).items;
    return ok(c, { notifications: allNotifications.filter(n => n.userId === user.id) });
});
// MANAGER & ADMIN ROUTES
app.get('/api/complaints/all', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) return c.json({ success: false, error: 'Unauthorized' }, 401);
    return ok(c, { complaints: (await ComplaintEntity.list(c.env)).items });
});
app.post('/api/complaints/:id/reply', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = ReplySchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const complaintEntity = new ComplaintEntity(c.env, c.req.param('id'));
    if (!await complaintEntity.exists()) return notFound(c, 'Complaint not found.');
    await complaintEntity.patch({ reply: validation.data.reply });
    return ok(c, { message: 'Reply added successfully.' });
});
// MANAGER ROUTES
app.get('/api/manager/stats', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allUsers = (await UserEntity.list(c.env)).items;
    const allGuestPayments = (await GuestPaymentEntity.list(c.env)).items;
    const allStudentPayments = (await PaymentEntity.list(c.env)).items;
    const students = allUsers.filter(u => u.role === 'student');
    const totalStudents = students.filter(s => s.status === 'approved').length;
    const pendingApprovals = students.filter(s => s.status === 'pending').length;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const isCurrentMonth = (p: { createdAt: number }) => {
        const pDate = new Date(p.createdAt);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    };
    const monthlyRevenue = allGuestPayments.filter(isCurrentMonth).reduce((s, p) => s + p.amount, 0) +
                           allStudentPayments.filter(isCurrentMonth).reduce((s, p) => s + p.amount, 0);
    return ok(c, { totalStudents, pendingApprovals, monthlyRevenue });
});
app.get('/api/students', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allUsers = (await UserEntity.list(c.env)).items;
    return ok(c, { students: allUsers.filter(u => u.role === 'student').map(({ passwordHash, ...rest }) => rest) });
});
app.post('/api/students/:id/approve', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const studentEntity = new UserEntity(c.env, c.req.param('id'));
    if (!await studentEntity.exists()) return notFound(c, 'Student not found.');
    await studentEntity.patch({ status: 'approved' });
    return ok(c, { message: 'Student approved successfully.' });
});
app.post('/api/students/:id/reject', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const studentEntity = new UserEntity(c.env, c.req.param('id'));
    if (!await studentEntity.exists()) return notFound(c, 'Student not found.');
    await studentEntity.patch({ status: 'rejected' });
    return ok(c, { message: 'Student rejected successfully.' });
});
app.post('/api/students/:id/notify', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const studentId = c.req.param('id');
    const body = await c.req.json();
    const validation = NotificationSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    if (!await new UserEntity(c.env, studentId).exists()) return notFound(c, 'Student not found.');
    await NotificationEntity.create(c.env, { id: crypto.randomUUID(), userId: studentId, message: validation.data.message, createdAt: Date.now() });
    return ok(c, { message: `Notification sent to student.` });
});
app.delete('/api/students/:id', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    if (!await UserEntity.delete(c.env, c.req.param('id'))) return notFound(c, 'Student not found.');
    return ok(c, { message: 'Student deleted successfully.' });
});
app.put('/api/menu', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = MenuSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const menuEntity = new MenuEntity(c.env, 'singleton');
    await menuEntity.save(validation.data as WeeklyMenu);
    return ok(c, await menuEntity.getState());
});
app.get('/api/financials', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allUsers = (await UserEntity.list(c.env)).items;
    const students = allUsers.filter(u => u.role === 'student').map(({ passwordHash, ...rest }) => rest);
    const payments = (await PaymentEntity.list(c.env)).items;
    const guestPayments = (await GuestPaymentEntity.list(c.env)).items;
    return ok(c, { students, payments, guestPayments });
});
app.get('/api/suggestions/all', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    return ok(c, { suggestions: (await SuggestionEntity.list(c.env)).items });
});
app.post('/api/suggestions/:id/reply', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = ReplySchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const suggestionEntity = new SuggestionEntity(c.env, c.req.param('id'));
    if (!await suggestionEntity.exists()) return notFound(c, 'Suggestion not found.');
    await suggestionEntity.patch({ reply: validation.data.reply });
    return ok(c, { message: 'Reply added successfully.' });
});
app.get('/api/notes', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    return ok(c, { notes: (await NoteEntity.list(c.env)).items });
});
app.post('/api/notes', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = NoteSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const note = await NoteEntity.create(c.env, { id: crypto.randomUUID(), text: validation.data.text, completed: false, createdAt: Date.now() });
    return ok(c, note);
});
app.put('/api/notes/:id', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = UpdateNoteSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const noteEntity = new NoteEntity(c.env, c.req.param('id'));
    if (!await noteEntity.exists()) return notFound(c, 'Note not found.');
    await noteEntity.patch({ completed: validation.data.completed });
    return ok(c, await noteEntity.getState());
});
app.delete('/api/notes/:id', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    if (!await NoteEntity.delete(c.env, c.req.param('id'))) return notFound(c, 'Note not found.');
    return ok(c, { message: 'Note deleted successfully.' });
});
app.post('/api/settings/clear-all-data', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const entityClasses = [UserEntity, ComplaintEntity, SuggestionEntity, MenuEntity, PaymentEntity, GuestPaymentEntity, NoteEntity, SettingEntity, NotificationEntity, VerificationTokenEntity, ResetTokenEntity];
    for (const EntityClass of entityClasses) {
        const { items: ids } = await new Index(c.env, EntityClass.indexName).page(undefined, 1000);
        if (ids.length > 0) await EntityClass.deleteMany(c.env, ids);
    }
    return ok(c, { message: 'All application data has been cleared.' });
});
app.post('/api/settings/fee', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = FeeSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    await new SettingEntity(c.env, 'singleton').patch({ monthlyFee: validation.data.monthlyFee });
    settingsCache.delete('singleton'); // Invalidate cache
    return ok(c, { message: 'Monthly fee updated successfully.' });
});
app.post('/api/settings/rules', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = RulesSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    await new SettingEntity(c.env, 'singleton').patch({ messRules: validation.data.messRules });
    settingsCache.delete('singleton'); // Invalidate cache
    return ok(c, { message: 'Mess rules updated successfully.' });
});
app.post('/api/broadcast', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = BroadcastSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const allUsers = (await UserEntity.list(c.env)).items;
    const approvedStudents = allUsers.filter(u => u.role === 'student' && u.status === 'approved');
    for (const student of approvedStudents) {
        await NotificationEntity.create(c.env, { id: crypto.randomUUID(), userId: student.id, message: validation.data.message, createdAt: Date.now() });
    }
    return ok(c, { message: `Broadcast sent to ${approvedStudents.length} students.` });
});
app.post('/api/payments/mark-as-paid', async (c) => {
    const user = (c as any).get('user') as User | undefined;
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = MarkAsPaidSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { studentId, amount } = validation.data;
    const studentEntity = new UserEntity(c.env, studentId);
    if (!await studentEntity.exists()) return notFound(c, 'Student not found.');
    const student = await studentEntity.getState();
    const month = format(new Date(), "yyyy-MM");
    const allPayments = (await PaymentEntity.list(c.env)).items;
    if (allPayments.find(p => p.userId === studentId && p.month === month)) {
        return bad(c, 'Student has already paid for this month.');
    }
    const payment = await PaymentEntity.create(c.env, { id: crypto.randomUUID(), userId: studentId, userName: student.name, amount, month, status: 'paid', method: 'cash', createdAt: Date.now() });
    return ok(c, payment);
});
}