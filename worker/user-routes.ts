import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ComplaintEntity, MenuEntity, GuestPaymentEntity, PaymentEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import { z } from 'zod';
import type { User, WeeklyMenu, Complaint } from "@shared/types";
type HonoVariables = {
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
const ComplaintSchema = z.object({
    text: z.string().min(10, "Complaint must be at least 10 characters."),
    imageUrl: z.string().url().optional(),
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
const getUser = async (c: Hono.Context<{ Bindings: Env, Variables: HonoVariables }>, next: Hono.Next) => {
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
    app.post('/api/guest-payment', async (c) => {
        const body = await c.req.json();
        const validation = GuestPaymentSchema.safeParse(body);
        if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
        const { name, phone, amount } = validation.data;
        const payment = await GuestPaymentEntity.create(c.env, { id: crypto.randomUUID(), name, phone, amount, createdAt: Date.now() });
        return ok(c, payment);
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
        const body = await c.req.json();
        const validation = ComplaintSchema.safeParse(body);
        if (!validation.success) return bad(c, validation.error.issues.map(e => e.message).join(', '));
        const { text, imageUrl } = validation.data;
        const complaint = await ComplaintEntity.create(c.env, { id: crypto.randomUUID(), studentId: user.id, studentName: user.name, text, imageUrl, createdAt: Date.now() });
        return ok(c, complaint);
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
        const students = allUsers.filter(u => u.role === 'student');
        const totalStudents = students.filter(s => s.status === 'approved').length;
        const pendingApprovals = students.filter(s => s.status === 'pending').length;
        const monthlyRevenue = allGuestPayments.reduce((sum, payment) => sum + payment.amount, 0);
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
}