import { IndexedEntity } from "./core-utils";
import type { User, Complaint, Suggestion, WeeklyMenu, Payment, GuestPayment, Note, Setting, Notification } from "@shared/types";
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", phone: "", passwordHash: "", role: "student", status: "pending" };
}
// COMPLAINT ENTITY
export class ComplaintEntity extends IndexedEntity<Complaint> {
  static readonly entityName = "complaint";
  static readonly indexName = "complaints";
  static readonly initialState: Complaint = { id: "", studentId: "", studentName: "", text: "", createdAt: 0 };
}
// SUGGESTION ENTITY
export class SuggestionEntity extends IndexedEntity<Suggestion> {
  static readonly entityName = "suggestion";
  static readonly indexName = "suggestions";
  static readonly initialState: Suggestion = { id: "", studentId: "", studentName: "", text: "", createdAt: 0 };
}
// MENU ENTITY (Singleton)
export class MenuEntity extends IndexedEntity<WeeklyMenu> {
    static readonly entityName = "menu";
    static readonly indexName = "menus";
    static readonly initialState: WeeklyMenu = {
        id: 'singleton',
        days: [
            { day: 'Monday', breakfast: '', lunch: '', dinner: '' },
            { day: 'Tuesday', breakfast: '', lunch: '', dinner: '' },
            { day: 'Wednesday', breakfast: '', lunch: '', dinner: '' },
            { day: 'Thursday', breakfast: '', lunch: '', dinner: '' },
            { day: 'Friday', breakfast: '', lunch: '', dinner: '' },
            { day: 'Saturday', breakfast: '', lunch: '', dinner: '' },
            { day: 'Sunday', breakfast: '', lunch: '', dinner: '' },
        ]
    };
}
// PAYMENT ENTITY
export class PaymentEntity extends IndexedEntity<Payment> {
    static readonly entityName = "payment";
    static readonly indexName = "payments";
    static readonly initialState: Payment = { id: "", userId: "", userName: "", amount: 0, month: "", status: "due", method: "razorpay", createdAt: 0 };
}
// GUEST PAYMENT ENTITY
export class GuestPaymentEntity extends IndexedEntity<GuestPayment> {
    static readonly entityName = "guestPayment";
    static readonly indexName = "guestPayments";
    static readonly initialState: GuestPayment = { id: "", name: "", phone: "", amount: 0, createdAt: 0 };
}
// NOTE ENTITY
export class NoteEntity extends IndexedEntity<Note> {
    static readonly entityName = "note";
    static readonly indexName = "notes";
    static readonly initialState: Note = { id: "", text: "", completed: false, createdAt: 0 };
}
// SETTING ENTITY (Singleton)
export class SettingEntity extends IndexedEntity<Setting> {
    static readonly entityName = "setting";
    static readonly indexName = "settings";
    static readonly initialState: Setting = { id: 'singleton', monthlyFee: 3000, messRules: "" };
}
// NOTIFICATION ENTITY
export class NotificationEntity extends IndexedEntity<Notification> {
    static readonly entityName = "notification";
    static readonly indexName = "notifications";
    static readonly initialState: Notification = { id: "", userId: "", message: "", createdAt: 0 };
}