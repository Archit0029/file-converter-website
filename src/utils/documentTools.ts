/**
 * In-browser document, data and text conversion utilities
 */

export function convertMarkdownToHtml(markdownText: string): string {
  let html = markdownText
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold & Italics
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\[]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Blockquotes
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    // Line breaks
    .replace(/\n$/gim, '<br />');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Converted Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1, h2, h3 { color: #0f172a; margin-top: 1.5em; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    pre { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #6366f1; margin: 0; padding-left: 16px; color: #64748b; }
    a { color: #4f46e5; text-decoration: underline; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

export function convertJsonToCsv(jsonString: string): string {
  const data = JSON.parse(jsonString);
  const items = Array.isArray(data) ? data : [data];

  if (items.length === 0) return '';

  const headers = Array.from(
    new Set(items.flatMap((item) => (typeof item === 'object' && item !== null ? Object.keys(item) : [])))
  );

  const csvRows = [headers.join(',')];

  for (const item of items) {
    const row = headers.map((header) => {
      const val = item[header];
      if (val === null || val === undefined) return '""';
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

export function convertCsvToJson(csvString: string): string {
  const lines = csvString.trim().split(/\r?\n/);
  if (lines.length === 0) return '[]';

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseCsvLine(lines[0]);
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCsvLine(lines[i]);
    const obj: Record<string, any> = {};
    headers.forEach((header, idx) => {
      obj[header] = values[idx] !== undefined ? values[idx] : null;
    });
    result.push(obj);
  }

  return JSON.stringify(result, null, 2);
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
