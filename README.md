# ⚡ OmniConvert (`file-converter-website`)
### Next-Generation All-in-One File Converter, Compressor & Word-Style PDF Editor

![OmniConvert Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=400&q=80)

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://omniconvert.vercel.app/)
[![Live Demo](https://img.shields.io/badge/Live_Site-omniconvert.vercel.app-success?style=for-the-badge&logo=vercel)](https://omniconvert.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-file--converter--website-181717?style=for-the-badge&logo=github)](https://github.com/Archit0029/file-converter-website)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 👨‍💻 Developer & Creator

| Name | **Archit Bishnoi** |
| :--- | :--- |
| 📧 **Email** | [architbishnoi177@gmail.com](mailto:architbishnoi177@gmail.com) |
| 🌐 **Portfolio** | [https://architbishnoi-portfolio.vercel.app/](https://architbishnoi-portfolio.vercel.app/) |
| 🐙 **GitHub** | [@Archit0029 (https://github.com/Archit0029)](https://github.com/Archit0029) |
| 💼 **LinkedIn** | [archit-29bishnoi (https://linkedin.com/in/archit-29bishnoi)](https://linkedin.com/in/archit-29bishnoi) |
| 📸 **Instagram** | [@archit_bishnoi029 (https://instagram.com/archit_bishnoi029)](https://instagram.com/archit_bishnoi029) |
| 📘 **Facebook** | [Archit Bishnoi Profile](https://www.facebook.com/p/Archit-Bishnoi-100069997237028/) |

---

## 📖 Project Overview

**OmniConvert** (`file-converter-website`) is an enterprise-grade, lightning-fast file conversion, compression, and document editing web platform engineered after top industry leaders like **FreeConvert.com**, **Convertio.co**, and **iLovePDF.com**.

Unlike conventional file converters that upload user files to remote servers, OmniConvert executes **100% of operations locally in the user's browser** using modern WebAssembly, HTML5 Canvas, Web Audio API, and PDF-Lib. This provides **zero server waiting queues**, **unlimited file sizes**, and **complete end-to-end data privacy**.

---

## ✨ Comprehensive Feature Matrix

### 1. 📝 MS Word-Style Interactive PDF Editor
- **Click-to-Edit In-Place Text**: Click any existing text block directly on your uploaded PDF to edit or replace text in real-time.
- **Text Theme Copy & Pick (Format Painter)**:
  - Click **"Pick Theme from PDF"** (paintbrush icon) and click any line in the document to automatically copy its exact font family, point size, bold/regular weight, text color, and background color.
  - One-click **Copy Theme** and **Paste Theme** buttons to duplicate styles across elements.
- **Eyedropper / Color Picker from PDF**:
  - Sample exact text ink colors or background paper colors directly from any pixel on the PDF canvas using browser eyedropper and `getImageData` sampling.
  - Eliminates mismatch on tinted paper, shaded table cells, or colored headers.
- **Invisible Seamless Blending**:
  - Zero visible borders, zero grey boxes, and zero drop shadows once editing is done.
  - Matches the exact baseline and layout of the original PDF document.
- **Whiteout / Redaction Tool**:
  - Add customizable whiteout masks over any old logo, seal, signature, date, or sensitive section to cleanly erase it.
- **Freehand Pen & Highlighter**:
  - Draw annotations, arrows, notes, and callouts with variable stroke widths and colors.
- **Digital Signature Stamp**:
  - Touchscreen and mouse signature drawing pad to create, preview, and stamp signatures onto contracts and application forms.
- **Watermarking**:
  - Stamp semi-transparent diagonal watermarks (e.g., `APPROVED`, `CONFIDENTIAL`, `DRAFT`).
- **Precision Export**:
  - Burn changes directly into standard vector PDF using `pdf-lib` with standard WinAnsi font embedding.

### 2. 🗂️ Universal Drag-and-Drop File Converter
- Multi-file dropzone with batch queue.
- Smart auto-detection of source format.
- Independent per-item target format selectors or bulk target format selection.
- One-click batch processing and ZIP archive export.

### 3. 🗜️ High-Performance Image Compressor (NanoFile / TinyPNG Style)
- Dynamic visual quality slider (10% to 100%).
- Dimension resizing (100%, 80%, 60%, 50%, or custom width/height).
- Real-time side-by-side file size and byte savings comparison.
- Formats: PNG, JPG, JPEG, WEBP.

### 4. 📄 PDF Power Toolkit (iLovePDF Style)
- **Merge PDF**: Select multiple PDF documents, visually reorder pages, and merge into a single PDF.
- **Split PDF**: Extract custom page ranges (e.g. `1-3, 5`) or burst all pages into individual PDFs packed into a ZIP archive.
- **Photos to PDF**: Combine multiple photos, receipts, or scans into a clean PDF with CMYK/progressive canvas fallback.

### 5. 🎵 Media & Extractor Suite
- **Video to Audio (MP3/WAV)**: Extracts audio from MP4, WebM, and MOV containers directly in-browser using Web Audio API decoding.

### 6. 💻 Developer & Data Converters
- **JSON ↔ CSV**: Bidirectional table data converter with automatic header parsing.
- **Markdown ↔ HTML**: Live preview and clean code export.
- **Base64 Encoder/Decoder**: Instant file-to-Data-URI and binary decoding.

---

## 🔒 100% Private & Zero-Knowledge Security

- **No Server Uploads**: Files never leave your device.
- **No Analytics Tracking on Data**: Your contracts, resumes, certificates, and photos remain strictly confidential.
- **Zero Bandwidth Costs**: Perfect for offline work or high-security environments.

---

## 🔍 SEO & Search Optimization Architecture

OmniConvert is designed for top search engine rankings on Google, Bing, and DuckDuckGo:
- **Schema.org Structured Data**: JSON-LD scripts for `WebApplication`, `SoftwareApplication`, `FAQPage`, and `Person` (Archit Bishnoi).
- **Social Tags**: OpenGraph and Twitter Card metadata for rich link previews.
- **Sitemap & Robots**: Standard `sitemap.xml` and `robots.txt` files located in `/public`.
- **High-Intent Long-Tail Index**: Comprehensive keyword directory targeting queries like "Edit PDF online without sign in", "Compress image to 100KB", "JPG to PDF converter", and "FreeConvert alternative".

---

## 🛠️ Technology Stack

- **Framework**: [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 5](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **PDF Engine**: [pdf-lib](https://pdf-lib.js.org/) + [PDF.js](https://mozilla.github.io/pdf.js/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Archive Tool**: [JSZip](https://stuk.github.io/jszip/) + [FileSaver](https://github.com/eligrey/FileSaver.js/)
- **Animations**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)

---

## 🚀 Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/Archit0029/file-converter-website.git
cd file-converter-website

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Production build
npm run build
npm run preview
```

---

## 🌐 Deploying to Vercel

### Method 1: Automatic Deployment via GitHub (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Click **Add New Project** and select your GitHub repository `Archit0029/file-converter-website`.
3. In **Project Name**, enter: `omniconvert` (this will automatically assign `https://omniconvert.vercel.app/`).
4. Vercel automatically detects **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Your site will be live on `https://omniconvert.vercel.app/` in under 60 seconds!

> **Note on Custom/Existing Domains**: If `omniconvert.vercel.app` is already reserved by someone globally on Vercel, you can set it to `omniconvert-app.vercel.app` or `omniconvert-archit.vercel.app` in your Vercel Project Settings > Domains.

### Method 2: Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## 📜 License & Copyright

Designed and built by **Archit Bishnoi** ([architbishnoi177@gmail.com](mailto:architbishnoi177@gmail.com)).  
All rights reserved © 2026.
