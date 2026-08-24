import { RESPONSE_HOURS, type Priority } from "./config.js";

export function responseDeadline(priority: Priority, from: Date): Date {
  const deadline = new Date(from);
  deadline.setHours(deadline.getHours() + RESPONSE_HOURS[priority]);
  return deadline;
}

export function isBreached(priority: Priority, openedAt: Date, now: Date): boolean {
  return now > responseDeadline(priority, openedAt);
}
