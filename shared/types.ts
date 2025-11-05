export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type UserRole = 'student' | 'manager' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export interface User {
  id: string; // email
  name: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
}
export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  text: string;
  imageBase64?: string;
  reply?: string;
  createdAt: number;
}
export interface Suggestion {
  id: string;
  studentId: string;
  studentName: string;
  text: string;
  reply?: string;
  createdAt: number;
}
export interface WeeklyMenu {
  id: 'singleton'; // Only one menu
  days: {
    day: string;
    breakfast: string;
    lunch: string;
    dinner: string;
  }[];
}
export interface Payment {
  id: string;
  userId: string; // Can be student or guest
  userName: string;
  amount: number;
  month: string; // e.g., "YYYY-MM"
  status: 'paid' | 'due';
  method: 'razorpay' | 'cash' | 'guest_payment';
  createdAt: number;
}
export interface GuestPayment {
    id: string;
    name: string;
    phone: string;
    amount: number;
    createdAt: number;
}
export interface Note {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}
export interface Setting {
    id: 'singleton';
    monthlyFee: number;
    messRules?: string;
}
export interface Notification {
    id: string;
    userId: string; // The student this is for
    message: string;
    createdAt: number;
}