import { createTicket, getTicket, listTickets, setStatus } from "./store.js";
import type { NewTicket, TicketStatus } from "./types.js";

export interface Request {
  method: string;
  path: string;
  body?: unknown;
}

export interface Response {
  status: number;
  body: unknown;
}

export function handle(req: Request): Response {
  if (req.method === "GET" && req.path === "/tickets") {
    return { status: 200, body: listTickets() };
  }

  if (req.method === "POST" && req.path === "/tickets") {
    const input = req.body as NewTicket;
    if (!input?.title) return { status: 400, body: { error: "title is required" } };
    return { status: 201, body: createTicket(input) };
  }

  const match = /^\/tickets\/([^/]+)$/.exec(req.path);
  if (match) {
    const id = match[1]!;
    if (req.method === "GET") {
      const ticket = getTicket(id);
      return ticket ? { status: 200, body: ticket } : { status: 404, body: { error: "not found" } };
    }
    if (req.method === "PATCH") {
      const { status } = req.body as { status: TicketStatus };
      const ticket = setStatus(id, status);
      return ticket ? { status: 200, body: ticket } : { status: 404, body: { error: "not found" } };
    }
  }

  return { status: 404, body: { error: "no route" } };
}
