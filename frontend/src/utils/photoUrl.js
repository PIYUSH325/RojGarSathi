const resolveBackendOrigin = (apiBase) => {
  const baseCandidate =
    apiBase ||
    process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_API_BASE_URL ||
    'http://localhost:5000/api/v1';

  return baseCandidate.replace(/\/api\/v1\/?$/, '');
};

const normalizeUploadPath = (filePath) => {
  if (!filePath) return '';
  const normalized = String(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.startsWith('uploads/')) {
    return normalized;
  }
  return `uploads/${normalized}`;
};

export const getUploadUrl = (filePath, apiBase) => {
  if (!filePath) return '';

  if (String(filePath).startsWith('http://') || String(filePath).startsWith('https://')) {
    return filePath;
  }

  const backendOrigin = resolveBackendOrigin(apiBase);
  const uploadPath = normalizeUploadPath(filePath);
  return `${backendOrigin}/${uploadPath}`;
};

/**
 * Construct a full photo URL from a stored path
 * @param {string} photoPath - The photo path from the database (e.g., "photos/photo-123.png")
 * @param {string} apiBase - Optional API base URL from AuthContext
 * @returns {string} Full URL or placeholder
 */
export const getPhotoUrl = (photoPath, apiBase) => {
  if (!photoPath) {
    return 'https://via.placeholder.com/48';
  }

  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }

  return getUploadUrl(photoPath, apiBase);
};

/**
 * Construct a photo URL for a specific size (mainly for avatars)
 * @param {string} photoPath - The photo path from the database
 * @param {number} size - Avatar size (32, 40, 48, etc.)
 * @param {string} apiBase - Optional API base URL from AuthContext
 * @returns {string} Full URL or placeholder
 */
export const getAvatarUrl = (photoPath, size = 48, apiBase) => {
  if (!photoPath) {
    return `https://via.placeholder.com/${size}`;
  }

  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }

  return getUploadUrl(photoPath, apiBase);
};
