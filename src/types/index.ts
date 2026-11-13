export type ToolCategory = 
  | 'all' 
  | 'image' 
  | 'pdf' 
  | 'audio' 
  | 'video' 
  | 'compressor' 
  | 'document';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  category: ToolCategory;
  extension: string;
  targetFormat?: string;
  status: 'idle' | 'converting' | 'done' | 'error';
  progress: number;
  resultUrl?: string;
  resultBlob?: Blob;
  resultSize?: number;
  error?: string;
  customOptions?: Record<string, any>;
}

export interface ToolDef {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  iconName: string;
  popular?: boolean;
  badge?: string;
  fromFormats: string[];
  toFormats: string[];
  actionType: 'universal' | 'image-compress' | 'pdf-merge' | 'pdf-split' | 'image-to-pdf' | 'video-to-audio' | 'text-converter' | 'pdf-editor' | 'custom';
}

export interface ConversionOption {
  quality: number; // 0 to 100
  resizeWidth?: number;
  resizeHeight?: number;
  maintainAspectRatio: boolean;
  removeExif: boolean;
  targetSizeKb?: number;
  audioBitrate?: string; // '128k', '192k', '320k'
  pdfOrientation?: 'portrait' | 'landscape';
  pdfPageSize?: 'a4' | 'letter' | 'fit';
  pdfMargin?: number;
}
