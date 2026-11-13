import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  Layers, 
  Download, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  FileCheck, 
  Sparkles,
  FileText
} from 'lucide-react';
import { mergePdfs, getPdfPageCount, watermarkPdf } from '../../utils/pdfTools';
import { formatBytes, downloadBlob } from '../../utils/formatHelpers';
import confetti from 'canvas-confetti';

interface PdfMergerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PdfFileItem {
  id: string;
  file: File;
  pages: number;
}

export const PdfMergerModal: React.FC<PdfMergerModalProps> = ({ isOpen, onClose }) => {
  const [pdfList, setPdfList] = useState<PdfFileItem[]>([]);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [watermark, setWatermark] = useState('');

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | File[]) => {
    const newItems: PdfFileItem[] = [];

    for (const file of Array.from(files)) {
      if (file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf')) {
        try {
          const pages = await getPdfPageCount(file);
          newItems.push({
            id: Math.random().toString(36).substring(2, 9),
            file,
            pages,
          });
        } catch {
          newItems.push({
            id: Math.random().toString(36).substring(2, 9),
            file,
            pages: 1,
          });
        }
      }
    }

    setPdfList((prev) => [...prev, ...newItems]);
    setMergedBlob(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setPdfList((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveDown = (index: number) => {
    if (index === pdfList.length - 1) return;
    setPdfList((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const removeFile = (id: string) => {
    setPdfList((prev) => prev.filter((p) => p.id !== id));
    setMergedBlob(null);
  };

  const handleMerge = async () => {
    if (pdfList.length < 2) return;
    setIsMerging(true);

    try {
      const rawFiles = pdfList.map((p) => p.file);
      let blob = await mergePdfs(rawFiles);

      if (watermark.trim()) {
        const tempFile = new File([blob], 'merged.pdf', { type: 'application/pdf' });
        blob = await watermarkPdf(tempFile, watermark.trim());
      }

      setMergedBlob(blob);
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
    } finally {
      setIsMerging(false);
    }
  };

  const totalPages = pdfList.reduce((acc, p) => acc + p.pages, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Merge PDF Files
              </h3>
              <p className="text-xs text-slate-500">
                Combine multiple PDFs into one consolidated document
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

        {/* Body */}
        {pdfList.length === 0 ? (
          <div className="mt-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              id="pdf-merge-picker"
              multiple
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <label htmlFor="pdf-merge-picker" className="cursor-pointer block">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                Select 2 or more PDF files to merge
              </p>
              <p className="text-xs text-slate-400 mt-1">Order can be rearranged after selecting</p>
              <button
                type="button"
                className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md"
              >
                Browse PDFs
              </button>
            </label>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            
            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
              <span>{pdfList.length} PDFs selected • Total {totalPages} pages</span>
              <span>Drag or use arrows to change merge order</span>
            </div>

            {/* Reorderable list */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {pdfList.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                        {item.file.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatBytes(item.file.size)} • {item.pages} pages
                      </p>
                    </div>
                  </div>

                  {/* Move Up, Down, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === pdfList.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Optional Watermark */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Optional Watermark Text (diagonal stamp across pages)
              </label>
              <input
                type="text"
                placeholder="e.g. CONFIDENTIAL or DRAFT"
                value={watermark}
                onChange={(e) => setWatermark(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <label
                htmlFor="add-more-pdf"
                className="cursor-pointer text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <input
                  type="file"
                  id="add-more-pdf"
                  multiple
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                + Add more PDFs
              </label>

              <div className="flex items-center gap-2">
                {!mergedBlob ? (
                  <button
                    type="button"
                    disabled={pdfList.length < 2 || isMerging}
                    onClick={handleMerge}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Layers className="w-4 h-4" />
                    <span>{isMerging ? 'Merging Documents...' : 'Merge PDFs'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => downloadBlob(mergedBlob, `merged_document_${Date.now()}.pdf`)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Merged PDF</span>
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
