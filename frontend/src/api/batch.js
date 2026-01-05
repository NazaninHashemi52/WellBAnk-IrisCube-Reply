// src/api/batch.js
import { API_BASE_URL, apiRequest } from './config';

export async function runBatchProcessing(useCategoryClustering = true) {
  const params = new URLSearchParams();
  params.append('use_category_clustering', useCategoryClustering.toString());
  
  return apiRequest(`${API_BASE_URL}/batch/run?${params.toString()}`, {
    method: 'POST',
  });
}

export async function getLastBatchRun() {
  return apiRequest(`${API_BASE_URL}/batch/last-run`);
}

export async function testBatchEndpoint() {
  return apiRequest(`${API_BASE_URL}/batch/test`);
}

