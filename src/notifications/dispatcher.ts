import type { DeliveryResult, Notification } from "./types.js";

type Transport = (n: Notification) => void;

const transports: Record<string, Transport> = {
  email: () => {},
  slack: () => {},
};

export interface DispatchOptions {
  /** How many times to retry a failing transport before giving up. */
  retries?: number;
}

export function dispatch(n: Notification, options: DispatchOptions = {}): DeliveryResult {
  const transport = transports[n.channel];
  if (!transport) {
    return { channel: n.channel, to: n.to, delivered: false, error: "unknown channel" };
  }

  const attempts = (options.retries ?? 0) + 1;
  let lastError = "";

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      transport(n);
      return { channel: n.channel, to: n.to, delivered: true };
    } catch (err) {
      lastError = String(err);
    }
  }

  return { channel: n.channel, to: n.to, delivered: false, error: lastError };
}
