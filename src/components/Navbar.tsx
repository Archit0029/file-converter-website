import React, { useState } from 'react';
import { 
  FileStack, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Zap, 
  Sparkles,
  ChevronDown,
  FileEdit,
  Mail,
  Github,
  Linkedin,
  Instagram,
  Facebook,
  Globe,
  ExternalLink
} from 'lucide-react';
import { ToolCategory } from '../types';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onSelectCategory: (cat: ToolCategory) => void;
  onOpenTool: (toolId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  onSelectCategory,
  onOpenTool,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [devMenuOpen, setDevMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectCategory('all')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <FileStack className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 dark:from-white dark:via-indigo-200 dark:to-indigo-400 bg-clip-text text-transparent">
                  OmniConvert
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
                Developed by <span className="text-indigo-600 dark:text-indigo-400 font-bold">Archit Bishnoi</span>
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => onSelectCategory('all')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              All Tools
            </button>
            <button
              onClick={() => onOpenTool('edit-pdf')}
              className="px-3 py-1.5 rounded-lg text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Edit PDF</span>
              <span className="text-[9px] bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 px-1 py-0.2 rounded font-extrabold uppercase">Word Mode</span>
            </button>
            <button
              onClick={() => onSelectCategory('image')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Images
            </button>
            <button
              onClick={() => onSelectCategory('pdf')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              PDF Tools
            </button>
            <button
              onClick={() => onSelectCategory('compressor')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Compressors
            </button>
            <button
              onClick={() => onSelectCategory('audio')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Audio & Video
            </button>

            {/* Quick Tools Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Actions</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div 
                  className="absolute left-0 mt-2 w-56 rounded-xl glass-card shadow-2xl p-2 z-50 border border-slate-200 dark:border-slate-800"
                  onClick={() => setMenuOpen(false)}
                >
                  <button 
                    onClick={() => onOpenTool('edit-pdf')}
                    className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-between"
                  >
                    <span>Edit PDF (MS Word Style)</span>
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-600 px-1.5 py-0.5 rounded">Hot</span>
                  </button>
                  <button 
                    onClick={() => onOpenTool('image-compressor')}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/70 text-slate-800 dark:text-slate-200 flex items-center justify-between"
                  >
                    <span>Smart Image Compressor</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 px-1.5 py-0.5 rounded">High Ratio</span>
                  </button>
                  <button 
                    onClick={() => onOpenTool('pdf-merger')}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/70 text-slate-800 dark:text-slate-200 flex items-center justify-between"
                  >
                    <span>Merge PDFs</span>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 px-1.5 py-0.5 rounded">Hot</span>
                  </button>
                  <button 
                    onClick={() => onOpenTool('image-to-pdf')}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/70 text-slate-800 dark:text-slate-200"
                  >
                    Photos to PDF
                  </button>
                  <button 
                    onClick={() => onOpenTool('video-to-audio')}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/70 text-slate-800 dark:text-slate-200"
                  >
                    Video to Audio (MP3/WAV)
                  </button>
                  <button 
                    onClick={() => onOpenTool('json-csv')}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/70 text-slate-800 dark:text-slate-200"
                  >
                    JSON ↔ CSV Converter
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            
            {/* Developer Contact & Social Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDevMenuOpen(!devMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all"
                title="Archit Bishnoi's Developer Profile & Social Links"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                  AB
                </div>
                <span className="hidden sm:inline">Archit Bishnoi</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {devMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-2xl glass-card shadow-2xl p-3 z-50 border border-slate-200 dark:border-slate-800 text-xs"
                  onClick={() => setDevMenuOpen(false)}
                >
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <p className="font-bold text-slate-900 dark:text-white">Archit Bishnoi</p>
                    <p className="text-[11px] text-slate-500">Full-Stack Software Engineer & Creator</p>
                  </div>

                  <a
                    href="mailto:architbishnoi177@gmail.com"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-rose-500" />
                    <span className="truncate">architbishnoi177@gmail.com</span>
                  </a>

                  <a
                    href="https://github.com/Archit0029"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Github className="w-4 h-4 text-slate-800 dark:text-slate-100" />
                      <span>GitHub (@Archit0029)</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href="https://linkedin.com/in/archit-29bishnoi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Linkedin className="w-4 h-4 text-blue-600" />
                      <span>LinkedIn</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href="https://instagram.com/archit_bishnoi029"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Instagram className="w-4 h-4 text-pink-500" />
                      <span>Instagram (@archit_bishnoi029)</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href="https://www.facebook.com/p/Archit-Bishnoi-100069997237028/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Facebook className="w-4 h-4 text-blue-500" />
                      <span>Facebook</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href="https://architbishnoi-portfolio.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-emerald-500" />
                      <span>Portfolio Website</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Convert Now CTA */}
            <button
              onClick={() => {
                const dropzone = document.getElementById('hero-dropzone');
                if (dropzone) dropzone.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Convert Now</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
