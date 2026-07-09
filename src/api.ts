const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    options.credentials = 'include';

    // Remove Content-Type if we're uploading a file (FormData)
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Token is expired or invalid. In a real app we might redirect to /login
      window.location.href = '/login';
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  }

  get(endpoint: string) {
    return this.fetch(endpoint);
  }

  post(endpoint: string, body: any) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch(endpoint: string, body: any) {
    return this.fetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }
}

export const api = new ApiClient();
