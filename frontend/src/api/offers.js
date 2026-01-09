// src/api/offers.js
import { API_BASE_URL, apiRequest } from './config';

export async function getOfferCatalog() {
  return apiRequest(`${API_BASE_URL}/offers/catalog`);
}

export async function getRealtimeRecommendations(customerId, topN = 3) {
  const params = new URLSearchParams();
  params.append('top_n', topN.toString());
  return apiRequest(`${API_BASE_URL}/offers/recommend/${customerId}?${params.toString()}`);
}

export async function getPendingRecommendations(status = 'pending', limit = 50, offset = 0) {
  const params = new URLSearchParams();
  params.append('status', status);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  return apiRequest(`${API_BASE_URL}/offers/recommendations?${params.toString()}`);
}

export async function getRecommendationById(recommendationId) {
  return apiRequest(`${API_BASE_URL}/recommendations/${recommendationId}`);
}

export async function regenerateMessage(recommendationId, tone = 'friendly') {
  return apiRequest(`${API_BASE_URL}/offers/recommendations/${recommendationId}/regenerate-message`, {
    method: 'POST',
    body: JSON.stringify({ tone }),
  });
}

export async function changeService(recommendationId, productCode) {
  return apiRequest(`${API_BASE_URL}/offers/recommendations/${recommendationId}/change-service`, {
    method: 'POST',
    body: JSON.stringify({ product_code: productCode }),
  });
}

export async function makeDecision(recommendationId, action, message = null, reason = null) {
  const body = { action };
  if (message) body.message = message;
  if (reason) body.reason = reason;
  
  return apiRequest(`${API_BASE_URL}/offers/recommendations/${recommendationId}/decision`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function generateOnDemandRecommendation(customerId, topN = 3) {
  return apiRequest(`${API_BASE_URL}/offers/recommendations/on-demand`, {
    method: 'POST',
    body: JSON.stringify({ customer_id: customerId, top_n: topN }),
  });
}

export async function getProductFitAnalysis(recommendationId) {
  return apiRequest(`${API_BASE_URL}/offers/recommendations/${recommendationId}/product-fit`);
}

export async function getAIProfileSummary(recommendationId) {
  return apiRequest(`${API_BASE_URL}/offers/recommendations/${recommendationId}/ai-profile`);
}

export async function updateServiceName(recommendationId, serviceName) {
  return apiRequest(`${API_BASE_URL}/offers/recommendations/${recommendationId}/service-name`, {
    method: 'PUT',
    body: JSON.stringify({ service_name: serviceName }),
  });
}

export async function getAdvisorStrategy(customerId) {
  return apiRequest(`${API_BASE_URL}/advisor/strategy/${customerId}`);
}

export async function getCustomerIntelligence(customerId) {
  return apiRequest(`${API_BASE_URL}/advisor/customer-intelligence/${customerId}`);
}

export async function getFullProductCatalog() {
  return apiRequest(`${API_BASE_URL}/offers/product-catalog-full`);
}

export async function checkAIStatus() {
  return apiRequest(`${API_BASE_URL}/offers/ai-status`);
}

export async function getServicesByCategory() {
  return apiRequest(`${API_BASE_URL}/offers/services-by-category`);
}

export async function getCustomerRecommendations(customerId, runId = null) {
  const params = new URLSearchParams();
  if (runId) {
    params.append('run_id', runId.toString());
  }
  const queryString = params.toString();
  return apiRequest(`${API_BASE_URL}/customers/${customerId}/recommendations${queryString ? '?' + queryString : ''}`);
}

