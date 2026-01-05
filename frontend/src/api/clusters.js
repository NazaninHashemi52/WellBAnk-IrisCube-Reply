// src/api/clusters.js
import { API_BASE_URL, apiRequest } from './config';

export async function getBatchRuns() {
  return apiRequest(`${API_BASE_URL}/clusters/runs`);
}

export async function getClusterSummary(runId) {
  return apiRequest(`${API_BASE_URL}/clusters/${runId}/summary`);
}

export async function getClusterCustomers(runId, clusterId = null, limit = 100) {
  const params = new URLSearchParams();
  if (clusterId !== null) {
    params.append('cluster_id', clusterId.toString());
  }
  params.append('limit', limit.toString());
  
  return apiRequest(`${API_BASE_URL}/clusters/${runId}/customers?${params.toString()}`);
}

export async function getClusterRecommendations(runId, page = 1, pageSize = 20) {
  const params = new URLSearchParams();
  params.append('limit', pageSize.toString());
  params.append('offset', ((page - 1) * pageSize).toString());
  
  return apiRequest(`${API_BASE_URL}/clusters/${runId}/recommendations?${params.toString()}`);
}

export async function getClusterComparison(runId) {
  try {
    return await apiRequest(`${API_BASE_URL}/clusters/${runId}/comparison`);
  } catch (error) {
    // Comparison is optional, return null if it fails
    return null;
  }
}

