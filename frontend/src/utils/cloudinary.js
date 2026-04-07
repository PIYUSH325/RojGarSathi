/**
 * Cloudinary File Upload Utility
 * Handles image and document uploads to Cloudinary
 */

/**
 * Upload file to Cloudinary
 * @param {File} file - File to upload
 * @param {string} uploadPreset - Cloudinary upload preset
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
export const uploadToCloudinary = async (file, uploadPreset) => {
  if (!uploadPreset) {
    throw new Error('Upload preset is required');
  }

  // Validate file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size must be less than 50MB');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      'https://api.cloudinary.com/v1_1/jobnest/auto/upload',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      publicId: data.public_id,
      size: data.bytes,
      type: data.resource_type,
      format: data.format,
      width: data.width,
      height: data.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {File[]} files - Array of files to upload
 * @param {string} uploadPreset - Cloudinary upload preset
 * @returns {Promise<Object[]>} Array of upload results
 */
export const uploadMultipleToCloudinary = async (files, uploadPreset) => {
  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file, uploadPreset)
  );

  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} apiKey - Cloudinary API key
 * @param {string} apiSecret - Cloudinary API secret
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId, apiKey, apiSecret) => {
  // Note: This should be done on backend for security
  console.warn('FFile deletion should be done on the backend for security');
  return null;
};

/**
 * Get optimized image URL from Cloudinary
 * @param {string} url - Original Cloudinary URL
 * @param {Object} options - Optimization options
 * @returns {string} Optimized URL
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  const {
    width = 400,
    height = 300,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
  } = options;

  if (!url) return '';

  // Replace /upload/ with /upload/<transformations>/
  const transformations = `w_${width},h_${height},q_${quality},f_${format},c_${crop}`;
  return url.replace('/upload/', `/upload/${transformations}/`);
};

/**
 * Get thumbnail URL
 * @param {string} url - Original Cloudinary URL
 * @returns {string} Thumbnail URL
 */
export const getThumbnailUrl = (url) => {
  return getOptimizedImageUrl(url, {
    width: 150,
    height: 150,
    quality: 'auto',
    crop: 'fill',
  });
};
