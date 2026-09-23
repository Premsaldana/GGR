import { getDatabaseProvider } from './runtime';
import * as sqliteSchema from './schema-sqlite';
import * as postgresSchema from './schema-pg';

const selected = getDatabaseProvider() === 'postgres' ? postgresSchema : sqliteSchema;

export const users = selected.users as typeof sqliteSchema.users;
export const guests = selected.guests as typeof sqliteSchema.guests;
export const units = selected.units as typeof sqliteSchema.units;
export const roomPrices = selected.roomPrices as typeof sqliteSchema.roomPrices;
export const roomAvailability = selected.roomAvailability as typeof sqliteSchema.roomAvailability;
export const reservations = selected.reservations as typeof sqliteSchema.reservations;
export const reservationLineItems = selected.reservationLineItems as typeof sqliteSchema.reservationLineItems;
export const invoices = selected.invoices as typeof sqliteSchema.invoices;
export const invoicePayments = selected.invoicePayments as typeof sqliteSchema.invoicePayments;
export const qrPaymentArtifacts = selected.qrPaymentArtifacts as typeof sqliteSchema.qrPaymentArtifacts;
export const shareLinks = selected.shareLinks as typeof sqliteSchema.shareLinks;
export const auditEvents = selected.auditEvents as typeof sqliteSchema.auditEvents;
export const authChallenges = selected.authChallenges as typeof sqliteSchema.authChallenges;
export const paymentProofs = selected.paymentProofs as typeof sqliteSchema.paymentProofs;
export const pushSubscriptions = selected.pushSubscriptions as typeof sqliteSchema.pushSubscriptions;

export const schema = selected;
