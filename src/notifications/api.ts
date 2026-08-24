import { dispatch } from "./dispatcher.js";
import type { Notification } from "./types.js";

export interface SendRequest {
  notifications: Notification[];
  /** Retries are handled by the dispatcher layer below. */
  retries?: number;
}

export function sendBatch(req: SendRequest) {
  const results = req.notifications.map((n) => dispatch(n, { retries: req.retries }));
  return {
    status: results.every((r) => r.delivered) ? 200 : 207,
    body: { results },
  };
}
