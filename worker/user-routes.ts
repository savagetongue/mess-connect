import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ComplaintEntity, MenuEntity, GuestPaymentEntity, PaymentEntity, NoteEntity, SuggestionEntity, SettingEntity, NotificationEntity } from "./entities";
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
// Complaint schema is now handled by FormData parsing
const SuggestionSchema = z.object({
    text: z.string().min(10, "Suggestion must be at least 10 characters."),
});
const ReplySchema = z.object({
    reply: z.string().min(1, "Reply cannot be empty."),
});
const GuestPaymentSchema = z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    amount: z.number().positive(),
});
const MenuSchema = z.object({
    id: z.literal('singleton'),
    days: z.array(z.object({
        day: z.string(),
        breakfast: z.string(),
        lunch: z.string(),
        dinner: z.string(),
    })).length(7),
});
const NoteSchema = z.object({
    text: z.string().min(1, "Note cannot be empty."),
});
const UpdateNoteSchema = z.object({
    completed: z.boolean(),
});
const BroadcastSchema = z.object({
    message: z.string().min(10, "Message must be at least 10 characters."),
});
const NotificationSchema = z.object({
    message: z.string().min(10, "Message must be at least 10 characters."),
});
const MarkAsPaidSchema = z.object({
    studentId: z.string(),
    amount: z.number().positive(),
});
const FeeSchema = z.object({
    monthlyFee: z.number().positive("Fee must be a positive number."),
});
const RulesSchema = z.object({
    messRules: z.string().min(10, "Rules must be at least 10 characters."),
});
const CreateOrderSchema = z.object({
    amount: z.number().positive(),
    name: z.string().optional(), // For guest
    phone: z.string().optional(), // For guest
    studentId: z.string().optional(), // For student
});
const VerifyPaymentSchema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
    amount: z.number(),
    name: z.string().optional(),
    phone: z.string().optional(),
    studentId: z.string().optional(),
});
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

