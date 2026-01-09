// Debug API endpoints
import { API_BASE_URL, apiRequest } from './config';

export async function getDbInfo() {
  return apiRequest(`${API_BASE_URL}/debug/db-info`);
}
