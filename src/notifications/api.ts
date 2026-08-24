import { dispatch } from "./dispatcher.js";
import type { Notification } from "./types.js";

export interface SendRequest {
  notifications: Notification[];
}

export function sendBatch(req: SendRequest) {
  const results = req.notifications.map(dispatch);
  return {
    status: results.every((r) => r.delivered) ? 200 : 207,
    body: { results },
  };
}
