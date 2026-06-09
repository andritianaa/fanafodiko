import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://fanafodiko-bck.andritiana.tech";

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem("auth_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  timeout = 10000,
): Promise<T> {
  const baseUrl = API_URL;
  const authHeaders = await getAuthHeader();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const url = `${baseUrl}${path}`;
  console.log(`[api] ${options.method ?? 'GET'} ${url}`);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...authHeaders,
        ...((options.headers as Record<string, string>) ?? {}),
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      let errBody: { message?: string; code?: string } = {};
      try {
        errBody = await res.json();
      } catch {}
      // 4xx = erreur client (souvent attendue, ex. 404 queue replay) → warn
      // 5xx = erreur serveur inattendue → error
      const logFn = res.status >= 500 ? console.error : console.warn;
      logFn(`[api] ${res.status} ${url} →`, errBody);
      throw new ApiError(
        res.status,
        errBody.code ?? "UNKNOWN",
        errBody.message ?? `HTTP ${res.status}`,
      );
    }

    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === "AbortError") {
      console.error(`[api] TIMEOUT ${url}`);
      throw new ApiError(0, "TIMEOUT", "Request timeout");
    }
    if (!(err instanceof ApiError)) {
      console.error(`[api] NETWORK ERROR ${url}:`, (err as Error).message);
    }
    throw err;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string }>("/auth/login", { email, password }),
  register: (data: {
    email: string;
    password: string;
    fullName: string;
  }) =>
    api.post<{ id: string; email: string; message: string }>(
      "/auth/register",
      data,
    ),
  logout: () => api.post("/auth/logout"),
  me: () => api.get<{ id: string; email: string }>("/auth/me"),
  registerPushToken: (token: string) =>
    api.post<{ message: string }>("/auth/push-token", { token }),
  removePushToken: (token: string) =>
    request<{ message: string }>("/auth/push-token", {
      method: "DELETE",
      body: JSON.stringify({ token }),
    }),
};

type HouseholdRaw = { id: string; fullName: string; relationship: string; avatarUrl?: string | null; dateOfBirth?: string };

function mapHousehold(p: HouseholdRaw): import("../types").Profile {
  const parts = p.fullName.trim().split(/\s+/);
  return {
    id: p.id,
    firstName: parts[0] ?? p.fullName,
    lastName: parts.slice(1).join(' '),
    dateOfBirth: p.dateOfBirth ?? '',
    relationship: p.relationship,
    avatarUrl: p.avatarUrl ?? null,
  };
}

export const householdsApi = {
  list: async (): Promise<import("../types").Profile[]> => {
    const raw = await api.get<HouseholdRaw[]>("/household");
    return raw.map(mapHousehold);
  },
  get: async (id: string): Promise<import("../types").Profile> => {
    const raw = await api.get<HouseholdRaw>(`/household/${id}`);
    return mapHousehold(raw);
  },
  create: (data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    relationship: string;
    avatarUrl?: string;
  }) => api.post<import("../types").Profile>("/household", data),
  update: (id: string, data: Partial<import("../types").Profile>) =>
    api.patch<import("../types").Profile>(`/household/${id}`, data),
  remove: (id: string) => api.delete(`/household/${id}`),
};

export const medicationsApi = {
  listByProfile: (profileId: string) =>
    api.get<import("../types").Medication[]>(
      `/medications/profile/${profileId}`,
    ),
  get: (id: string) =>
    api.get<import("../types").Medication>(`/medications/${id}`),
  create: (data: {
    profileId: string;
    name: string;
    dosage: string;
    frequency: import("../types").Frequency;
    startDate: string;
    endDate?: string;
  }) => api.post<import("../types").Medication>("/medications", data),
  update: (id: string, data: Partial<import("../types").Medication>) =>
    api.put<import("../types").Medication>(`/medications/${id}`, data),
  remove: (id: string) => api.delete(`/medications/${id}`),
  toggleStatus: (id: string, isActive: boolean) =>
    api.patch<import("../types").Medication>(`/medications/${id}/status`, {
      isActive,
    }),
};

