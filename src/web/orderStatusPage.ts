import { buildOrderStatusView, type OrderRecord, type ShipmentRecord } from "../orders/bff.js";
import { renderOrderStatusTracker } from "./components/OrderStatusTracker.js";

// The final layer: wires the BFF aggregation to the component so the PBI is
// actually shippable. Nothing new is invented here — it only connects layers below.
export function orderStatusPage(order: OrderRecord, shipment: ShipmentRecord): string {
  return renderOrderStatusTracker(buildOrderStatusView(order, shipment));
}
