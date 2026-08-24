import type { NewTicket, Ticket, TicketStatus } from "./types.js";

const tickets = new Map<string, Ticket>();
let nextId = 1;

export function createTicket(input: NewTicket): Ticket {
  const ticket: Ticket = {
    id: String(nextId++),
    title: input.title,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  tickets.set(ticket.id, ticket);
  return ticket;
}

export function getTicket(id: string): Ticket | undefined {
  return tickets.get(id);
}

export function listTickets(): Ticket[] {
  return [...tickets.values()];
}

export function setStatus(id: string, status: TicketStatus): Ticket | undefined {
  const ticket = tickets.get(id);
  if (!ticket) return undefined;
  ticket.status = status;
  return ticket;
}
