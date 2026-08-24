export type TicketStatus = "open" | "in_progress" | "closed";

export interface Ticket {
  id: string;
  title: string;
  status: TicketStatus;
  createdAt: string;
}

export interface NewTicket {
  title: string;
}
