// src/api/clients.js
import { API_BASE_URL, apiRequest } from './config';

export async function fetchClients(filters = {}) {
  const params = new URLSearchParams();

  if (filters.client_id) params.append("client_id", filters.client_id);
  if (filters.name) params.append("name", filters.name);
  if (filters.profession) params.append("profession", filters.profession);
  if (filters.segment) params.append("segment", filters.segment);

  return apiRequest(`${API_BASE_URL}/clients/?${params.toString()}`);
}
