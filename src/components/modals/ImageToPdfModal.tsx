import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Download, 
  Trash2, 
  Sparkles,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { imagesToPdf } from '../../utils/pdfTools';
import { formatBytes, downloadBlob } from '../../utils/formatHelpers';
import confetti from 'canvas-confetti';

interface ImageToPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export const ImageToPdfModal: React.FC<ImageToPdfModalProps> = ({ isOpen, onClose }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState<number>(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | File[]) => {
    const newItems: ImageItem[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));

    setImages((prev) => [...prev, ...newItems]);
    setPdfBlob(null);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    setPdfBlob(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);

    try {
      const rawFiles = images.map((i) => i.file);
      const blob = await imagesToPdf(rawFiles, { orientation, margin });
      setPdfBlob(blob);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Photos & Images to PDF
              </h3>
              <p className="text-xs text-slate-500">
                Transform JPG, PNG, and WebP into clean multi-page PDF document
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

        {/* Options Bar */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Page Orientation
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="portrait">Portrait (Vertical)</option>
                <option value="landscape">Landscape (Horizontal)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Page Margin
              </label>
              <select
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="0">No Margin (Full Bleed)</option>
                <option value="20">Normal Margin</option>
                <option value="40">Large Margin</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            {images.length} pages will be created
          </div>
        </div>

        {/* Body */}
        {images.length === 0 ? (
          <div className="mt-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center hover:border-purple-500 transition-colors">
            <input
              type="file"
              id="img-pdf-picker"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <label htmlFor="img-pdf-picker" className="cursor-pointer block">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                Choose images to convert to PDF
              </p>
              <p className="text-xs text-slate-400 mt-1">Receipts, documents, camera photos, graphics</p>
              <button
                type="button"
                className="mt-4 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md"
              >
                Select Photos
              </button>
            </label>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            
            {/* Visual Thumbnail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
              {images.map((item, index) => (
                <div
                  key={item.id}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
                >
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-full h-28 object-cover"
                  />
                  
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                    #{index + 1}
                  </div>

                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded bg-white text-slate-800 disabled:opacity-30"
                      title="Move backward"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === images.length - 1}
                      className="p-1 rounded bg-white text-slate-800 disabled:opacity-30"
                      title="Move forward"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeImage(item.id)}
                      className="p-1 rounded bg-rose-600 text-white"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-1.5 text-[10px] text-slate-500 truncate text-center">
                    {item.file.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <label
                htmlFor="add-more-img"
                className="cursor-pointer text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                <input
                  type="file"
                  id="add-more-img"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                + Add more images
              </label>

              <div className="flex items-center gap-2">
                {!pdfBlob ? (
                  <button
                    type="button"
                    disabled={images.length === 0 || isGenerating}
                    onClick={generatePdf}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{isGenerating ? 'Creating PDF...' : 'Convert to PDF'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => downloadBlob(pdfBlob, `photos_document_${Date.now()}.pdf`)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
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
