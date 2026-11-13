import { ConversionOption } from '../types';

export async function convertImage(
  file: File,
  targetFormat: string,
  options: Partial<ConversionOption> = {}
): Promise<Blob> {
  const quality = (options.quality ?? 85) / 100;
  const img = await loadImage(file);

  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  if (options.resizeWidth && options.resizeHeight) {
    targetWidth = options.resizeWidth;
    targetHeight = options.resizeHeight;
  } else if (options.resizeWidth) {
    if (options.maintainAspectRatio !== false) {
      targetHeight = Math.round((targetWidth / img.naturalWidth) * img.naturalHeight);
    }
  }

  // Handle ICO format separately if selected
  if (targetFormat.toLowerCase() === 'ico') {
    return createIcoBlob(img);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context');
  }

  // If converting to JPEG or BMP, fill white background for transparent images
  if (['jpg', 'jpeg', 'bmp'].includes(targetFormat.toLowerCase())) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  let mimeType = 'image/png';
  const format = targetFormat.toLowerCase();
  if (format === 'jpg' || format === 'jpeg') mimeType = 'image/jpeg';
  else if (format === 'webp') mimeType = 'image/webp';
  else if (format === 'avif') mimeType = 'image/avif';
  else if (format === 'bmp') mimeType = 'image/bmp';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // Fallback if browser doesn't support specific mimeType (e.g. avif on older engines)
          canvas.toBlob((fallbackBlob) => {
            if (fallbackBlob) resolve(fallbackBlob);
            else reject(new Error('Canvas image encoding failed'));
          }, 'image/png');
        }
      },
      mimeType,
      quality
    );
  });
}

export function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function createIcoBlob(img: HTMLImageElement): Promise<Blob> {
  // ICO file standard header + directory + PNG payload for 32x32 icon
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, size, size);

  return new Promise((resolve) => {
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) {
        throw new Error('Failed to create icon frame');
      }
      pngBlob.arrayBuffer().then((pngBuffer) => {
        const pngBytes = new Uint8Array(pngBuffer);
        const icoHeaderSize = 6;
        const icoDirEntrySize = 16;
        const totalSize = icoHeaderSize + icoDirEntrySize + pngBytes.length;
        const icoData = new Uint8Array(totalSize);

        // ICO Header
        icoData[0] = 0; icoData[1] = 0; // Reserved
        icoData[2] = 1; icoData[3] = 0; // Type 1 = ICO
        icoData[4] = 1; icoData[5] = 0; // 1 image

        // Directory Entry
        icoData[6] = size;             // Width
        icoData[7] = size;             // Height
        icoData[8] = 0;                // Color palette
        icoData[9] = 0;                // Reserved
        icoData[10] = 1; icoData[11] = 0; // Color planes
        icoData[12] = 32; icoData[13] = 0; // Bits per pixel

        // Image data size
        const len = pngBytes.length;
        icoData[14] = len & 0xFF;
        icoData[15] = (len >> 8) & 0xFF;
        icoData[16] = (len >> 16) & 0xFF;
        icoData[17] = (len >> 24) & 0xFF;

        // Offset of image data
        const offset = icoHeaderSize + icoDirEntrySize;
        icoData[18] = offset & 0xFF;
        icoData[19] = (offset >> 8) & 0xFF;
        icoData[20] = (offset >> 16) & 0xFF;
        icoData[21] = (offset >> 24) & 0xFF;

        // Copy PNG bytes
        icoData.set(pngBytes, offset);

        resolve(new Blob([icoData], { type: 'image/x-icon' }));
      });
    }, 'image/png');
  });
}
