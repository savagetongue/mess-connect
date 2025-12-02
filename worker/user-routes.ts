import { Hono } from "hono";
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
import { z } from 'zod';
import type { User, WeeklyMenu, Complaint, Note, Payment } from "@shared/types";
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
// Other schemas remain the same...
const SuggestionSchema = z.object({ text: z.string().min(10, "Suggestion must be at least 10 characters."), });
const ReplySchema = z.object({ reply: z.string().min(1, "Reply cannot be empty."), });
const GuestPaymentSchema = z.object({ name: z.string().min(2), phone: z.string().min(10), amount: z.number().positive(), });
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
// Email Sending Helper
async function sendEmail(env: Env, to: string, subject: string, html: string) {
    const { RESEND_API_KEY, WORKER_DOMAIN } = env;
    const key = typeof RESEND_API_KEY === 'string' ? RESEND_API_KEY.trim() : '';
    console.info(`Preview env: RESEND key present: ${!!key && key !== ''}`);
    if (!key) {
        console.error("RESEND_API_KEY environment variable not set or empty. Skipping email send.");
        return { success: false, error: "email_not_configured" };
    }
    // Helpers for masking/redacting logs to avoid leaking secrets or very long responses
    const maskKey = (s: string) => {
        if (!s) return '';
        if (s.length <= 8) return '****';
        return `${s.slice(0, 4)}...${s.slice(-4)}`;
    };
    const redact = (input: any) => {
        try {
            if (input == null) return '';
            const str = typeof input === 'string' ? input : JSON.stringify(input);
            const trimmed = str.trim();
            if (trimmed.length > 500) return `${trimmed.slice(0, 500)}...[truncated]`;
            return trimmed;
        } catch (e) {
            return '[unserializable]';
        }
    };
    const fromAddress = `Mess Connect <no-reply@${WORKER_DOMAIN || 'messconnect.app'}>`;
    const apiUrl = 'https://api.resend.com/emails';
    console.info(`sendEmail: key_present=true masked_key=${maskKey(key)} to=${to} from=${fromAddress} subject="${subject}"`);
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: fromAddress,
                to: [to],
                subject,
                html,
            }),
        });
        const contentType = response.headers.get('content-type') || '';
        let responseBody = '';
        if (contentType.includes('application/json')) {
            try {
                const json = await response.json();
                responseBody = JSON.stringify(json);
            } catch (e) {
                // Fallback to text if JSON parsing fails
                responseBody = await response.text().catch(() => '<unreadable-json-response>');
            }
        } else {
            responseBody = await response.text().catch(() => '<non-text-response>');
        }
        if (!response.ok) {
            console.error(`Failed to send email via Resend: status=${response.status} ${response.statusText} body=${redact(responseBody)}`);
            return { success: false, error: "email_send_failed" };
        }
        console.info(`Email sent successfully to ${to} via Resend. status=${response.status}`);
        return { success: true };
    } catch (error) {
        // Log concise error information (do not print full objects that may contain secrets)
        const message = error && (error as any).message ? (error as any).message : String(error);
        console.error('Error sending email via Resend:', message);
        return { success: false, error: "email_exception" };
    }
}
const getEmailTemplate = (title: string, body: string, buttonText: string, link: string) => `
  <!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <img src="https://via.placeholder.com/150x50?text=Mess+Connect" alt="Mess Connect Logo" style="margin-bottom: 20px;">
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
            c.set('user', await userEntity.getState());
        }
    }
    await next();
};
export function userRoutes(app: Hono<{ Bindings: Env, Variables: HonoVariables }>) {
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
    await next();
});
// PUBLIC ROUTES
app.post('/register', async (c) => {
    const body = await c.req.json();
    const validation = RegisterSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { name, email, phone, password } = validation.data;
    if (await new UserEntity(c.env, email).exists()) return bad(c, 'User with this email already exists.');
    const newUser = await UserEntity.create(c.env, { id: email, name, phone, passwordHash: password, role: 'student', status: 'pending', verified: false });
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 3600000; // 1 hour expiry
    await VerificationTokenEntity.create(c.env, { id: token, userId: email, expiresAt, used: false });
    const appUrl = c.env.APP_URL || `https://${c.env.WORKER_DOMAIN}`;
    const verificationLink = `${appUrl}/verify/${token}`;
    const emailHtml = getEmailTemplate(
        "Verify Your Email Address",
        "Thanks for signing up for Mess Connect! Please click the button below to verify your email address.",
        "Verify Email",
        verificationLink
    );
    const emailResult = await sendEmail(c.env, email, "Mess Connect - Verify Your Email", emailHtml);
    if (!emailResult.success) {
        console.log(`Manual verification link for ${email}: ${verificationLink}`);
    }
    const { passwordHash, ...userResponse } = newUser;
    const responseData = { ...userResponse, note: emailResult.success ? undefined : emailResult.error };
    return ok(c, responseData);
});
app.post('/login', async (c) => {
    const body = await c.req.json();
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) return bad(c, 'Invalid email or password format.');
    const { email, password } = validation.data;
    const userEntity = new UserEntity(c.env, email);
    if (!await userEntity.exists()) return notFound(c, 'User not found.');
    const user = await userEntity.getState();
    if (user.passwordHash !== password) return bad(c, 'Invalid credentials.');
    if (user.role === 'student' && !user.verified) {
        return bad(c, 'Please verify your email before logging in.');
    }
    if (user.role === 'student' && user.status !== 'approved') return c.json({ success: true, data: { status: user.status } }, 200);
    const { passwordHash, ...userResponse } = user;
    return ok(c, { ...userResponse, token: `fake-token-for-${user.id}` });
});
app.get('/verify-email/:token', async (c) => {
    const token = c.req.param('token');
    const tokenEntity = new VerificationTokenEntity(c.env, token);
    if (!await tokenEntity.exists()) return notFound(c, 'Invalid verification token.');
    const tokenData = await tokenEntity.getState();
    if (tokenData.used) return bad(c, 'This verification link has already been used.');
    if (Date.now() > tokenData.expiresAt) return bad(c, 'This verification link has expired.');
    const userEntity = new UserEntity(c.env, tokenData.userId);
    if (!await userEntity.exists()) return notFound(c, 'User associated with this token not found.');
    await userEntity.patch({ verified: true });
    await tokenEntity.patch({ used: true });
    return ok(c, { message: 'Email verified successfully.' });
});
app.post('/forgot-password', async (c) => {
    const body = await c.req.json();
    const validation = ForgotPasswordSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { email } = validation.data;
    const userEntity = new UserEntity(c.env, email);
    if (!await userEntity.exists()) {
        return ok(c, { message: 'If an account with this email exists, a password reset link has been sent.' });
    }
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 3600000; // 1 hour expiry
    await ResetTokenEntity.create(c.env, { id: token, userId: email, expiresAt, used: false });
    const appUrl = c.env.APP_URL || `https://${c.env.WORKER_DOMAIN}`;
    const resetLink = `${appUrl}/reset/${token}`;
    const emailHtml = getEmailTemplate(
        "Reset Your Password",
        "You requested a password reset for your Mess Connect account. Click the button below to set a new password.",
        "Reset Password",
        resetLink
    );
    const emailResult = await sendEmail(c.env, email, "Mess Connect - Password Reset Request", emailHtml);
    if (!emailResult.success) {
        console.log(`Manual reset link for ${email}: ${resetLink}`);
    }
    return ok(c, { message: 'If an account with this email exists, a password reset link has been sent.' });
});
app.post('/reset-password/:token', async (c) => {
    const token = c.req.param('token');
    const body = await c.req.json();
    const validation = ResetPasswordSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const tokenEntity = new ResetTokenEntity(c.env, token);
    if (!await tokenEntity.exists()) return notFound(c, 'Invalid reset token.');
    const tokenData = await tokenEntity.getState();
    if (tokenData.used) return bad(c, 'This reset link has already been used.');
    if (Date.now() > tokenData.expiresAt) return bad(c, 'This reset link has expired.');
    const userEntity = new UserEntity(c.env, tokenData.userId);
    if (!await userEntity.exists()) return notFound(c, 'User associated with this token not found.');
    await userEntity.patch({ passwordHash: validation.data.password });
    await tokenEntity.patch({ used: true });
    return ok(c, { message: 'Password has been reset successfully.' });
});
// PROTECTED ROUTES & OTHER ROUTES...
app.use('/*', getUser);
// ... (The rest of the routes remain unchanged)
app.get('/menu', async (c) => {
    const menuEntity = new MenuEntity(c.env, 'singleton');
    if (!await menuEntity.exists()) await menuEntity.save(MenuEntity.initialState);
    return ok(c, await menuEntity.getState());
});
app.post('/complaints', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const formData = await c.req.formData();
    const text = formData.get('text') as string;
    const imageFile = formData.get('image') as File;
    if (!text || text.length < 10) {
        return bad(c, "Complaint must be at least 10 characters long.");
    }
    let imageBase64: string | undefined = undefined;
    if (imageFile && imageFile.size > 0) {
        const buffer = await imageFile.arrayBuffer();
        const base64 = bufferToBase64(buffer);
        imageBase64 = `data:${imageFile.type};base64,${base64}`;
    }
    const complaint = await ComplaintEntity.create(c.env, {
        id: crypto.randomUUID(),
        studentId: user.id,
        studentName: user.name,
        text,
        imageBase64,
        createdAt: Date.now()
    });
    return ok(c, complaint);
});
app.post('/suggestions', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = SuggestionSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { text } = validation.data;
    const suggestion = await SuggestionEntity.create(c.env, { id: crypto.randomUUID(), studentId: user.id, studentName: user.name, text, createdAt: Date.now() });
    return ok(c, suggestion);
});
app.get('/settings', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const settingEntity = new SettingEntity(c.env, 'singleton');
    if (!await settingEntity.exists()) {
        await settingEntity.save(SettingEntity.initialState);
    }
    const settings = await settingEntity.getState();
    return ok(c, { monthlyFee: settings.monthlyFee, messRules: settings.messRules });
});
// PAYMENT FLOW
app.post('/payments/create-order', async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    const validation = CreateOrderSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = c.env;
    console.info(`Preview env: RAZORPAY keys present: ID=${!!RAZORPAY_KEY_ID}, SECRET=${!!RAZORPAY_KEY_SECRET}`);
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return bad(c, "Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your worker's environment variables.");
    }
    const notes: Record<string, string> = {
        app_name: "Mess Connect",
    };
    if (user && user.role === 'student') {
        notes.payment_type = "student_due";
        notes.student_id = user.id;
        notes.student_name = user.name;
    } else if (validation.data.name && validation.data.phone) {
        notes.payment_type = "guest_payment";
        notes.guest_name = validation.data.name;
        notes.guest_phone = validation.data.phone;
    }
    const options = {
        amount: validation.data.amount * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: notes,
    };
    try {
        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`
            },
            body: JSON.stringify(options)
        });
        const order = await response.json() as { id: string; amount: number; currency: string; error?: { description: string } };
        if (!response.ok) {
            return bad(c, order.error?.description || 'Failed to create Razorpay order.');
        }
        return ok(c, order);
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        return bad(c, 'An error occurred while creating the payment order.');
    }
});
app.post('/payments/verify-payment', async (c) => {
    const body = await c.req.json();
    const validation = VerifyPaymentSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { RAZORPAY_KEY_SECRET } = c.env;
    console.info(`Preview env: RAZORPAY_SECRET present: ${!!RAZORPAY_KEY_SECRET}`);
    if (!RAZORPAY_KEY_SECRET) {
        return bad(c, 'Razorpay secret is not configured.');
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, name, phone, studentId } = validation.data;
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    try {
        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(RAZORPAY_KEY_SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
        const generated_signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (generated_signature !== razorpay_signature) {
            return bad(c, 'Payment verification failed. Signature mismatch.');
        }
        // Signature is valid, proceed to create payment record
        if (studentId) {
            const student = await new UserEntity(c.env, studentId).getState();
            const payment = await PaymentEntity.create(c.env, {
                id: crypto.randomUUID(),
                userId: studentId,
                userName: student.name,
                amount,
                month: format(new Date(), "yyyy-MM"),
                status: 'paid',
                method: 'razorpay',
                createdAt: Date.now(),
            });
            return ok(c, { status: 'success', payment });
        } else if (name && phone) {
            const guestPayment = await GuestPaymentEntity.create(c.env, {
                id: crypto.randomUUID(),
                name,
                phone,
                amount,
                createdAt: Date.now(),
            });
            return ok(c, { status: 'success', payment: guestPayment });
        }
        return bad(c, 'Invalid payment details');
    } catch (error) {
        console.error('Payment verification error:', error);
        return bad(c, 'An error occurred during payment verification.');
    }
});
// STUDENT ROUTES
app.get('/student/dues', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allPayments = (await PaymentEntity.list(c.env)).items;
    const studentPayments = allPayments.filter(p => p.userId === user.id);
    return ok(c, { payments: studentPayments });
});
app.get('/student/complaints', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allComplaints = (await ComplaintEntity.list(c.env)).items;
    const studentComplaints = allComplaints.filter(complaint => complaint.studentId === user.id);
    return ok(c, { complaints: studentComplaints });
});
app.get('/student/suggestions', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allSuggestions = (await SuggestionEntity.list(c.env)).items;
    const studentSuggestions = allSuggestions.filter(suggestion => suggestion.studentId === user.id);
    return ok(c, { suggestions: studentSuggestions });
});
app.get('/student/notifications', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allNotifications = (await NotificationEntity.list(c.env)).items;
    const studentNotifications = allNotifications.filter(n => n.userId === user.id);
    return ok(c, { notifications: studentNotifications });
});
// MANAGER & ADMIN ROUTES
app.get('/complaints/all', async (c) => {
    const user = c.get('user');
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allComplaints = (await ComplaintEntity.list(c.env)).items;
    return ok(c, { complaints: allComplaints });
});
app.post('/complaints/:id/reply', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const complaintId = c.req.param('id');
    const body = await c.req.json();
    const validation = ReplySchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const complaintEntity = new ComplaintEntity(c.env, complaintId);
    if (!await complaintEntity.exists()) return notFound(c, 'Complaint not found.');
    await complaintEntity.patch({ reply: validation.data.reply });
    return ok(c, { message: 'Reply added successfully.' });
});
// MANAGER ROUTES
app.get('/manager/stats', async (c) => {
    const user = c.get('user');
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
    const guestRevenue = allGuestPayments
        .filter(p => {
            const pDate = new Date(p.createdAt);
            return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);
    const studentRevenue = allStudentPayments
        .filter(p => {
            const pDate = new Date(p.createdAt);
            return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);
    const monthlyRevenue = guestRevenue + studentRevenue;
    return ok(c, { totalStudents, pendingApprovals, monthlyRevenue });
});
app.get('/students', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allUsers = (await UserEntity.list(c.env)).items;
    const students = allUsers.filter(u => u.role === 'student').map(({ passwordHash, ...rest }) => rest);
    return ok(c, { students });
});
app.post('/students/:id/approve', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const studentId = c.req.param('id');
    const studentEntity = new UserEntity(c.env, studentId);
    if (!await studentEntity.exists()) return notFound(c, 'Student not found.');
    await studentEntity.patch({ status: 'approved' });
    return ok(c, { message: 'Student approved successfully.' });
});
app.post('/students/:id/reject', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const studentId = c.req.param('id');
    const studentEntity = new UserEntity(c.env, studentId);
    if (!await studentEntity.exists()) return notFound(c, 'Student not found.');
    await studentEntity.patch({ status: 'rejected' });
    return ok(c, { message: 'Student rejected successfully.' });
});
app.post('/students/:id/notify', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const studentId = c.req.param('id');
    const body = await c.req.json();
    const validation = NotificationSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const studentEntity = new UserEntity(c.env, studentId);
    if (!await studentEntity.exists()) return notFound(c, 'Student not found.');
    await NotificationEntity.create(c.env, {
        id: crypto.randomUUID(),
        userId: studentId,
        message: validation.data.message,
        createdAt: Date.now(),
    });
    return ok(c, { message: `Notification sent to student.` });
});
app.delete('/students/:id', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const studentId = c.req.param('id');
    const deleted = await UserEntity.delete(c.env, studentId);
    if (!deleted) return notFound(c, 'Student not found.');
    return ok(c, { message: 'Student deleted successfully.' });
});
app.put('/menu', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = MenuSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const menuEntity = new MenuEntity(c.env, 'singleton');
    await menuEntity.save(validation.data as WeeklyMenu);
    return ok(c, await menuEntity.getState());
});
app.get('/financials', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allUsers = (await UserEntity.list(c.env)).items;
    const students = allUsers.filter(u => u.role === 'student').map(({ passwordHash, ...rest }) => rest);
    const payments = (await PaymentEntity.list(c.env)).items;
    const guestPayments = (await GuestPaymentEntity.list(c.env)).items;
    return ok(c, { students, payments, guestPayments });
});
app.get('/suggestions/all', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allSuggestions = (await SuggestionEntity.list(c.env)).items;
    return ok(c, { suggestions: allSuggestions });
});
app.post('/suggestions/:id/reply', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const suggestionId = c.req.param('id');
    const body = await c.req.json();
    const validation = ReplySchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const suggestionEntity = new SuggestionEntity(c.env, suggestionId);
    if (!await suggestionEntity.exists()) return notFound(c, 'Suggestion not found.');
    await suggestionEntity.patch({ reply: validation.data.reply });
    return ok(c, { message: 'Reply added successfully.' });
});
// Manager Notes Routes
app.get('/notes', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allNotes = (await NoteEntity.list(c.env)).items;
    return ok(c, { notes: allNotes });
});
app.post('/notes', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = NoteSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const note = await NoteEntity.create(c.env, { id: crypto.randomUUID(), text: validation.data.text, completed: false, createdAt: Date.now() });
    return ok(c, note);
});
app.put('/notes/:id', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const noteId = c.req.param('id');
    const body = await c.req.json();
    const validation = UpdateNoteSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const noteEntity = new NoteEntity(c.env, noteId);
    if (!await noteEntity.exists()) return notFound(c, 'Note not found.');
    await noteEntity.patch({ completed: validation.data.completed });
    return ok(c, await noteEntity.getState());
});
app.delete('/notes/:id', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const noteId = c.req.param('id');
    const deleted = await NoteEntity.delete(c.env, noteId);
    if (!deleted) return notFound(c, 'Note not found.');
    return ok(c, { message: 'Note deleted successfully.' });
});
// Manager Settings
app.post('/settings/clear-all-data', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const entityClasses = [UserEntity, ComplaintEntity, SuggestionEntity, MenuEntity, PaymentEntity, GuestPaymentEntity, NoteEntity, SettingEntity, NotificationEntity, VerificationTokenEntity, ResetTokenEntity];
    for (const EntityClass of entityClasses) {
        const index = new Index(c.env, EntityClass.indexName);
        const { items: ids } = await index.page(undefined, 1000); // Get all items
        if (ids.length > 0) {
            await EntityClass.deleteMany(c.env, ids); // This also removes from index
        }
    }
    return ok(c, { message: 'All application data has been cleared.' });
});
app.get('/settings/fee', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const settingEntity = new SettingEntity(c.env, 'singleton');
    if (!await settingEntity.exists()) {
        await settingEntity.save(SettingEntity.initialState);
    }
    const settings = await settingEntity.getState();
    return ok(c, { monthlyFee: settings.monthlyFee });
});
app.post('/settings/fee', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = FeeSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const settingEntity = new SettingEntity(c.env, 'singleton');
    await settingEntity.patch({ monthlyFee: validation.data.monthlyFee });
    return ok(c, { message: 'Monthly fee updated successfully.' });
});
app.post('/settings/rules', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = RulesSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const settingEntity = new SettingEntity(c.env, 'singleton');
    await settingEntity.patch({ messRules: validation.data.messRules });
    return ok(c, { message: 'Mess rules updated successfully.' });
});
// New Manager Routes
app.post('/broadcast', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = BroadcastSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const allUsers = (await UserEntity.list(c.env)).items;
    const approvedStudents = allUsers.filter(u => u.role === 'student' && u.status === 'approved');
    for (const student of approvedStudents) {
        await NotificationEntity.create(c.env, {
            id: crypto.randomUUID(),
            userId: student.id,
            message: validation.data.message,
            createdAt: Date.now(),
        });
    }
    return ok(c, { message: `Broadcast sent to ${approvedStudents.length} students.` });
});
app.post('/payments/mark-as-paid', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = MarkAsPaidSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { studentId, amount } = validation.data;
    const studentEntity = new UserEntity(c.env, studentId);
    if (!await studentEntity.exists()) return notFound(c, 'Student not found.');
    const student = await studentEntity.getState();
    const month = format(new Date(), "yyyy-MM");
    // Check if already paid for this month
    const allPayments = (await PaymentEntity.list(c.env)).items;
    const existingPayment = allPayments.find(p => p.userId === studentId && p.month === month);
    if (existingPayment) {
        return bad(c, 'Student has already paid for this month.');
    }
    const payment = await PaymentEntity.create(c.env, {
        id: crypto.randomUUID(),
        userId: studentId,
        userName: student.name,
        amount,
        month,
        status: 'paid',
        method: 'cash',
        createdAt: Date.now(),
    });
    return ok(c, payment);
});
// TEMPORARY CLEANUP ENDPOINT - TO BE REMOVED AFTER ONE-TIME USE
app.post('/manager/cleanup-test-accounts', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    try {
        console.log("Starting test account cleanup...");
        const allUsers = (await UserEntity.list(c.env)).items;
        const allPayments = (await PaymentEntity.list(c.env)).items;
        const allComplaints = (await ComplaintEntity.list(c.env)).items;
        const allSuggestions = (await SuggestionEntity.list(c.env)).items;
        const allNotifications = (await NotificationEntity.list(c.env)).items;
        const testUserEmails = [
            'anandbhagyawant8719@gmail.com',
            '0209',
            'gpt'
        ];
        const usersToDelete = allUsers.filter(u =>
            testUserEmails.some(pattern => u.id.toLowerCase().includes(pattern))
        );
        if (usersToDelete.length === 0) {
            console.log("No test accounts found to clean up.");
            return ok(c, { message: "No test accounts found to clean up.", deleted: { users: 0, totalRecords: 0 } });
        }
        let totalRecordsDeleted = 0;
        for (const userToDelete of usersToDelete) {
            const userId = userToDelete.id;
            console.log(`Cleaning up data for user: ${userId}`);
            // Cascade delete associated data
            const paymentsToDelete = allPayments.filter(p => p.userId === userId).map(p => p.id);
            if (paymentsToDelete.length > 0) {
                const count = await PaymentEntity.deleteMany(c.env, paymentsToDelete);
                console.log(`Deleted ${count} payments for ${userId}`);
                totalRecordsDeleted += count;
            }
            const complaintsToDelete = allComplaints.filter(p => p.studentId === userId).map(p => p.id);
            if (complaintsToDelete.length > 0) {
                const count = await ComplaintEntity.deleteMany(c.env, complaintsToDelete);
                console.log(`Deleted ${count} complaints for ${userId}`);
                totalRecordsDeleted += count;
            }
            const suggestionsToDelete = allSuggestions.filter(p => p.studentId === userId).map(p => p.id);
            if (suggestionsToDelete.length > 0) {
                const count = await SuggestionEntity.deleteMany(c.env, suggestionsToDelete);
                console.log(`Deleted ${count} suggestions for ${userId}`);
                totalRecordsDeleted += count;
            }
            const notificationsToDelete = allNotifications.filter(p => p.userId === userId).map(p => p.id);
            if (notificationsToDelete.length > 0) {
                const count = await NotificationEntity.deleteMany(c.env, notificationsToDelete);
                console.log(`Deleted ${count} notifications for ${userId}`);
                totalRecordsDeleted += count;
            }
        }
        // Finally, delete the users themselves
        const userIdsToDelete = usersToDelete.map(u => u.id);
        const userDeleteCount = await UserEntity.deleteMany(c.env, userIdsToDelete);
        console.log(`Deleted ${userDeleteCount} user accounts.`);
        totalRecordsDeleted += userDeleteCount;
        console.log("Test account cleanup finished.");
        return ok(c, {
            message: "Test account cleanup successful.",
            deleted: {
                users: userDeleteCount,
                totalRecords: totalRecordsDeleted,
            }
        });
    } catch (error) {
        console.error("Error during test account cleanup:", error);
        return bad(c, "An error occurred during cleanup.");
    }
});
}