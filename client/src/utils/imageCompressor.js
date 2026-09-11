export async function compressImage(file, maxSizeBytes = 500 * 1024, maxWidth = 800, maxHeight = 800) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = async () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.85;
          let blob = null;

          const getBlob = (q) =>
            new Promise((res) => {
              canvas.toBlob((b) => res(b), 'image/jpeg', q);
            });

          blob = await getBlob(quality);

          while (blob && blob.size > maxSizeBytes && quality > 0.3) {
            quality -= 0.12;
            blob = await getBlob(quality);
          }

          if (blob && blob.size > maxSizeBytes) {
            let currentWidth = Math.round(width * 0.75);
            let currentHeight = Math.round(height * 0.75);
            const smallerCanvas = document.createElement('canvas');
            smallerCanvas.width = currentWidth;
            smallerCanvas.height = currentHeight;
            const sCtx = smallerCanvas.getContext('2d');
            sCtx.drawImage(canvas, 0, 0, currentWidth, currentHeight);
            blob = await new Promise((res) => {
              smallerCanvas.toBlob((b) => res(b), 'image/jpeg', 0.65);
            });
          }

          if (!blob) {
            throw new Error('Compression produced invalid data');
          }

          const fileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
          const compressedFile = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve({
            file: compressedFile,
            blob,
            originalSize: file.size,
            compressedSize: blob.size,
            format: 'image/jpeg',
          });
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function compressPostImage(file, maxSizeBytes = 800 * 1024, maxWidth = 1600, maxHeight = 1600) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file');
  }
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }
  const result = await compressImage(file, maxSizeBytes, maxWidth, maxHeight);
  return result.file;
}
