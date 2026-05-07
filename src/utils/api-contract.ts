export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

type JsonRecord = Record<string, unknown>;

const allowedStatuses = ['created', 'paid', 'fulfilled'];

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function validateOrderContract(payload: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(payload)) {
    return { valid: false, errors: ['payload must be an object'] };
  }

  if (typeof payload.orderId !== 'string' || payload.orderId.trim().length === 0) {
    errors.push('orderId must be a non-empty string');
  }

  if (
    typeof payload.customerEmail !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.customerEmail)
  ) {
    errors.push('customerEmail must be a valid email address');
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('items must be a non-empty array');
  } else {
    payload.items.forEach((item, index) => {
      if (!isRecord(item)) {
        errors.push(`items[${index}] must be an object`);
        return;
      }

      if (typeof item.sku !== 'string' || item.sku.trim().length === 0) {
        errors.push(`items[${index}].sku must be a non-empty string`);
      }

      if (!Number.isInteger(item.quantity) || Number(item.quantity) <= 0) {
        errors.push(`items[${index}].quantity must be a positive integer`);
      }

      if (!isPositiveNumber(item.price)) {
        errors.push(`items[${index}].price must be a positive number`);
      }
    });
  }

  if (!isPositiveNumber(payload.total)) {
    errors.push('total must be a positive number');
  }

  if (payload.currency !== 'USD') {
    errors.push('currency must be USD');
  }

  if (typeof payload.status !== 'string' || !allowedStatuses.includes(payload.status)) {
    errors.push(`status must be one of: ${allowedStatuses.join(', ')}`);
  }

  if (
    payload.responseTimeMs !== undefined &&
    (!Number.isFinite(payload.responseTimeMs) || Number(payload.responseTimeMs) < 0)
  ) {
    errors.push('responseTimeMs must be a non-negative number when present');
  }

  return { valid: errors.length === 0, errors };
}

export function isWithinLatencyBudget(responseTimeMs: number, budgetMs: number): boolean {
  return Number.isFinite(responseTimeMs) && responseTimeMs >= 0 && responseTimeMs <= budgetMs;
}
