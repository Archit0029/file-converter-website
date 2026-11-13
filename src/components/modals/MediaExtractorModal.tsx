import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  Volume2, 
  Download, 
  Sparkles,
  Music,
  CheckCircle2
} from 'lucide-react';
import { extractAudioFromMedia } from '../../utils/audioTools';
import { formatBytes, downloadBlob } from '../../utils/formatHelpers';
import confetti from 'canvas-confetti';

interface MediaExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MediaExtractorModal: React.FC<MediaExtractorModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedBlob, setExtractedBlob] = useState<Blob | null>(null);
  const [targetFormat, setTargetFormat] = useState<'wav' | 'mp3'>('wav');

  if (!isOpen) return null;

  const handleFile = (f: File) => {
    setFile(f);
    setExtractedBlob(null);
  };

  const runExtraction = async () => {
    if (!file) return;
    setIsExtracting(true);

    try {
      const blob = await extractAudioFromMedia(file, targetFormat);
      setExtractedBlob(blob);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      alert('Error extracting audio: ' + (err?.message || 'Unsupported media encoding'));
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Video to Audio Extractor
              </h3>
              <p className="text-xs text-slate-500">
                Extract high-fidelity audio tracks from MP4, WebM, and MOV videos
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
          <div className="mt-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center hover:border-amber-500 transition-colors">
            <input
              type="file"
              id="media-picker"
              accept="video/*,audio/*"
              className="hidden"
              onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
            />
            <label htmlFor="media-picker" className="cursor-pointer block">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                Choose a video or audio file
              </p>
              <p className="text-xs text-slate-400 mt-1">MP4, WebM, MOV, MKV, WAV • 100% processed locally</p>
              <button
                type="button"
                className="mt-4 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md"
              >
                Browse Video
              </button>
            </label>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            
            {/* Selected File Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold text-xs">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-400">{formatBytes(file.size)}</p>
                </div>
              </div>

              <button
                onClick={() => setFile(null)}
                className="text-xs text-rose-500 hover:underline"
              >
                Change
              </button>
            </div>

            {/* Target format */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Audio Output Format
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value as any)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 uppercase font-semibold"
              >
                <option value="wav">WAV (Lossless Studio Quality PCM)</option>
              </select>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              {!extractedBlob ? (
                <button
                  type="button"
                  disabled={isExtracting}
                  onClick={runExtraction}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isExtracting ? 'Decoding & Extracting Audio...' : 'Extract Audio'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const base = file.name.replace(/\.[^/.]+$/, '');
                    downloadBlob(extractedBlob, `${base}_extracted.wav`);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Audio (WAV)</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
