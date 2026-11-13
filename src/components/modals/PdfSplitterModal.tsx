import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  Scissors, 
  Download, 
  Sparkles, 
  FileText,
  Archive
} from 'lucide-react';
import { splitPdf, getPdfPageCount } from '../../utils/pdfTools';
import { formatBytes, downloadBlob } from '../../utils/formatHelpers';
import confetti from 'canvas-confetti';

interface PdfSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PdfSplitterModal: React.FC<PdfSplitterModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<'all' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<string>('1-2');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; isZip: boolean; count: number } | null>(null);

  if (!isOpen) return null;

  const handleFile = async (f: File) => {
    setFile(f);
    setResult(null);
    try {
      const count = await getPdfPageCount(f);
      setPageCount(count);
      setCustomRange(`1-${Math.min(3, count)}`);
    } catch {
      setPageCount(1);
    }
  };

  const runSplit = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const res = await splitPdf(file, splitMode, customRange);
      setResult(res);
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      alert('Error splitting PDF: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center border border-pink-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Split PDF Document
              </h3>
              <p className="text-xs text-slate-500">
                Extract page ranges or separate all pages into individual files
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

        {/* Content */}
        {!file ? (
          <div className="mt-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center hover:border-pink-500 transition-colors">
            <input
              type="file"
              id="split-picker"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
            />
            <label htmlFor="split-picker" className="cursor-pointer block">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                Select a PDF file to split
              </p>
              <p className="text-xs text-slate-400 mt-1">Multi-page manuals, statements, books, scans</p>
              <button
                type="button"
                className="mt-4 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-md"
              >
                Browse PDF
              </button>
            </label>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            
            {/* Selected File Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-950 text-pink-600 flex items-center justify-center font-bold text-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {formatBytes(file.size)} • {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setFile(null)}
                className="text-xs text-rose-500 hover:underline"
              >
                Change
              </button>
            </div>

            {/* Split Mode Options */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Choose Split Method
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSplitMode('all')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    splitMode === 'all'
                      ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold block">Extract All Pages</span>
                  <span className="text-[10px] text-slate-400">
                    Each page saved as individual PDF in a ZIP
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitMode('custom')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    splitMode === 'custom'
                      ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold block">Custom Page Range</span>
                  <span className="text-[10px] text-slate-400">
                    Extract specific page numbers
                  </span>
                </button>
              </div>

              {splitMode === 'custom' && (
                <div className="pt-2">
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                    Enter page ranges (e.g. "1-3, 5")
                  </label>
                  <input
                    type="text"
                    value={customRange}
                    onChange={(e) => setCustomRange(e.target.value)}
                    placeholder="e.g. 1-3, 5"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              {!result ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={runSplit}
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-md shadow-pink-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Scissors className="w-4 h-4" />
                  <span>{isProcessing ? 'Splitting PDF...' : 'Split PDF'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const base = file.name.replace(/\.[^/.]+$/, '');
                    if (result.isZip) {
                      downloadBlob(result.blob, `${base}_split_pages.zip`);
                    } else {
                      downloadBlob(result.blob, `${base}_extracted.pdf`);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {result.isZip ? 'Download ZIP of All Pages' : 'Download Extracted PDF'}
                  </span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
