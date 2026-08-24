import { describe, expect, it } from "vitest";
import { renderOrderStatusTracker } from "./OrderStatusTracker.js";
import type { OrderStatusView } from "../../orders/contract.js";

const view: OrderStatusView = {
  orderId: "A-1",
  currentState: "shipped",
  steps: [
    { state: "placed", reachedAt: "2026-01-01T10:00:00Z" },
    { state: "packed", reachedAt: "2026-01-01T12:00:00Z" },
    { state: "shipped", reachedAt: "2026-01-02T09:00:00Z" },
    { state: "delivered", reachedAt: null },
  ],
  estimatedDelivery: "2026-01-04",
};

describe("renderOrderStatusTracker", () => {
  it("marks reached steps as filled and unreached as hollow", () => {
    const output = renderOrderStatusTracker(view);
    expect(output).toContain("● SHIPPED");
    expect(output).toContain("○ DELIVERED — pending");
  });

  it("shows the estimated delivery when the BFF provides one", () => {
    expect(renderOrderStatusTracker(view)).toContain("Estimated delivery: 2026-01-04");
  });

  it("degrades gracefully when there is no estimate", () => {
    const output = renderOrderStatusTracker({ ...view, estimatedDelivery: null });
    expect(output).toContain("not available yet");
  });
});
