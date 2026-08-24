export type Channel = "email" | "slack";

export interface Notification {
  channel: Channel;
  to: string;
  subject: string;
  body: string;
}

export interface DeliveryResult {
  channel: Channel;
  to: string;
  delivered: boolean;
  error?: string;
}