export const tasksApi = {
  list: (profileId: string, date?: string) =>
    api.get<import("../types").Task[]>(
      `/notifications/tasks?profileId=${profileId}${date ? `&date=${date}` : ""}`,
    ),
  stats: (profileId: string, date?: string) =>
    api.get<import("../types").DailyStats>(
      `/notifications/tasks/stats/${profileId}${date ? `?date=${date}` : ""}`,
    ),
  markTaken: (id: string) => api.patch(`/notifications/tasks/${id}/take`),
  markSkipped: (id: string) => api.patch(`/notifications/tasks/${id}/skip`),
};

export const pharmacyApi = {
  list: (filter?: 'open' | 'guard' | '24h') =>
    api.get<{ pharmacies: import("../types").Pharmacy[]; total: number }>(
      `/pharmacies${filter ? `?filter=${filter}` : ""}`,
    ),
  get: (id: string) =>
    api.get<import("../types").Pharmacy>(`/pharmacies/${id}`),
};

export const medSearchApi = {
  create: (data: {
    medicationName: string;
    coordinates: { lat: number; lng: number };
    radiusKm: number;
    note?: string;
  }) =>
    api.post<{ id: string; nearbyCount: number; expiresAt: string }>(
      "/med-searches",
      data,
    ),
  get: (id: string) =>
    api.get<import("../types").MedSearch>(`/med-searches/${id}`),
  myHistory: () =>
    api.get<{ history: import("../types").MedSearchHistoryItem[] }>(
      "/med-searches/my",
    ),
  pharmacyPending: (pharmacyId: string) =>
    api.get<import("../types").PendingSearch[]>(
      `/med-searches/pharmacy/${pharmacyId}/pending`,
    ),
  respond: (
    searchId: string,
    pharmacyId: string,
    data: { hasStock: boolean; note?: string },
  ) => api.post(`/med-searches/${searchId}/respond/${pharmacyId}`, data),
};

export const bugReportApi = {
  create: (data: {
    description: string;
    screenshots: string[];
    deviceInfo: {
      platform: 'ios' | 'android' | 'web';
      osVersion?: string;
      screenSize?: string;
      language?: string;
    };
  }) => api.post<{ id: string }>('/bug-reports', data),
};

export const myPharmacyApi = {
  list: () =>
    api.get<import("../types").Pharmacy[]>("/my/pharmacies"),
  get: (id: string) =>
    api.get<import("../types").Pharmacy>(`/my/pharmacies/${id}`),
  members: (id: string) =>
    api.get<Array<{ userId: string; email: string; role: string }>>(
      `/my/pharmacies/${id}/members`,
    ),
  pendingRequests: (id: string) =>
    api.get<Array<{ id: string; userId: string; email: string; createdAt: string }>>(
      `/my/pharmacies/${id}/requests`,
    ),
};

export const pharmacyRequestApi = {
  create: (data: {
    name: string;
    address: string;
    landmark?: string;
    coordinates: { lat: number; lng: number };
    contacts: { type: string; value: string }[];
    city: string;
    region?: string;
    isOpen24h: boolean;
    openingHours: { day: number; open?: string; close?: string; isClosed: boolean }[];
    wantsToManage: boolean;
    proofImages: string[];
  }) => api.post<{ id: string }>('/pharmacy-requests', data),
};

export const pharmacyClaimApi = {
  create: (data: {
    pharmacyId: string;
    contactInfo: string;
    proofImages: string[];
  }) => api.post<{ id: string }>('/pharmacy-claims', data),
};

export const preferencesApi = {
  get: () =>
    api.get<import("../types").NotificationPreferences>("/auth/preferences"),
  update: (prefs: Partial<import("../types").NotificationPreferences>) =>
    api.patch<import("../types").NotificationPreferences>(
      "/auth/preferences",
      prefs,
    ),
};
