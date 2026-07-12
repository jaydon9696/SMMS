import type { ApiEnvelope, ApiErrorEnvelope } from "@/types/domain";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorEnvelope;
    throw new ApiError(
      body.error?.message ?? "Something went wrong. Please try again.",
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as ApiEnvelope<T>;
  return body.data;
}

export function formatCurrency(value: string | number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export async function uploadMenuImage(
  file: File,
): Promise<{ url: string; public_id: string }> {
  const body = new FormData();
  body.set("image", file);
  const response = await fetch("/api/backend/menu/images", {
    method: "POST",
    body,
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorEnvelope;
    throw new ApiError(
      payload.error?.message ?? "Unable to upload image",
      response.status,
    );
  }
  const payload = (await response.json()) as ApiEnvelope<{
    url: string;
    public_id: string;
  }>;
  return payload.data;
}
