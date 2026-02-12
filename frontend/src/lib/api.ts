import { z } from 'zod';

import type { ApiErrorShape, BackupRecord, Item, Priority, Section } from './types';

export class ApiError extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor(status: number, payload: ApiErrorShape) {
    super(payload.message);
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let payload: ApiErrorShape = {
      code: 'UNKNOWN_ERROR',
      message: 'Request failed. Please try again.',
    };

    try {
      const json = await response.json();
      const parsed = apiErrorSchema.safeParse(json);
      if (parsed.success) {
        payload = parsed.data;
      }
    } catch {
      // ignored
    }

    throw new ApiError(response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

const toQuery = (params: Record<string, string | number | boolean | undefined>): string => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return;
    }

    search.append(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : '';
};

export const api = {
  getSession: async (): Promise<{ authenticated: boolean; trusted: boolean; expiresAt: string }> => {
    return request('/api/auth/me');
  },

  login: async (payload: { pin: string; trusted: boolean }) => {
    return request<{ authenticated: boolean; trusted: boolean; expiresAt: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  logout: async () => {
    return request<void>('/api/auth/logout', {
      method: 'POST',
    });
  },

  logoutAll: async () => {
    return request<void>('/api/auth/logout-all', {
      method: 'POST',
    });
  },

  listSections: async () => {
    const response = await request<{ data: Section[] }>('/api/sections');
    return response.data;
  },

  createSection: async (payload: { name: string; icon: string; color: string }) => {
    const response = await request<{ data: Section }>('/api/sections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  updateSection: async (id: string, payload: { name: string; icon: string; color: string }) => {
    const response = await request<{ data: Section }>(`/api/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  deleteSection: async (id: string) => {
    return request<void>(`/api/sections/${id}`, {
      method: 'DELETE',
    });
  },

  listItems: async (params: {
    view: string;
    sectionId?: string;
    search?: string;
    checked?: 'all' | 'checked' | 'unchecked';
    priority?: Priority | 'all';
    sort?: 'updated_desc' | 'name_asc' | 'priority' | 'created_desc';
    favoritesOnly?: boolean;
    runningLowOnly?: boolean;
  }) => {
    const query = toQuery({
      view: params.view,
      sectionId: params.sectionId,
      search: params.search,
      checked: params.checked,
      priority: params.priority === 'all' ? undefined : params.priority,
      sort: params.sort,
      favoritesOnly: params.favoritesOnly,
      runningLowOnly: params.runningLowOnly,
    });

    const response = await request<{ data: Item[] }>(`/api/items${query}`);
    return response.data;
  },

  createItem: async (payload: {
    sectionId: string;
    name: string;
    description?: string;
    priority: Priority;
    remindEveryDays: number;
  }) => {
    return request<{ data: Item; restored: boolean }>('/api/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateItem: async (
    id: string,
    payload: {
      sectionId: string;
      name: string;
      description?: string;
      priority: Priority;
      remindEveryDays: number;
    },
  ) => {
    const response = await request<{ data: Item }>(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  deleteItem: async (id: string) => {
    return request<void>(`/api/items/${id}`, { method: 'DELETE' });
  },

  toggleItemChecked: async (id: string, checked?: boolean) => {
    const response = await request<{ data: Item }>(`/api/items/${id}/check`, {
      method: 'PATCH',
      body: JSON.stringify({ checked }),
    });
    return response.data;
  },

  toggleItemFavorite: async (id: string) => {
    const response = await request<{ data: Item }>(`/api/items/${id}/favorite`, {
      method: 'PATCH',
    });
    return response.data;
  },

  toggleItemRunningLow: async (id: string) => {
    const response = await request<{ data: Item }>(`/api/items/${id}/running-low`, {
      method: 'PATCH',
    });
    return response.data;
  },

  listBackups: async () => {
    const response = await request<{ data: BackupRecord[] }>('/api/backups');
    return response.data;
  },

  createBackup: async () => {
    const response = await request<{ data: BackupRecord }>('/api/backups', {
      method: 'POST',
    });
    return response.data;
  },

  restoreBackup: async (id: string, createCurrentBackup: boolean) => {
    const response = await request<{ data: { restoredBackupId: string; createdSafetyBackupId?: string } }>(
      `/api/backups/${id}/restore`,
      {
        method: 'POST',
        body: JSON.stringify({ createCurrentBackup }),
      },
    );
    return response.data;
  },
};
