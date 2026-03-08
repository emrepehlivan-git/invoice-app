/**
 * Typed shapes for Paddle webhook event payloads (eventData.data).
 * Used in app/api/webhooks/paddle/route.ts for type-safe handling.
 */

export interface PaddleTransactionDetailsTotals {
  total?: string;
  grand_total?: string;
}

export interface PaddleTransactionCompletedData {
  id: string;
  customerId?: string | null;
  customer_id?: string | null;
  details?: {
    totals?: PaddleTransactionDetailsTotals;
  };
  customData?: Record<string, unknown>;
  custom_data?: Record<string, unknown>;
}

export interface PaddleTransactionPaymentFailedData {
  id: string;
  customData?: Record<string, unknown>;
}

export interface PaddleTransactionUpdatedData {
  id: string;
  status?: string;
}

export function isPaddleTransactionCompletedData(
  data: unknown
): data is PaddleTransactionCompletedData {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    typeof (data as PaddleTransactionCompletedData).id === "string"
  );
}

export function isPaddleTransactionPaymentFailedData(
  data: unknown
): data is PaddleTransactionPaymentFailedData {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    typeof (data as PaddleTransactionPaymentFailedData).id === "string"
  );
}

export function isPaddleTransactionUpdatedData(
  data: unknown
): data is PaddleTransactionUpdatedData {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    typeof (data as PaddleTransactionUpdatedData).id === "string"
  );
}
