// Shared contract between the BFF and the web client.
// Lives in its own PR so both consumers below can be reviewed against a frozen shape.

export type FulfilmentState = "placed" | "packed" | "shipped" | "delivered";

export interface OrderStatusStep {
  state: FulfilmentState;
  reachedAt: string | null;
}

export interface OrderStatusView {
  orderId: string;
  currentState: FulfilmentState;
  steps: OrderStatusStep[];
  estimatedDelivery: string | null;
}

export const STATE_SEQUENCE: FulfilmentState[] = ["placed", "packed", "shipped", "delivered"];
