const API_BASE_URL = 'http://localhost:3001';

export async function apiClient(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}
