import JSZip from 'jszip';

export async function createZipFromBlobs(
  files: Array<{ name: string; blob: Blob }>
): Promise<Blob> {
  const zip = new JSZip();

  for (const item of files) {
    zip.file(item.name, item.blob);
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function extractZipEntries(
  zipFile: File
): Promise<Array<{ name: string; size: number; blob: Blob }>> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);
  const results: Array<{ name: string; size: number; blob: Blob }> = [];

  for (const [filename, fileEntry] of Object.entries(loadedZip.files)) {
    if (!fileEntry.dir) {
      const blob = await fileEntry.async('blob');
      results.push({
        name: filename,
        size: blob.size,
        blob
      });
    }
  }

  return results;
}
