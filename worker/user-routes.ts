import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ComplaintEntity, MenuEntity, GuestPaymentEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import { z } from 'zod';
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
const GuestPaymentSchema = z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    amount: z.number().positive(),
});
// A simple middleware to get user from a fake token
const getUser = async (c: any, next: any) => {
    // In a real app, you'd verify a JWT. Here we simulate it.
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer fake-token-for-')) {
        const email = authHeader.substring('Bearer fake-token-for-'.length);
        const userEntity = new UserEntity(c.env, email);
        if (await userEntity.exists()) {
            c.set('user', await userEntity.getState());
            return next();
        }
    }
    // For simplicity in this phase, we'll allow some routes to proceed
    // without a user, but a real app would return a 401 here.
    return next();
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // Ensure admin and manager exist
    app.use('/api/*', async (c, next) => {
        const adminEmail = 'admin@messconnect.com';
        const managerEmail = 'manager@messconnect.com';
        const adminUser = new UserEntity(c.env, adminEmail);
        const managerUser = new UserEntity(c.env, managerEmail);
        if (!await adminUser.exists()) {
            await UserEntity.create(c.env, {
                id: adminEmail,
                name: 'Admin',
                phone: '0000000000',
                passwordHash: 'password',
                role: 'admin',
                status: 'approved',
            });
        }
        if (!await managerUser.exists()) {
            await UserEntity.create(c.env, {
                id: managerEmail,
                name: 'Manager',
                phone: '1111111111',
                passwordHash: 'password',
                role: 'manager',
                status: 'approved',
            });
        }
        await next();
    });
    // PUBLIC ROUTES
    app.post('/api/register', async (c) => {
        const body = await c.req.json();
        const validation = RegisterSchema.safeParse(body);
        if (!validation.success) {
            return bad(c, validation.error.issues.map(e => e.message).join(', '));
        }
        const { name, email, phone, password } = validation.data;
        const existingUser = new UserEntity(c.env, email);
        if (await existingUser.exists()) {
            return bad(c, 'User with this email already exists.');
        }
        const newUser = await UserEntity.create(c.env, {
            id: email,
            name,
            phone,
            passwordHash: password,
            role: 'student',
            status: 'pending',
        });
        const { passwordHash, ...userResponse } = newUser;
        return ok(c, userResponse);
    });
    app.post('/api/login', async (c) => {
        const body = await c.req.json();
        const validation = LoginSchema.safeParse(body);
        if (!validation.success) {
            return bad(c, 'Invalid email or password format.');
        }
        const { email, password } = validation.data;
        const userEntity = new UserEntity(c.env, email);
        if (!await userEntity.exists()) {
            return notFound(c, 'User not found.');
        }
        const user = await userEntity.getState();
        if (user.passwordHash !== password) {
            return bad(c, 'Invalid credentials.');
        }
        if (user.role === 'student' && user.status !== 'approved') {
            return c.json({ success: true, data: { status: user.status } }, 200);
        }
        const { passwordHash, ...userResponse } = user;
        return ok(c, { ...userResponse, token: `fake-token-for-${user.id}` });
    });
    app.post('/api/guest-payment', async (c) => {
        const body = await c.req.json();
        const validation = GuestPaymentSchema.safeParse(body);
        if (!validation.success) {
            return bad(c, validation.error.issues.map(e => e.message).join(', '));
        }
        const { name, phone, amount } = validation.data;
        const payment = await GuestPaymentEntity.create(c.env, {
            id: crypto.randomUUID(),
            name,
            phone,
            amount,
            createdAt: Date.now(),
        });
        return ok(c, payment);
    });
    // PROTECTED ROUTES (STUDENT)
    app.use('/api/*', getUser);
    app.get('/api/menu', async (c) => {
        const menuEntity = new MenuEntity(c.env, 'singleton');
        if (!await menuEntity.exists()) {
            // If menu doesn't exist, create it with initial empty state
            await menuEntity.save(MenuEntity.initialState);
        }
        const menu = await menuEntity.getState();
        return ok(c, menu);
    });
    app.post('/api/complaints', async (c) => {
        const user = c.get('user');
        if (!user || user.role !== 'student') {
            return bad(c, 'Unauthorized', 401);
        }
        const body = await c.req.json();
        const validation = ComplaintSchema.safeParse(body);
        if (!validation.success) {
            return bad(c, validation.error.issues.map(e => e.message).join(', '));
        }
        const { text, imageUrl } = validation.data;
        const complaint = await ComplaintEntity.create(c.env, {
            id: crypto.randomUUID(),
            studentId: user.id,
            studentName: user.name,
            text,
            imageUrl,
            createdAt: Date.now(),
        });
        return ok(c, complaint);
    });
}