import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Are my confidential files uploaded or saved on your servers?',
      a: 'No! Unlike websites like FreeConvert or Convertio that upload your files to remote cloud servers, OmniConvert processes your files directly within your browser utilizing client-side WebAssembly, HTML5 Canvas, and modern Web APIs. Your documents, photos, and spreadsheets never leave your device.',
    },
    {
      q: 'Is OmniConvert completely free to use?',
      a: 'Yes, 100% free with no hidden fees, subscriptions, or credit card requirements. There are no daily conversion quotas or file size limits.',
    },
    {
      q: 'Which image and document formats are supported?',
      a: 'OmniConvert supports all major formats including PNG, JPG, JPEG, WEBP, AVIF, BMP, ICO, PDF, MP4, WebM, WAV, MP3, JSON, CSV, Markdown (MD), HTML, and ZIP archives.',
    },
    {
      q: 'How does the Smart Image Compressor reduce file size without losing quality?',
      a: 'Our compressor strips redundant metadata (EXIF, color profiles, camera tags) and uses advanced perceptual quantization to reduce file weight by up to 80% while retaining crisp visual fidelity.',
    },
    {
      q: 'Can I merge multiple PDFs and reorder pages?',
      a: 'Yes! Our Merge PDF tool lets you select any number of PDF files, rearrange their sequence using simple arrows, add an optional watermark, and merge them into a single consolidated document in seconds.',
    },
  ];

  return (
    <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Common Questions</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Everything you need to know about formats, privacy, and how our browser tools work.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-indigo-600' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
