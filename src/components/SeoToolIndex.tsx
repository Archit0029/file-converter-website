import React from 'react';
import { Search, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { ToolCategory } from '../types';

interface SeoToolIndexProps {
  onOpenTool: (toolId: string) => void;
  onSelectCategory: (cat: ToolCategory) => void;
}

export const SeoToolIndex: React.FC<SeoToolIndexProps> = ({ onOpenTool, onSelectCategory }) => {
  const keywordClusters = [
    {
      title: 'Trending PDF Tools (Rank #1 Searched)',
      keywords: [
        { label: 'Edit PDF Online (MS Word Style)', toolId: 'edit-pdf' },
        { label: 'Merge PDF Files Free', toolId: 'pdf-merger' },
        { label: 'Split PDF Pages', toolId: 'pdf-splitter' },
        { label: 'Compress PDF to 100KB', toolId: 'pdf-compressor' },
        { label: 'Convert Photos to PDF', toolId: 'image-to-pdf' },
        { label: 'Sign PDF Document Online', toolId: 'edit-pdf' },
        { label: 'Add Watermark to PDF', toolId: 'edit-pdf' },
        { label: 'PDF to Word Converter', toolId: 'edit-pdf' },
      ],
    },
    {
      title: 'High-Demand Image Converters & Compressors',
      keywords: [
        { label: 'Compress JPEG without Losing Quality', toolId: 'image-compressor' },
        { label: 'PNG to JPG Converter', toolId: 'image-converter' },
        { label: 'JPG to PNG Transparent', toolId: 'image-converter' },
        { label: 'JPG to WEBP Fast', toolId: 'image-converter' },
        { label: 'Compress PNG to 50KB', toolId: 'image-compressor' },
        { label: 'ICO Favicon Generator', toolId: 'image-converter' },
        { label: 'Resize Image Dimensions', toolId: 'image-compressor' },
        { label: 'Convert Image to PDF Free', toolId: 'image-to-pdf' },
      ],
    },
    {
      title: 'Audio, Video & Media Converters',
      keywords: [
        { label: 'Convert MP4 to MP3 Online', toolId: 'video-to-audio' },
        { label: 'Extract Audio from Video', toolId: 'video-to-audio' },
        { label: 'WebM to WAV Converter', toolId: 'video-to-audio' },
        { label: 'MOV to MP3 Extractor', toolId: 'video-to-audio' },
        { label: 'Lossless Studio WAV Audio', toolId: 'video-to-audio' },
        { label: 'Video Sound Track Extractor', toolId: 'video-to-audio' },
      ],
    },
    {
      title: 'Data, Document & Developer Formats',
      keywords: [
        { label: 'JSON to CSV Spreadsheet Converter', toolId: 'json-csv' },
        { label: 'CSV to JSON Array Converter', toolId: 'json-csv' },
        { label: 'Markdown to HTML Styled Document', toolId: 'markdown-html' },
        { label: 'Base64 Image & File Encoder', toolId: 'base64-converter' },
        { label: 'Batch ZIP File Archiver', toolId: 'zip-archiver' },
      ],
    },
  ];

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SEO Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 mb-8 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>OmniSearch Index Directory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Universal Search Engine for All File Conversion Tools
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Direct access to every converter, compression engine, and editor built into OmniConvert.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            <span>100% Free • No Sign-Up • No Server Wait</span>
          </div>
        </div>

        {/* Keyword Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {keywordClusters.map((cluster, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {cluster.title}
              </h3>
              <ul className="space-y-1.5">
                {cluster.keywords.map((kw, kIdx) => (
                  <li key={kIdx}>
                    <button
                      onClick={() => onOpenTool(kw.toolId)}
                      className="text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-left transition-colors flex items-center gap-1 group py-0.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-500 transition-colors"></span>
                      <span>{kw.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Long-Tail SEO Semantic Description (For Search Engine Crawlers & Top Google Rankings) */}
        <div className="mt-12 p-6 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            About OmniConvert by Archit Bishnoi
          </h4>
          <p>
            OmniConvert is the leading all-in-one free online file converter, document compressor, and MS Word-style PDF editor.
            Engineered by full-stack developer Archit Bishnoi, this platform offers powerful client-side tools to convert, edit, and compress PDF documents, JPEG/PNG/WebP photos, MP4/WebM videos to MP3 audio, and tabular JSON/CSV data.
            All processing executes entirely in your browser using secure HTML5 Canvas, WebAssembly, Web Audio API, and PDF-Lib. Your files are never uploaded to any remote servers, providing 100% data confidentiality, zero file size limits, and instant conversions without queue delays.
          </p>
        </div>

      </div>
    </section>
  );
};
