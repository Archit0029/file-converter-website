import React from 'react';
import { 
  FileStack, 
  Heart, 
  Shield, 
  Mail, 
  Github, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Globe, 
  ExternalLink,
  Sparkles,
  FileEdit
} from 'lucide-react';
import { ToolCategory } from '../types';

interface FooterProps {
  onSelectCategory: (cat: ToolCategory) => void;
  onOpenTool: (toolId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory, onOpenTool }) => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400">
      
      {/* Developer Spotlight Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-800/40 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-extrabold shadow-xl shadow-indigo-500/30 flex-shrink-0">
              AB
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h3 className="text-xl font-bold text-white">Developed by Archit Bishnoi</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Lead Developer
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                Passionate Full-Stack Software Engineer building high-speed, zero-knowledge browser applications and modern web platforms.
              </p>
            </div>
          </div>

          {/* Social Icons & Email */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <a
              href="mailto:architbishnoi177@gmail.com"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 border border-white/10 transition-all shadow-sm"
              title="Send an email to Archit Bishnoi"
            >
              <Mail className="w-4 h-4 text-rose-400" />
              <span>architbishnoi177@gmail.com</span>
            </a>

            <a
              href="https://github.com/Archit0029"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all hover:scale-105"
              title="GitHub Profile (@Archit0029)"
            >
              <Github className="w-4 h-4" />
            </a>

            <a
              href="https://linkedin.com/in/archit-29bishnoi"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all hover:scale-105"
              title="LinkedIn Profile (archit-29bishnoi)"
            >
              <Linkedin className="w-4 h-4 text-blue-400" />
            </a>

            <a
              href="https://instagram.com/archit_bishnoi029"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all hover:scale-105"
              title="Instagram Profile (@archit_bishnoi029)"
            >
              <Instagram className="w-4 h-4 text-pink-400" />
            </a>

            <a
              href="https://www.facebook.com/p/Archit-Bishnoi-100069997237028/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all hover:scale-105"
              title="Facebook Profile"
            >
              <Facebook className="w-4 h-4 text-blue-400" />
            </a>

            <a
              href="https://architbishnoi-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
              title="Personal Portfolio"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Portfolio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <FileStack className="w-4 h-4" />
              </div>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                OmniConvert
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              The high-performance, private file conversion and compression platform. 
              Convert images, edit and merge PDFs with MS Word-like controls, extract audio, and format code—all locally in your browser.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <Shield className="w-4 h-4" />
              <span>Zero-knowledge client-side processing • No server uploads</span>
            </div>
          </div>

          {/* Image & Compressor Tools */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Image & Media
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onOpenTool('image-compressor')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Smart Image Compressor
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('image-converter')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  PNG / JPG / WebP Converter
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('video-to-audio')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Video to Audio (MP3/WAV)
                </button>
              </li>
            </ul>
          </div>

          {/* PDF Suite */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              PDF Suite
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onOpenTool('edit-pdf')} className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <FileEdit className="w-3 h-3" />
                  <span>Edit PDF (MS Word Mode)</span>
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('pdf-merger')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Merge Multiple PDFs
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('image-to-pdf')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Photos to PDF
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('pdf-splitter')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Split & Extract Pages
                </button>
              </li>
            </ul>
          </div>

          {/* Data & Code */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Data & Code
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onOpenTool('json-csv')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  JSON ↔ CSV Converter
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('markdown-html')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Markdown to HTML
                </button>
              </li>
              <li>
                <button onClick={() => onOpenTool('base64-converter')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Base64 Tool
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © {new Date().getFullYear()} OmniConvert. Built with precision by{' '}
            <a 
              href="https://architbishnoi-portfolio.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Archit Bishnoi
            </a>.
          </p>
          <div className="flex items-center gap-1">
            <span>Designed for the modern web with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </div>
        </div>

      </div>
    </footer>
  );
};
