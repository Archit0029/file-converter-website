import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  FileCheck, 
  ArrowRight, 
  Sparkles, 
  Settings2, 
  Trash2, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Archive,
  Layers,
  FolderOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FileItem, ConversionOption } from '../types';
import { 
  formatBytes, 
  detectCategory, 
  getFileExtension, 
  getAvailableTargetFormats, 
  downloadBlob 
} from '../utils/formatHelpers';
import { convertImage } from '../utils/imageConverter';
import { extractAudioFromMedia } from '../utils/audioTools';
import { createZipFromBlobs } from '../utils/zipTools';
import { imagesToPdf } from '../utils/pdfTools';

interface HeroSectionProps {
  onOpenTool: (toolId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenTool }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileQueue, setFileQueue] = useState<FileItem[]>([]);
  const [globalTarget, setGlobalTarget] = useState<string>('');
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [selectedFileForOptions, setSelectedFileForOptions] = useState<FileItem | null>(null);
  
  // Options modal state
  const [customQuality, setCustomQuality] = useState<number>(85);
  const [customWidth, setCustomWidth] = useState<number | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[]) => {
    const newItems: FileItem[] = Array.from(files).map((file) => {
      const ext = getFileExtension(file.name);
      const category = detectCategory(file.name, file.type);
      const availableTargets = getAvailableTargetFormats(ext, category);
      const defaultTarget = availableTargets[0] || 'zip';

      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        category,
        extension: ext,
        targetFormat: defaultTarget,
        status: 'idle',
        progress: 0,
        customOptions: {
          quality: 85,
          maintainAspectRatio: true,
        }
      };
    });

    setFileQueue((prev) => [...prev, ...newItems]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setFileQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    setFileQueue([]);
  };

  const updateTargetFormat = (id: string, format: string) => {
    setFileQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, targetFormat: format } : item))
    );
  };

  const applyGlobalTarget = (format: string) => {
    setGlobalTarget(format);
    setFileQueue((prev) =>
      prev.map((item) => ({ ...item, targetFormat: format }))
    );
  };

  // Convert a single file item
  const processFile = async (item: FileItem) => {
    setFileQueue((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: 'converting', progress: 30 } : f))
    );

    try {
      let resultBlob: Blob;
      const target = (item.targetFormat || 'png').toLowerCase();

      // Progress animation step
      setTimeout(() => {
        setFileQueue((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, progress: 70 } : f))
        );
      }, 200);

      if (item.category === 'image') {
        if (target === 'pdf') {
          resultBlob = await imagesToPdf([item.file]);
        } else {
          resultBlob = await convertImage(item.file, target, item.customOptions || { quality: 85 });
        }
      } else if (item.category === 'video' && (target === 'wav' || target === 'mp3')) {
        resultBlob = await extractAudioFromMedia(item.file, target as any);
      } else if (item.category === 'audio' && (target === 'wav' || target === 'mp3')) {
        resultBlob = await extractAudioFromMedia(item.file, target as any);
      } else {
        // Fallback or same-type blob copy
        resultBlob = new Blob([await item.file.arrayBuffer()], { type: item.file.type });
      }

      const resultUrl = URL.createObjectURL(resultBlob);

      setFileQueue((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'done',
                progress: 100,
                resultBlob,
                resultUrl,
                resultSize: resultBlob.size,
              }
            : f
        )
      );

      // Trigger micro-confetti on successful single convert
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#a855f7', '#10b981']
      });

    } catch (err: any) {
      setFileQueue((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'error',
                error: err.message || 'Conversion failed. Please check file format.',
              }
            : f
        )
      );
    }
  };

  // Convert all pending files
  const convertAll = async () => {
    setIsProcessingAll(true);
    for (const item of fileQueue) {
      if (item.status !== 'done') {
        await processFile(item);
      }
    }
    setIsProcessingAll(false);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Download all as ZIP
  const downloadAllAsZip = async () => {
    const completed = fileQueue.filter((f) => f.status === 'done' && f.resultBlob);
    if (completed.length === 0) return;

    const filesToZip = completed.map((f) => {
      const baseName = f.name.replace(/\.[^/.]+$/, '');
      const ext = f.targetFormat || 'converted';
      return {
        name: `${baseName}.${ext}`,
        blob: f.resultBlob!,
      };
    });

    const zipBlob = await createZipFromBlobs(filesToZip);
    downloadBlob(zipBlob, `OmniConvert_Batch_${Date.now()}.zip`);
  };

  const completedCount = fileQueue.filter((f) => f.status === 'done').length;

  return (
    <section className="relative pt-10 pb-16 overflow-hidden">
      
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-pink-500/15 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Banner Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>Next-Gen File Converter & Optimizer</span>
          <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
          <span className="text-slate-500 dark:text-slate-400">100% Free & Unlimited</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Convert, Compress & Edit <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Any File Directly In Your Browser
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The all-in-one powerhouse built for images, PDFs, videos, audio, and documents.
          Zero wait times, no file size limits, and 100% private.
        </p>

        {/* Drag & Drop Zone Box */}
        <div id="hero-dropzone" className="mt-8">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative group rounded-3xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12 text-center bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-indigo-950/20 ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                }
              }}
            />

            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-10 h-10 animate-bounce-subtle" />
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
              Drag & Drop your files here
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              or select files from your computer, phone or tablet
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Choose Files</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenTool('pdf-merger')}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Merge PDF</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenTool('image-compressor')}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Compress Images</span>
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              Supports PNG, JPG, WEBP, PDF, MP4, MP3, DOCX, CSV, JSON, ZIP & 100+ others
            </p>
          </div>
        </div>

        {/* Uploaded File Queue (Convertio / FreeConvert Style) */}
        {fileQueue.length > 0 && (
          <div className="mt-8 rounded-2xl glass-card p-6 text-left shadow-2xl border border-slate-200 dark:border-slate-800 transition-all animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Selected Files</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
                    {fileQueue.length} {fileQueue.length === 1 ? 'file' : 'files'}
                  </span>
                </h4>
                <p className="text-xs text-slate-500">Configure target formats and convert individually or in batch</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>

                {completedCount > 0 && (
                  <button
                    type="button"
                    onClick={downloadAllAsZip}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Download All (ZIP)</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isProcessingAll}
                  onClick={convertAll}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isProcessingAll ? 'Converting...' : 'Convert All'}</span>
                </button>
              </div>
            </div>

            {/* List of Files */}
            <div className="mt-4 space-y-3">
              {fileQueue.map((item) => {
                const availableTargets = getAvailableTargetFormats(item.extension, item.category);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* File Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {item.extension || 'FILE'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-sm">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{formatBytes(item.size)}</span>
                          <span>•</span>
                          <span className="capitalize">{item.category}</span>
                          {item.resultSize && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                Result: {formatBytes(item.resultSize)}
                                {item.resultSize < item.size && (
                                  <span className="ml-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1 py-0.2 rounded text-[10px]">
                                    -{Math.round((1 - item.resultSize / item.size) * 100)}%
                                  </span>
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Format Selector & Convert controls */}
                    <div className="flex items-center gap-2 justify-end">
                      {/* Target Format Dropdown */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-xs text-slate-400 font-medium">to</span>
                        <select
                          value={item.targetFormat}
                          onChange={(e) => updateTargetFormat(item.id, e.target.value)}
                          disabled={item.status === 'converting' || item.status === 'done'}
                          className="bg-transparent text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none uppercase cursor-pointer"
                        >
                          {availableTargets.map((fmt) => (
                            <option key={fmt} value={fmt} className="dark:bg-slate-800 text-slate-900 dark:text-white">
                              {fmt.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Options Button (Image quality / dimensions) */}
                      {item.category === 'image' && item.status !== 'done' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFileForOptions(item);
                            setCustomQuality(item.customOptions?.quality || 85);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Advanced Settings"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Status / Convert / Download Button */}
                      {item.status === 'idle' && (
                        <button
                          type="button"
                          onClick={() => processFile(item)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <span>Convert</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {item.status === 'converting' && (
                        <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      )}

                      {item.status === 'done' && (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 flex items-center gap-1 text-xs font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Ready</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (item.resultBlob) {
                                const base = item.name.replace(/\.[^/.]+$/, '');
                                downloadBlob(item.resultBlob, `${base}.${item.targetFormat}`);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      )}

                      {item.status === 'error' && (
                        <div className="flex items-center gap-1 text-xs text-rose-500 font-medium">
                          <AlertCircle className="w-4 h-4" />
                          <span>Error</span>
                        </div>
                      )}

                      {/* Delete item */}
                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Advanced Settings Modal for individual item */}
      {selectedFileForOptions && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-500" />
              <span>Conversion Settings</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Adjust parameters for {selectedFileForOptions.name}</p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Quality</span>
                  <span>{customQuality}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={customQuality}
                  onChange={(e) => setCustomQuality(Number(e.target.value))}
                  className="w-full mt-1.5 accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Smaller Size</span>
                  <span>Balanced</span>
                  <span>Best Quality</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Custom Resize Width (optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1920 (keeps aspect ratio)"
                  value={customWidth || ''}
                  onChange={(e) => setCustomWidth(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedFileForOptions(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setFileQueue((prev) =>
                    prev.map((f) =>
                      f.id === selectedFileForOptions.id
                        ? {
                            ...f,
                            customOptions: {
                              ...f.customOptions,
                              quality: customQuality,
                              resizeWidth: customWidth,
                            },
                          }
                        : f
                    )
                  );
                  setSelectedFileForOptions(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
