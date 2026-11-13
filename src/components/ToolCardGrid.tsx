import React, { useState } from 'react';
import { 
  Image, 
  Minimize2, 
  FileText, 
  Layers, 
  Scissors, 
  Shrink, 
  Volume2, 
  Music, 
  Code, 
  Table, 
  Binary, 
  Archive,
  FileEdit,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { ToolCategory, ToolDef } from '../types';
import { TOOLS_LIST } from '../utils/formatHelpers';

interface ToolCardGridProps {
  selectedCategory: ToolCategory;
  onSelectCategory: (cat: ToolCategory) => void;
  onOpenTool: (toolId: string) => void;
}

export const ToolCardGrid: React.FC<ToolCardGridProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenTool,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const iconMap: Record<string, React.FC<{ className?: string }>> = {
    Image,
    Minimize2,
    FileText,
    Layers,
    Scissors,
    Shrink,
    Volume2,
    Music,
    Code,
    Table,
    Binary,
    Archive,
    FileEdit,
  };

  const categories: Array<{ id: ToolCategory; label: string }> = [
    { id: 'all', label: 'All Tools' },
    { id: 'image', label: 'Image Tools' },
    { id: 'pdf', label: 'PDF Suite' },
    { id: 'compressor', label: 'Compressors' },
    { id: 'audio', label: 'Audio & Video' },
    { id: 'document', label: 'Data & Documents' },
  ];

  const filteredTools = TOOLS_LIST.filter((tool) => {
    const matchesCat =
      selectedCategory === 'all'
        ? true
        : tool.category === selectedCategory ||
          (selectedCategory === 'compressor' && tool.id.includes('compress'));

    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.fromFormats.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tool.toFormats.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesSearch;
  });

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="tools-directory">
      
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Dedicated Tool Suite</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Explore All File Conversion & Editing Tools
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Choose specialized utilities with tailored controls for each format type.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tools (e.g. compress, merge, csv, mp3)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-6 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-[1.02]'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredTools.map((tool) => {
          const IconComponent = iconMap[tool.iconName] || FileText;

          return (
            <div
              key={tool.id}
              onClick={() => onOpenTool(tool.id)}
              className="group relative rounded-2xl p-6 glass-card hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Card Header & Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/70 dark:to-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50 group-hover:scale-110 transition-transform">
                    <IconComponent className="w-6 h-6" />
                  </div>

                  {tool.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                      {tool.badge}
                    </span>
                  )}
                </div>

                {/* Name & Description */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tool.name}
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {tool.description}
                </p>
              </div>

              {/* Supported Formats & Action Indicator */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-1 overflow-hidden">
                  {tool.toFormats.slice(0, 3).map((fmt) => (
                    <span
                      key={fmt}
                      className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {fmt}
                    </span>
                  ))}
                  {tool.toFormats.length > 3 && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      +{tool.toFormats.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-16">
          <p className="text-base text-slate-500 dark:text-slate-400">
            No tools found matching "{searchQuery}".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              onSelectCategory('all');
            }}
            className="mt-3 text-sm font-semibold text-indigo-600 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

    </section>
  );
};
