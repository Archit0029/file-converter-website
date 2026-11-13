import React from 'react';
import { POPULAR_CONVERSIONS } from '../utils/formatHelpers';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ToolCategory } from '../types';

interface QuickFormatMatrixProps {
  onSelectFlow: (from: string, to: string, category: ToolCategory) => void;
}

export const QuickFormatMatrix: React.FC<QuickFormatMatrixProps> = ({ onSelectFlow }) => {
  return (
    <section className="py-6 border-y border-slate-200/70 dark:border-slate-800/70 bg-slate-100/50 dark:bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Popular Quick Conversions & Workflows
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          {POPULAR_CONVERSIONS.map((item) => (
            <button
              key={item.label}
              onClick={() => onSelectFlow(item.from, item.to, item.category)}
              className="group flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm hover:shadow transition-all text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <span>{item.label}</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
