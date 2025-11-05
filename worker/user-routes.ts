import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
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
                passwordHash: 'password', // In a real app, this would be a strong hash
                role: 'admin',
                status: 'approved',
            });
        }
        if (!await managerUser.exists()) {
            await UserEntity.create(c.env, {
                id: managerEmail,
                name: 'Manager',
                phone: '1111111111',
                passwordHash: 'password', // In a real app, this would be a strong hash
                role: 'manager',
                status: 'approved',
            });
        }
        await next();
    });
    app.post('/api/register', async (c) => {
        const body = await c.req.json();
        const validation = RegisterSchema.safeParse(body);
        if (!validation.success) {
            return bad(c, validation.error.errors.map(e => e.message).join(', '));
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
            passwordHash: password, // Plain text for now, should be hashed
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
        // In a real app, you'd return a JWT here
        return ok(c, { ...userResponse, token: `fake-token-for-${user.id}` });
    });
}