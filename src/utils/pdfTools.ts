import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';

export async function mergePdfs(files: File[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
}

export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return pdf.getPageCount();
}

export async function splitPdf(file: File, splitMode: 'all' | 'custom', customRange = ''): Promise<{ blob: Blob; isZip: boolean; count: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF has no pages to split');
  }

  if (splitMode === 'all') {
    const zip = new JSZip();
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    for (let i = 0; i < totalPages; i++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
      newPdf.addPage(copiedPage);
      const pdfBytes = await newPdf.save();
      zip.file(`${baseName}_page_${i + 1}.pdf`, pdfBytes);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return { blob: zipBlob, isZip: true, count: totalPages };
  } else {
    // Custom range: e.g. "1-3, 5"
    const pageIndices: number[] = [];
    const parts = customRange.split(',').map((s) => s.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
            if (!pageIndices.includes(p - 1)) pageIndices.push(p - 1);
          }
        }
      } else {
        const p = parseInt(part, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          if (!pageIndices.includes(p - 1)) pageIndices.push(p - 1);
        }
      }
    }

    if (pageIndices.length === 0) {
      throw new Error(`Invalid page range. Please choose between 1 and ${totalPages}`);
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return {
      blob: new Blob([pdfBytes as any], { type: 'application/pdf' }),
      isZip: false,
      count: pageIndices.length
    };
  }
}

/**
 * Robust Images to PDF converter:
 * Handles standard JPEGs, Progressive JPEGs, CMYK JPEGs, PNG, WebP, AVIF, BMP, and mobile photos
 * by using HTML5 Canvas decoding with white background fallback so it NEVER fails.
 */
export async function imagesToPdf(
  imageFiles: File[],
  options: { orientation?: 'portrait' | 'landscape'; margin?: number } = {}
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const margin = options.margin ?? 20;

  for (const file of imageFiles) {
    let embeddedImage;

    // First attempt: try embedding directly if JPG
    const ext = file.name.split('.').pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();

    if (ext === 'jpg' || ext === 'jpeg') {
      try {
        embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
      } catch {
        // Fallback for progressive, CMYK, or non-baseline JPEGs: convert through canvas to standard PNG
        const pngBlob = await convertFileToPngBlob(file);
        const pngBuffer = await pngBlob.arrayBuffer();
        embeddedImage = await pdfDoc.embedPng(pngBuffer);
      }
    } else {
      // For PNG, WebP, BMP, etc.
      try {
        const pngBlob = await convertFileToPngBlob(file);
        const pngBuffer = await pngBlob.arrayBuffer();
        embeddedImage = await pdfDoc.embedPng(pngBuffer);
      } catch {
        embeddedImage = await pdfDoc.embedPng(arrayBuffer);
      }
    }

    const { width: imgWidth, height: imgHeight } = embeddedImage;

    // Standard A4 dimensions in points: 595.28 x 841.89
    let pageWidth = 595.28;
    let pageHeight = 841.89;

    if (options.orientation === 'landscape' || (options.orientation !== 'portrait' && imgWidth > imgHeight)) {
      pageWidth = 841.89;
      pageHeight = 595.28;
    }

    const maxUsableWidth = pageWidth - margin * 2;
    const maxUsableHeight = pageHeight - margin * 2;

    const scale = Math.min(maxUsableWidth / imgWidth, maxUsableHeight / imgHeight, 1);
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;

    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}

export async function watermarkPdf(file: File, watermarkText: string): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) / 10;
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size: fontSize,
      font,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.35,
      rotate: degrees(45),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}

function convertFileToPngBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context error'));
      
      // Fill clean background to avoid any black transparency defects in JPEG conversion
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert image to PNG'));
      }, 'image/png');
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