app.use('/api/*', async (c, next) => {
    const adminEmail = 'admin@messconnect.com';
    const managerEmail = 'manager@messconnect.com';
    const adminUser = new UserEntity(c.env, adminEmail);
    const managerUser = new UserEntity(c.env, managerEmail);
    if (!await adminUser.exists()) {
        await UserEntity.create(c.env, { id: adminEmail, name: 'Admin', phone: '0000000000', passwordHash: 'password', role: 'admin', status: 'approved' });
    }
    if (!await managerUser.exists()) {
        await UserEntity.create(c.env, { id: managerEmail, name: 'Manager', phone: '1111111111', passwordHash: 'password', role: 'manager', status: 'approved' });
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
    const newUser = await UserEntity.create(c.env, { id: email, name, phone, passwordHash: password, role: 'student', status: 'pending' });
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
    if (user.role === 'student' && user.status !== 'approved') return c.json({ success: true, data: { status: user.status } }, 200);
    const { passwordHash, ...userResponse } = user;
    return ok(c, { ...userResponse, token: `fake-token-for-${user.id}` });
});
// PROTECTED ROUTES
app.use('/api/*', getUser);
app.get('/api/menu', async (c) => {
    const menuEntity = new MenuEntity(c.env, 'singleton');
    if (!await menuEntity.exists()) await menuEntity.save(MenuEntity.initialState);
    return ok(c, await menuEntity.getState());
});
app.post('/api/complaints', async (c) => {
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
app.post('/api/suggestions', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = SuggestionSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { text } = validation.data;
    const suggestion = await SuggestionEntity.create(c.env, { id: crypto.randomUUID(), studentId: user.id, studentName: user.name, text, createdAt: Date.now() });
    return ok(c, suggestion);
});
app.get('/api/settings', async (c) => {
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
app.post('/api/payments/create-order', async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    const validation = CreateOrderSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = c.env;
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
app.post('/api/payments/verify-payment', async (c) => {
    const body = await c.req.json();
    const validation = VerifyPaymentSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const { RAZORPAY_KEY_SECRET } = c.env;
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
app.get('/api/student/dues', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allPayments = (await PaymentEntity.list(c.env)).items;
    const studentPayments = allPayments.filter(p => p.userId === user.id);
    return ok(c, { payments: studentPayments });
});
app.get('/api/student/complaints', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allComplaints = (await ComplaintEntity.list(c.env)).items;
    const studentComplaints = allComplaints.filter(complaint => complaint.studentId === user.id);
    return ok(c, { complaints: studentComplaints });
});
app.get('/api/student/suggestions', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allSuggestions = (await SuggestionEntity.list(c.env)).items;
    const studentSuggestions = allSuggestions.filter(suggestion => suggestion.studentId === user.id);
    return ok(c, { suggestions: studentSuggestions });
});
app.get('/api/student/notifications', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'student') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allNotifications = (await NotificationEntity.list(c.env)).items;
    const studentNotifications = allNotifications.filter(n => n.userId === user.id);
    return ok(c, { notifications: studentNotifications });
});
// MANAGER & ADMIN ROUTES
app.get('/api/complaints/all', async (c) => {
    const user = c.get('user');
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allComplaints = (await ComplaintEntity.list(c.env)).items;
    return ok(c, { complaints: allComplaints });
});
app.post('/api/complaints/:id/reply', async (c) => {
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
app.get('/api/manager/stats', async (c) => {
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
app.get('/api/students', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allUsers = (await UserEntity.list(c.env)).items;
    const students = allUsers.filter(u => u.role === 'student').map(({ passwordHash, ...rest }) => rest);
    return ok(c, { students });
});
app.post('/api/students/:id/approve', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const studentId = c.req.param('id');
    const studentEntity = new UserEntity(c.env, studentId);
    if (!await studentEntity.exists()) return notFound(c, 'Student not found.');
    await studentEntity.patch({ status: 'approved' });
    return ok(c, { message: 'Student approved successfully.' });
});
app.post('/api/students/:id/reject', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const studentId = c.req.param('id');
    const studentEntity = new UserEntity(c.env, studentId);
    if (!await studentEntity.exists()) return notFound(c, 'Student not found.');
    await studentEntity.patch({ status: 'rejected' });
    return ok(c, { message: 'Student rejected successfully.' });
});
app.post('/api/students/:id/notify', async (c) => {
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
app.delete('/api/students/:id', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const studentId = c.req.param('id');
    const deleted = await UserEntity.delete(c.env, studentId);
    if (!deleted) return notFound(c, 'Student not found.');
    return ok(c, { message: 'Student deleted successfully.' });
});
app.put('/api/menu', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = MenuSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const menuEntity = new MenuEntity(c.env, 'singleton');
    await menuEntity.save(validation.data as WeeklyMenu);
    return ok(c, await menuEntity.getState());
});
app.get('/api/financials', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allUsers = (await UserEntity.list(c.env)).items;
    const students = allUsers.filter(u => u.role === 'student').map(({ passwordHash, ...rest }) => rest);
    const payments = (await PaymentEntity.list(c.env)).items;
    const guestPayments = (await GuestPaymentEntity.list(c.env)).items;
    return ok(c, { students, payments, guestPayments });
});
app.get('/api/suggestions/all', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allSuggestions = (await SuggestionEntity.list(c.env)).items;
    return ok(c, { suggestions: allSuggestions });
});
app.post('/api/suggestions/:id/reply', async (c) => {
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
app.get('/api/notes', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const allNotes = (await NoteEntity.list(c.env)).items;
    return ok(c, { notes: allNotes });
});
app.post('/api/notes', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = NoteSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const note = await NoteEntity.create(c.env, { id: crypto.randomUUID(), text: validation.data.text, completed: false, createdAt: Date.now() });
    return ok(c, note);
});
app.put('/api/notes/:id', async (c) => {
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
app.delete('/api/notes/:id', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const noteId = c.req.param('id');
    const deleted = await NoteEntity.delete(c.env, noteId);
    if (!deleted) return notFound(c, 'Note not found.');
    return ok(c, { message: 'Note deleted successfully.' });
});
// Manager Settings
app.post('/api/settings/clear-all-data', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const entityClasses = [UserEntity, ComplaintEntity, SuggestionEntity, MenuEntity, PaymentEntity, GuestPaymentEntity, NoteEntity, SettingEntity, NotificationEntity];
    for (const EntityClass of entityClasses) {
        const index = new Index(c.env, EntityClass.indexName);
        const { items: ids } = await index.page(undefined, 1000); // Get all items
        if (ids.length > 0) {
            await EntityClass.deleteMany(c.env, ids); // This also removes from index
        }
    }
    return ok(c, { message: 'All application data has been cleared.' });
});
app.get('/api/settings/fee', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const settingEntity = new SettingEntity(c.env, 'singleton');
    if (!await settingEntity.exists()) {
        await settingEntity.save(SettingEntity.initialState);
    }
    const settings = await settingEntity.getState();
    return ok(c, { monthlyFee: settings.monthlyFee });
});

app.post('/api/settings/fee', async (c) => {
    const user = c.get('user');
    if (!user || user.role !== 'manager') return c.json({ success: false, error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const validation = FeeSchema.safeParse(body);
    if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
    const settingEntity = new SettingEntity(c.env, 'singleton');
    await settingEntity.patch({ monthlyFee: validation.data.monthlyFee });
    return ok(c, { message: 'Monthly fee updated successfully.' });
});
app.post('/api/settings/rules', async (c) => {
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
app.post('/api/broadcast', async (c) => {
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
app.post('/api/payments/mark-as-paid', async (c) => {
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
}