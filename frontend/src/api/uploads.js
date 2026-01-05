// src/api/uploads.js
import { API_BASE_URL } from './config';

export async function uploadDataset(datasetType, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("dataset_type", datasetType);
    formData.append("file", file);

    // Track upload progress
    if (onProgress) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          onProgress(pct, evt.loaded, evt.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          resolve({ message: 'Upload successful' });
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.detail || error.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error while uploading. Please check your connection.'));
    };

    xhr.onabort = () => {
      reject(new Error('Upload was cancelled.'));
    };

    xhr.open("POST", `${API_BASE_URL}/datasets/upload`);
    xhr.send(formData);
  });
}

export async function listUploadedFiles() {
  const res = await fetch(`${API_BASE_URL}/datasets/list`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Failed to fetch uploaded files: ${res.status}`);
  }
  return await res.json();
}

export async function getUploadJobStatus(jobId) {
  const res = await fetch(`${API_BASE_URL}/datasets/jobs/${jobId}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Failed to fetch job status: ${res.status}`);
  }
  return await res.json();
}
