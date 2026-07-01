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
export const compressImage = (file, maxWidth, maxHeight, quality = 0.8) => {
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
