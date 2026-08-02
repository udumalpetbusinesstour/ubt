/**
 * Compresses and resizes an image file on the client side using HTML5 Canvas.
 * Keeps aspect ratio intact while capping dimensions to maxWidth/maxHeight.
 * 
 * @param {File} file The original image file.
 * @param {number} maxWidth Maximum width of the output image.
 * @param {number} maxHeight Maximum height of the output image.
 * @param {number} [quality=0.8] Compression quality (0 to 1).
 * @returns {Promise<File>} A Promise that resolves to the compressed/resized File object.
 */
export const compressImage = (file, maxWidth, maxHeight, quality = 0.8, forceSquare = false) => {
  return new Promise((resolve, reject) => {
    // Return early if not an image
    if (!file.type || !file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (forceSquare) {
          let S = maxWidth || 500;
          let scaledWidth = S;
          let scaledHeight = S;

          if (width > height) {
            scaledHeight = Math.round((height * S) / width);
            scaledWidth = S;
          } else {
            scaledWidth = Math.round((width * S) / height);
            scaledHeight = S;
          }

          canvas.width = S;
          canvas.height = S;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(file);
          }

          // Fill canvas with white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, S, S);

          // Draw image centered inside the square
          const dx = (S - scaledWidth) / 2;
          const dy = (S - scaledHeight) / 2;
          ctx.drawImage(img, dx, dy, scaledWidth, scaledHeight);
        } else {
          // Calculate new dimensions keeping the aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(file); // Fallback to original file on failure
          }
          
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file); // Fallback to original file
            }
            // Create a new File from the blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => resolve(file); // Fallback to original file
    };
    reader.onerror = (err) => resolve(file); // Fallback to original file
  });
};

/**
 * Returns the backend API base URL.
 * In production (PROD Vite build) uses window.location.origin (Nginx same-origin proxy).
 * In dev falls back to localhost:5000.
 */
export const getApiBase = () => {
  return import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD && typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:5000');
};

/**
 * Slugifies a string into a URL-safe, SEO-friendly filename fragment.
 * e.g. "Volkswagen POLO" → "volkswagen-polo"
 */
export const slugifyContext = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/--+/g, '-')
    .slice(0, 80);
};

/**
 * Builds the full upload endpoint URL with an SEO-friendly ?context= query param.
 * The backend reads this param to name the saved file meaningfully for Google Images SEO.
 *
 * @param {string} context  Human-readable label e.g. "Volkswagen POLO cover udumalpet"
 * @param {boolean} [isPublic=false]  Use the public (no-auth) upload endpoint
 * @returns {string} Full URL with context slug appended as query param
 *
 * Examples:
 *   buildUploadUrl("Volkswagen POLO logo udumalpet")
 *   → "https://udumalpet.business/api/upload?context=volkswagen-polo-logo-udumalpet"
 *
 *   buildUploadUrl("Diwali Sale 2024 banner", false)
 *   → "https://udumalpet.business/api/upload?context=diwali-sale-2024-banner"
 */
export const buildUploadUrl = (context, isPublic = false) => {
  const base = getApiBase();
  const endpoint = isPublic ? `${base}/api/upload/public` : `${base}/api/upload`;
  const slug = slugifyContext(context);
  return slug ? `${endpoint}?context=${encodeURIComponent(slug)}` : endpoint;
};
