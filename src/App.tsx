import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { QuickFormatMatrix } from './components/QuickFormatMatrix';
import { ToolCardGrid } from './components/ToolCardGrid';
import { FeatureHighlights } from './components/FeatureHighlights';
import { FAQSection } from './components/FAQSection';
import { SeoToolIndex } from './components/SeoToolIndex';
import { Footer } from './components/Footer';

// Modals
import { PdfEditorModal } from './components/modals/PdfEditorModal';
import { ImageCompressorModal } from './components/modals/ImageCompressorModal';
import { PdfMergerModal } from './components/modals/PdfMergerModal';
import { ImageToPdfModal } from './components/modals/ImageToPdfModal';
import { MediaExtractorModal } from './components/modals/MediaExtractorModal';
import { PdfSplitterModal } from './components/modals/PdfSplitterModal';
import { TextConverterModal } from './components/modals/TextConverterModal';
import { ToolCategory } from './types';

export function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [textModalMode, setTextModalMode] = useState<'json-csv' | 'markdown-html' | 'base64'>('json-csv');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    const hash = window.location.hash.replace(/^#/, '').toLowerCase();
    const target = path || hash;
    if (target) {
      handleOpenTool(target);
    }
  }, []);

  const handleOpenTool = (toolId: string) => {
    if (toolId === 'edit-pdf' || toolId === 'pdf-editor') {
      setActiveModal('edit-pdf');
    } else if (toolId === 'image-compressor' || toolId === 'compress-image') {
      setActiveModal('image-compressor');
    } else if (toolId === 'pdf-merger' || toolId === 'merge-pdf') {
      setActiveModal('pdf-merger');
    } else if (toolId === 'image-to-pdf') {
      setActiveModal('image-to-pdf');
    } else if (toolId === 'video-to-audio') {
      setActiveModal('video-to-audio');
    } else if (toolId === 'pdf-splitter') {
      setActiveModal('pdf-splitter');
    } else if (toolId === 'json-csv') {
      setTextModalMode('json-csv');
      setActiveModal('text-converter');
    } else if (toolId === 'markdown-html') {
      setTextModalMode('markdown-html');
      setActiveModal('text-converter');
    } else if (toolId === 'base64-converter') {
      setTextModalMode('base64');
      setActiveModal('text-converter');
    } else {
      // For general converters, scroll to hero dropzone
      const dropzone = document.getElementById('hero-dropzone');
      if (dropzone) {
        dropzone.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleSelectQuickFlow = (from: string, to: string, category: ToolCategory) => {
    if (from === 'EDIT' && to === 'PDF') {
      setActiveModal('edit-pdf');
    } else if (to === 'MERGE') {
      setActiveModal('pdf-merger');
    } else if (to === 'COMPRESS') {
      setActiveModal('image-compressor');
    } else if (to === 'PDF' && category === 'pdf') {
      setActiveModal('image-to-pdf');
    } else if (to === 'MP3') {
      setActiveModal('video-to-audio');
    } else if (to === 'CSV' || to === 'JSON') {
      setTextModalMode('json-csv');
      setActiveModal('text-converter');
    } else {
      setSelectedCategory(category);
      const dropzone = document.getElementById('hero-dropzone');
      if (dropzone) {
        dropzone.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Top Navigation */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const el = document.getElementById('tools-directory');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenTool={handleOpenTool}
      />

      {/* Hero with Universal Converter Dropzone */}
      <main>
        <HeroSection onOpenTool={handleOpenTool} />

        {/* Popular Conversions Quick Matrix */}
        <QuickFormatMatrix onSelectFlow={handleSelectQuickFlow} />

        {/* Comprehensive Card Directory of Tools */}
        <ToolCardGrid
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenTool={handleOpenTool}
        />

        {/* Architectural Pillars / Features */}
        <FeatureHighlights />

        {/* FAQs */}
        <FAQSection />

        {/* Long-tail SEO Keyword Search Index */}
        <SeoToolIndex
          onOpenTool={handleOpenTool}
          onSelectCategory={setSelectedCategory}
        />
      </main>

      {/* Footer */}
      <Footer
        onSelectCategory={setSelectedCategory}
        onOpenTool={handleOpenTool}
      />

      {/* Interactive Tool Workspaces / Modals */}
      <PdfEditorModal
        isOpen={activeModal === 'edit-pdf'}
        onClose={() => setActiveModal(null)}
      />

      <ImageCompressorModal
        isOpen={activeModal === 'image-compressor'}
        onClose={() => setActiveModal(null)}
      />

      <PdfMergerModal
        isOpen={activeModal === 'pdf-merger'}
        onClose={() => setActiveModal(null)}
      />

      <ImageToPdfModal
        isOpen={activeModal === 'image-to-pdf'}
        onClose={() => setActiveModal(null)}
      />

      <MediaExtractorModal
        isOpen={activeModal === 'video-to-audio'}
        onClose={() => setActiveModal(null)}
      />

      <PdfSplitterModal
        isOpen={activeModal === 'pdf-splitter'}
        onClose={() => setActiveModal(null)}
      />

      <TextConverterModal
        isOpen={activeModal === 'text-converter'}
        onClose={() => setActiveModal(null)}
        defaultMode={textModalMode}
      />

    </div>
  );
}

export default App;
