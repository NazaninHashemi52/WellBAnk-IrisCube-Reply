// Centralized API configuration
export const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

// Helper function to handle API responses
export async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(errorData.detail || errorData.message || `Request failed with status ${response.status}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to backend server. Please make sure the FastAPI server is running on port 8000.');
    }
    throw error;
  }
}

