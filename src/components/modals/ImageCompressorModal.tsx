import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  Sparkles, 
  Download, 
  Sliders, 
  Archive, 
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { convertImage } from '../../utils/imageConverter';
import { formatBytes, downloadBlob } from '../../utils/formatHelpers';
import { createZipFromBlobs } from '../../utils/zipTools';
import confetti from 'canvas-confetti';

interface ImageCompressorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CompressedItem {
  id: string;
  originalFile: File;
  originalSize: number;
  previewUrl: string;
  compressedBlob?: Blob;
  compressedSize?: number;
  status: 'idle' | 'compressing' | 'done';
}

export const ImageCompressorModal: React.FC<ImageCompressorModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<CompressedItem[]>([]);
  const [quality, setQuality] = useState<number>(75);
  const [scale, setScale] = useState<number>(100);
  const [targetFormat, setTargetFormat] = useState<'webp' | 'jpg' | 'png'>('webp');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFiles = (fileList: FileList | File[]) => {
    const newItems: CompressedItem[] = Array.from(fileList).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      originalFile: file,
      originalSize: file.size,
      previewUrl: URL.createObjectURL(file),
      status: 'idle',
    }));

    setItems((prev) => [...prev, ...newItems]);
  };

  const runCompression = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    const updated = [...items];

    for (let i = 0; i < updated.length; i++) {
      updated[i].status = 'compressing';
      setItems([...updated]);

      try {
        const file = updated[i].originalFile;
        const img = new Image();
        img.src = updated[i].previewUrl;
        await new Promise((res) => (img.onload = res));

        const targetW = Math.round(img.naturalWidth * (scale / 100));
        const targetH = Math.round(img.naturalHeight * (scale / 100));

        const blob = await convertImage(file, targetFormat, {
          quality,
          resizeWidth: targetW,
          resizeHeight: targetH,
          maintainAspectRatio: true,
        });

        updated[i].compressedBlob = blob;
        updated[i].compressedSize = blob.size;
        updated[i].status = 'done';
        setItems([...updated]);
      } catch (e) {
        console.error(e);
        updated[i].status = 'idle';
      }
    }

    setIsProcessing(false);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const downloadAll = async () => {
    const readyItems = items.filter((i) => i.compressedBlob);
    if (readyItems.length === 0) return;

    if (readyItems.length === 1) {
      const base = readyItems[0].originalFile.name.replace(/\.[^/.]+$/, '');
      downloadBlob(readyItems[0].compressedBlob!, `${base}_compressed.${targetFormat}`);
      return;
    }

    const files = readyItems.map((item) => {
      const base = item.originalFile.name.replace(/\.[^/.]+$/, '');
      return {
        name: `${base}_compressed.${targetFormat}`,
        blob: item.compressedBlob!,
      };
    });

    const zipBlob = await createZipFromBlobs(files);
    downloadBlob(zipBlob, `compressed_images_${Date.now()}.zip`);
  };

  const totalOriginalSize = items.reduce((acc, i) => acc + i.originalSize, 0);
  const totalCompressedSize = items.reduce((acc, i) => acc + (i.compressedSize || i.originalSize), 0);
  const totalSavedPercent =
    totalOriginalSize > 0
      ? Math.max(0, Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100))
      : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Smart Image Compressor
              </h3>
              <p className="text-xs text-slate-500">
                Compress JPG, PNG & WebP with visual before/after comparison
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compression Settings Panel */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Quality Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>Quality</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{quality}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Max Saving</span>
              <span>Balanced</span>
              <span>High Detail</span>
            </div>
          </div>

          {/* Scale / Dimensions */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Resize Scale
            </label>
            <select
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="100">Original Dimensions (100%)</option>
              <option value="80">Scale down to 80%</option>
              <option value="60">Scale down to 60%</option>
              <option value="50">Scale down to 50%</option>
            </select>
          </div>

          {/* Target Format */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Output Format
            </label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as any)}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-semibold"
            >
              <option value="webp">WEBP (Highest Compression)</option>
              <option value="jpg">JPG (Universal Compatibility)</option>
              <option value="png">PNG (Lossless / Transparent)</option>
            </select>
          </div>
        </div>

        {/* Dropzone if empty or add more */}
        {items.length === 0 ? (
          <div className="mt-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center hover:border-emerald-500 transition-colors">
            <input
              type="file"
              id="compress-picker"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <label htmlFor="compress-picker" className="cursor-pointer block">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                Choose images to compress
              </p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP supported • Up to 100 images</p>
              <button
                type="button"
                className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
              >
                Browse Images
              </button>
            </label>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            
            {/* Stats Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
              <div className="text-xs text-emerald-800 dark:text-emerald-200">
                <span className="font-bold">{items.length} Images</span> • Original:{' '}
                <span className="font-semibold">{formatBytes(totalOriginalSize)}</span>
                {totalCompressedSize < totalOriginalSize && (
                  <>
                    {' '}
                    → Compressed:{' '}
                    <span className="font-semibold">{formatBytes(totalCompressedSize)}</span>
                  </>
                )}
              </div>
              {totalSavedPercent > 0 && (
                <div className="text-xs font-extrabold text-white bg-emerald-600 px-2.5 py-1 rounded-full shadow-sm">
                  Saved {totalSavedPercent}%
                </div>
              )}
            </div>

            {/* List with live comparison thumbnails */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.previewUrl}
                      alt={item.originalFile.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                        {item.originalFile.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Original: {formatBytes(item.originalSize)}
                        {item.compressedSize && (
                          <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-bold">
                            → {formatBytes(item.compressedSize)} (
                            -{Math.round((1 - item.compressedSize / item.originalSize) * 100)}%)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === 'done' && (
                      <button
                        onClick={() => {
                          if (item.compressedBlob) {
                            const base = item.originalFile.name.replace(/\.[^/.]+$/, '');
                            downloadBlob(item.compressedBlob, `${base}_compressed.${targetFormat}`);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <label
                htmlFor="add-more-compress"
                className="cursor-pointer text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <input
                  type="file"
                  id="add-more-compress"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                + Add more images
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={runCompression}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Compressing...' : 'Compress Now'}</span>
                </button>

                {items.some((i) => i.status === 'done') && (
                  <button
                    type="button"
                    onClick={downloadAll}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download All</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
