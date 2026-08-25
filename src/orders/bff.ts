import { STATE_SEQUENCE, type FulfilmentState, type OrderStatusView } from "./contract.js";

// Upstream shapes the BFF has to stitch together. In a real service these come
// from the orders service and the shipping service.
export interface OrderRecord {
  id: string;
  placedAt: string;
  packedAt: string | null;
}

export interface ShipmentRecord {
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedDelivery: string | null;
}

export function buildOrderStatusView(order: OrderRecord, shipment: ShipmentRecord): OrderStatusView {
  const timestamps: Record<FulfilmentState, string | null> = {
    placed: order.placedAt,
    packed: order.packedAt,
    shipped: shipment.shippedAt,
    delivered: shipment.deliveredAt,
  };

  const steps = STATE_SEQUENCE.map((state) => ({ state, reachedAt: timestamps[state] }));
  const reached = steps.filter((step) => step.reachedAt !== null);
  const currentState = reached.length > 0 ? reached[reached.length - 1]!.state : "placed";

  return {
    orderId: order.id,
    currentState,
    steps,
    estimatedDelivery: shipment.estimatedDelivery,
  };
}
