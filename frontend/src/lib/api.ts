import {
  PublicRestaurantSettings,
  OrderPayload,
  OrderResponse,
  OrderTicketsResponse,
  OrderStatusResponse,
  StaffUser,
  DashboardStats,
  CheckInScanResult,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});
  // Authentication is carried by the HttpOnly session cookie. A readable CSRF
  // cookie is a non-secret anti-forgery token, not an authentication token.
  headers.delete("Authorization");
  if (options.method && !["GET", "HEAD", "OPTIONS"].includes(options.method.toUpperCase())) {
    await fetch(`${API_BASE}/api/v1/auth/csrf/`, { credentials: "include", cache: "no-store" });
    const csrf = document.cookie.split("; ").find((part) => part.startsWith("csrftoken="))?.split("=")[1];
    if (!csrf) throw new Error("امکان تأیید امنیت درخواست وجود ندارد. صفحه را تازه‌سازی کنید.");
    headers.set("X-CSRFToken", decodeURIComponent(csrf));
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = `خطای سرور (${res.status})`;
    let errorBody: unknown;
    try {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        errorBody = data;
        errorDetail =
          data.detail ||
          data.error ||
          data.message ||
          (Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : null) ||
          (typeof data === "object" ? JSON.stringify(data) : text);
      } catch {
        errorDetail = text || errorDetail;
      }
    } catch {
      // Stream could not be read
    }
    const err = new Error(errorDetail);
    (err as any).status = res.status;
    (err as any).body = errorBody;
    throw err;
  }

  return res.json();
}

function buildQuery(params?: Record<string, any>): string {
  if (!params) return "";
  const cleaned: Record<string, string> = {};
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "" && val !== "undefined") {
      cleaned[key] = String(val).trim();
    }
  }
  const q = new URLSearchParams(cleaned).toString();
  return q ? `?${q}` : "";
}

export const api = {
  // Public
  getPublicSettings: () => request<PublicRestaurantSettings>("/api/v1/public/settings/"),

  createOrder: (payload: OrderPayload, idempotencyKey?: string) =>
    request<OrderResponse>("/api/v1/orders/", {
      method: "POST",
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
      body: JSON.stringify(payload),
    }),

  getOrderStatus: (publicId: string, guestToken?: string) =>
    request<OrderStatusResponse>(`/api/v1/orders/${publicId}/status/`, {
      headers: guestToken ? { "X-Guest-Token": guestToken } : {},
    }),

  getOrderTickets: (publicId: string, guestToken?: string) =>
    request<OrderTicketsResponse>(`/api/v1/orders/${publicId}/tickets/`, {
      headers: guestToken ? { "X-Guest-Token": guestToken } : {},
    }),

  // Staff Check-In
  staffCheckIn: (qrToken: string, scannerDeviceId?: string, staffToken?: string) =>
    request<CheckInScanResult>("/api/v1/staff/check-in/", {
      method: "POST",
      headers: staffToken ? { Authorization: `Token ${staffToken}` } : {},
      body: JSON.stringify({ qr_token: qrToken, scanner_device_id: scannerDeviceId || "" }),
    }),

  getStaffCheckInHistory: (staffToken: string) =>
    request<any[]>("/api/v1/staff/check-in/history/", {
      headers: { Authorization: `Token ${staffToken}` },
    }),

  // Admin Auth
  login: (username: string, password: string) =>
    request<{ user: StaffUser }>("/api/v1/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: (token: string) =>
    request<{ message: string }>("/api/v1/auth/logout/", {
      method: "POST",
      headers: { Authorization: `Token ${token}` },
    }),

  getMe: (token: string) =>
    request<StaffUser>("/api/v1/auth/me/", {
      headers: { Authorization: `Token ${token}` },
    }),

  // Admin Operations
  getDashboardStats: (token: string) =>
    request<DashboardStats>("/api/v1/admin/dashboard/", {
      headers: { Authorization: `Token ${token}` },
    }),

  getAdminOrders: (token: string, params?: { status?: string; search?: string; date?: string }) => {
    return request<any[]>(`/api/v1/admin/orders/${buildQuery(params)}`, {
      headers: { Authorization: `Token ${token}` },
    });
  },

  getAdminOrderDetail: (token: string, publicId: string) =>
    request<any>(`/api/v1/admin/orders/${publicId}/`, {
      headers: { Authorization: `Token ${token}` },
    }),

  getAdminTickets: (token: string, params?: { status?: string; search?: string; date?: string }) => {
    return request<any[]>(`/api/v1/admin/tickets/${buildQuery(params)}`, {
      headers: { Authorization: `Token ${token}` },
    });
  },

  cancelAdminTicket: (token: string, ticketId: number) =>
    request<any>(`/api/v1/admin/tickets/${ticketId}/cancel/`, {
      method: "POST",
      headers: { Authorization: `Token ${token}` },
    }),

  getAdminPayments: (token: string, params?: { status?: string; authority?: string }) => {
    return request<any[]>(`/api/v1/admin/payments/${buildQuery(params)}`, {
      headers: { Authorization: `Token ${token}` },
    });
  },

  retryPaymentVerification: (token: string, paymentId: number) =>
    request<any>(`/api/v1/admin/payments/${paymentId}/retry-verification/`, {
      method: "POST",
      headers: { Authorization: `Token ${token}` },
    }),

  getAdminSettings: (token: string) =>
    request<any>("/api/v1/admin/settings/", {
      headers: { Authorization: `Token ${token}` },
    }),

  updateAdminSettings: (token: string, payload: any) =>
    request<any>("/api/v1/admin/settings/", {
      method: "PATCH",
      headers: { Authorization: `Token ${token}` },
      body: JSON.stringify(payload),
    }),

  getAdminStaff: (token: string) =>
    request<StaffUser[]>("/api/v1/admin/staff/", {
      headers: { Authorization: `Token ${token}` },
    }),

  createAdminStaff: (token: string, payload: any) =>
    request<StaffUser>("/api/v1/admin/staff/", {
      method: "POST",
      headers: { Authorization: `Token ${token}` },
      body: JSON.stringify(payload),
    }),

  updateAdminStaff: (token: string, id: number, payload: any) =>
    request<StaffUser>(`/api/v1/admin/staff/${id}/`, {
      method: "PATCH",
      headers: { Authorization: `Token ${token}` },
      body: JSON.stringify(payload),
    }),
};

