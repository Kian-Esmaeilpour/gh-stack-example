import type { DeliveryResult, Notification } from "./types.js";

type Transport = (n: Notification) => void;

const transports: Record<string, Transport> = {
  email: () => {},
  slack: () => {},
};

export function dispatch(n: Notification): DeliveryResult {
  const transport = transports[n.channel];
  if (!transport) {
    return { channel: n.channel, to: n.to, delivered: false, error: "unknown channel" };
  }

  try {
    transport(n);
    return { channel: n.channel, to: n.to, delivered: true };
  } catch (err) {
    return { channel: n.channel, to: n.to, delivered: false, error: String(err) };
  }
}
