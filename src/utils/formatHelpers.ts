import { ToolCategory, ToolDef } from '../types';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts.pop()!.toLowerCase();
}

export function detectCategory(filename: string, mimeType: string): ToolCategory {
  const ext = getFileExtension(filename);
  
  const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg', 'ico', 'avif', 'tiff', 'heic'];
  const pdfExts = ['pdf'];
  const docExts = ['txt', 'md', 'json', 'csv', 'xml', 'html', 'rtf', 'docx', 'doc', 'epub'];
  const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'];
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'];

  if (pdfExts.includes(ext) || mimeType.includes('pdf')) return 'pdf';
  if (imageExts.includes(ext) || mimeType.startsWith('image/')) return 'image';
  if (audioExts.includes(ext) || mimeType.startsWith('audio/')) return 'audio';
  if (videoExts.includes(ext) || mimeType.startsWith('video/')) return 'video';
  if (docExts.includes(ext) || mimeType.startsWith('text/')) return 'document';

  return 'document';
}

export function getAvailableTargetFormats(ext: string, category: ToolCategory): string[] {
  const cleanExt = ext.toLowerCase();

  switch (category) {
    case 'image':
      return ['png', 'jpg', 'webp', 'avif', 'bmp', 'ico', 'pdf'].filter(f => f !== cleanExt);
    case 'pdf':
      return ['png', 'jpg', 'webp', 'txt'];
    case 'audio':
      return ['mp3', 'wav', 'ogg', 'aac'].filter(f => f !== cleanExt);
    case 'video':
      return ['mp3', 'wav', 'ogg', 'webm', 'gif'].filter(f => f !== cleanExt);
    case 'document':
      if (cleanExt === 'json') return ['csv', 'txt', 'xml'];
      if (cleanExt === 'csv') return ['json', 'txt'];
      if (cleanExt === 'md') return ['html', 'txt'];
      if (cleanExt === 'html') return ['md', 'txt'];
      return ['pdf', 'txt', 'html'];
    default:
      return ['zip', 'txt'];
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const TOOLS_LIST: ToolDef[] = [
  // Image Suite
  {
    id: 'image-converter',
    name: 'Image Converter',
    category: 'image',
    description: 'Convert images across PNG, JPG, WEBP, AVIF, BMP, and ICO formats instantly.',
    iconName: 'Image',
    popular: true,
    badge: 'Fast',
    fromFormats: ['png', 'jpg', 'jpeg', 'webp', 'avif', 'bmp', 'ico', 'svg'],
    toFormats: ['png', 'jpg', 'webp', 'avif', 'bmp', 'ico'],
    actionType: 'universal'
  },
  {
    id: 'image-compressor',
    name: 'Smart Image Compressor',
    category: 'compressor',
    description: 'Compress PNG, JPG, and WEBP images with custom quality & dimensions slider.',
    iconName: 'Minimize2',
    popular: true,
    badge: 'Popular',
    fromFormats: ['png', 'jpg', 'jpeg', 'webp', 'avif'],
    toFormats: ['jpg', 'webp', 'png'],
    actionType: 'image-compress'
  },
  {
    id: 'image-to-pdf',
    name: 'Images to PDF',
    category: 'pdf',
    description: 'Combine multiple photos (JPG, PNG, WEBP) into a clean, formatted PDF document.',
    iconName: 'FileText',
    popular: true,
    badge: 'Essential',
    fromFormats: ['png', 'jpg', 'jpeg', 'webp', 'bmp'],
    toFormats: ['pdf'],
    actionType: 'image-to-pdf'
  },
  // PDF Suite
  {
    id: 'edit-pdf',
    name: 'Edit PDF (MS Word Style)',
    category: 'pdf',
    description: 'Advanced MS Word-style PDF editor: rich text formatting, fonts, images, signatures, annotations, stamps & drawings.',
    iconName: 'FileEdit',
    popular: true,
    badge: 'MS Word Style',
    fromFormats: ['pdf', 'doc', 'docx', 'txt'],
    toFormats: ['pdf', 'docx', 'html'],
    actionType: 'pdf-editor'
  },
  {
    id: 'pdf-merger',
    name: 'Merge PDF',
    category: 'pdf',
    description: 'Combine multiple PDF files into one consolidated file with customizable order.',
    iconName: 'Layers',
    popular: true,
    badge: 'Hot',
    fromFormats: ['pdf'],
    toFormats: ['pdf'],
    actionType: 'pdf-merge'
  },
  {
    id: 'pdf-splitter',
    name: 'Split PDF',
    category: 'pdf',
    description: 'Extract specific pages or burst large PDF documents into separate individual files.',
    iconName: 'Scissors',
    popular: true,
    fromFormats: ['pdf'],
    toFormats: ['pdf', 'zip'],
    actionType: 'pdf-split'
  },
  {
    id: 'pdf-compressor',
    name: 'Compress PDF',
    category: 'compressor',
    description: 'Optimize PDF file size while maintaining high readability and clean vector paths.',
    iconName: 'Shrink',
    popular: true,
    badge: 'High Ratio',
    fromFormats: ['pdf'],
    toFormats: ['pdf'],
    actionType: 'pdf-merge' // Uses pdf-lib compression
  },
  // Audio & Video Suite
  {
    id: 'video-to-audio',
    name: 'Video to Audio (MP3/WAV)',
    category: 'audio',
    description: 'Extract crystal-clear sound tracks from MP4, WebM, and MOV video files directly.',
    iconName: 'Volume2',
    popular: true,
    badge: 'Zero Upload',
    fromFormats: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
    toFormats: ['wav', 'mp3'],
    actionType: 'video-to-audio'
  },
  {
    id: 'audio-converter',
    name: 'Audio Converter',
    category: 'audio',
    description: 'Convert between WAV, MP3, OGG, and WebM with custom sample rate & bitrate options.',
    iconName: 'Music',
    popular: false,
    fromFormats: ['wav', 'mp3', 'ogg', 'webm', 'aac'],
    toFormats: ['wav', 'mp3', 'ogg'],
    actionType: 'universal'
  },
  // Document, Data & Code Suite
  {
    id: 'markdown-html',
    name: 'Markdown to HTML & Text',
    category: 'document',
    description: 'Transform Markdown articles and notes into styled HTML web pages or clean text.',
    iconName: 'Code',
    popular: false,
    badge: 'Dev',
    fromFormats: ['md', 'txt'],
    toFormats: ['html', 'txt'],
    actionType: 'text-converter'
  },
  {
    id: 'json-csv',
    name: 'JSON ↔ CSV Converter',
    category: 'document',
    description: 'Bi-directional spreadsheet converter for tabular JSON arrays and CSV data.',
    iconName: 'Table',
    popular: true,
    badge: 'Useful',
    fromFormats: ['json', 'csv'],
    toFormats: ['csv', 'json'],
    actionType: 'text-converter'
  },
  {
    id: 'base64-converter',
    name: 'Base64 Encoder / Decoder',
    category: 'document',
    description: 'Encode any file into Base64 DataURI or decode Base64 strings back to binary files.',
    iconName: 'Binary',
    popular: false,
    fromFormats: ['*'],
    toFormats: ['txt', 'base64'],
    actionType: 'text-converter'
  },
  {
    id: 'zip-archiver',
    name: 'ZIP Creator & Unpacker',
    category: 'compressor',
    description: 'Bundle multiple files into a compressed ZIP or inspect and extract ZIP archives.',
    iconName: 'Archive',
    popular: true,
    fromFormats: ['*'],
    toFormats: ['zip'],
    actionType: 'universal'
  }
];

export const POPULAR_CONVERSIONS = [
  { from: 'EDIT', to: 'PDF', label: 'Edit PDF (Word Style)', category: 'pdf' as ToolCategory },
  { from: 'PNG', to: 'JPG', label: 'PNG to JPG', category: 'image' as ToolCategory },
  { from: 'JPG', to: 'PNG', label: 'JPG to PNG', category: 'image' as ToolCategory },
  { from: 'JPG', to: 'WEBP', label: 'JPG to WEBP', category: 'image' as ToolCategory },
  { from: 'PNG', to: 'WEBP', label: 'PNG to WEBP', category: 'image' as ToolCategory },
  { from: 'PDF', to: 'MERGE', label: 'Merge PDF', category: 'pdf' as ToolCategory },
  { from: 'IMAGE', to: 'PDF', label: 'Images to PDF', category: 'pdf' as ToolCategory },
  { from: 'MP4', to: 'MP3', label: 'MP4 to MP3', category: 'audio' as ToolCategory },
  { from: 'JSON', to: 'CSV', label: 'JSON to CSV', category: 'document' as ToolCategory },
  { from: 'CSV', to: 'JSON', label: 'CSV to JSON', category: 'document' as ToolCategory },
  { from: 'IMG', to: 'COMPRESS', label: 'Compress Image', category: 'compressor' as ToolCategory },
];
