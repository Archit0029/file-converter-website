import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Bold, 
  Italic, 
  Image as ImageIcon, 
  PenTool, 
  Stamp, 
  Eraser, 
  Highlighter, 
  UploadCloud, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Type, 
  Trash2, 
  Move, 
  Sparkles,
  Check,
  RotateCcw,
  Square,
  Pipette,
  Paintbrush,
  Copy,
  ClipboardPaste
} from 'lucide-react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { downloadBlob, formatBytes } from '../../utils/formatHelpers';
import confetti from 'canvas-confetti';

interface PdfEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type EditorTab = 'text' | 'insert' | 'draw' | 'watermark';
type EyedropperTarget = 'text' | 'background' | null;

export interface TextTheme {
  fontFamily: string;
  fontSize: number; // in pt
  isBold: boolean;
  isItalic: boolean;
  color: string;
  backgroundColor: string;
}

export interface EditablePdfText {
  id: string;
  page: number;
  text: string;
  originalText: string;
  // Native PDF coordinates (points) - Zoom invariant!
  pdfX: number;
  pdfY: number; // baseline in PDF points
  pdfWidth: number;
  pdfHeight: number;
  pdfFontSize: number;
  // Original coordinates for whiteout
  originalPdfX: number;
  originalPdfY: number;
  originalPdfWidth: number;
  originalPdfHeight: number;
  // Movement offsets in PDF points
  offsetX: number;
  offsetY: number;
  // Typography & Colors
  fontFamily: string;
  color: string;
  backgroundColor: string; // Background / mask color (default '#ffffff')
  isBold: boolean;
  isItalic: boolean;
  // Status flags
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

export interface WhiteoutBoxItem {
  id: string;
  page: number;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  color?: string;
}

interface ImageStampItem {
  id: string;
  page: number;
  dataUrl: string;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const PdfEditorModal: React.FC<PdfEditorModalProps> = ({ isOpen, onClose }) => {
  // File state - stored as Uint8Array so it is NEVER detached by Web Workers!
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.25);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);

  // Native page dimensions in PDF points
  const [pageDimensions, setPageDimensions] = useState<Record<number, { width: number; height: number }>>({});

  // Extracted editable text blocks per page
  const [pageTextMap, setPageTextMap] = useState<Record<number, EditablePdfText[]>>({});
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  // Whiteout boxes per page
  const [whiteoutBoxes, setWhiteoutBoxes] = useState<WhiteoutBoxItem[]>([]);
  const [selectedWhiteoutId, setSelectedWhiteoutId] = useState<string | null>(null);

  // Ribbon formatting state
  const [activeTab, setActiveTab] = useState<EditorTab>('text');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(11);
  const [textColor, setTextColor] = useState('#0f172a');
  const [textBgColor, setTextBgColor] = useState('#ffffff');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  // Text Theme Copy / Pick state (Format Painter)
  const [copiedTheme, setCopiedTheme] = useState<TextTheme | null>(null);
  const [isThemePickerActive, setIsThemePickerActive] = useState<boolean>(false);
  const [themePickerTargetId, setThemePickerTargetId] = useState<string | null>(null);

  // Eyedropper / Color Picker from PDF state
  const [eyedropperTarget, setEyedropperTarget] = useState<EyedropperTarget>(null);
  const [hoverSampledColor, setHoverSampledColor] = useState<string | null>(null);
  const [hoverSampledPos, setHoverSampledPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Stamps & Watermark
  const [imageStamps, setImageStamps] = useState<ImageStampItem[]>([]);
  const [watermarkText, setWatermarkText] = useState('');

  // Drawing state
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [penColor, setPenColor] = useState('#dc2626');
  const [penWidth, setPenWidth] = useState(3);
  const [isHighlighter, setIsHighlighter] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  // Dragging state
  const dragRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialOffsetX: number;
    initialOffsetY: number;
    itemId: string;
  } | null>(null);

  // References
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);

  // Signature refs
  const isSigDrawing = useRef(false);
  const sigLastX = useRef(0);
  const sigLastY = useRef(0);

  // Reset modal when closed
  useEffect(() => {
    if (!isOpen) {
      setPdfFile(null);
      setPdfBytes(null);
      setPageTextMap({});
      setWhiteoutBoxes([]);
      setImageStamps([]);
      setWatermarkText('');
      setCurrentPage(1);
      setSelectedTextId(null);
      setSelectedWhiteoutId(null);
      setPageDimensions({});
      setEyedropperTarget(null);
      setIsThemePickerActive(false);
      setThemePickerTargetId(null);
      setCopiedTheme(null);
    }
  }, [isOpen]);

  // Handle Escape key to cancel eyedropper or theme picker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (eyedropperTarget) {
          setEyedropperTarget(null);
          setHoverSampledColor(null);
        }
        if (isThemePickerActive) {
          setIsThemePickerActive(false);
          setThemePickerTargetId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [eyedropperTarget, isThemePickerActive]);

  // Handle PDF file upload
  const handlePdfUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && !file.type.includes('pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }

    setIsLoadingPdf(true);
    try {
      const buffer = await file.arrayBuffer();
      // Store a persistent Uint8Array copy so it is never detached
      const safeMasterBytes = new Uint8Array(buffer);

      // Make a fresh slice copy for initial page count inspection
      const tempBuffer = safeMasterBytes.slice(0).buffer;
      const pdfDoc = await PDFDocument.load(tempBuffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      // Collect dimensions for all pages in PDF points
      const dims: Record<number, { width: number; height: number }> = {};
      const pages = pdfDoc.getPages();
      pages.forEach((p, idx) => {
        const { width, height } = p.getSize();
        dims[idx + 1] = { width, height };
      });

      setPdfFile(file);
      setPdfBytes(safeMasterBytes);
      setTotalPages(count);
      setCurrentPage(1);
      setPageDimensions(dims);
      setPageTextMap({});
      setWhiteoutBoxes([]);
      setImageStamps([]);
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    } catch (err: any) {
      alert('Error loading PDF: ' + (err.message || 'File may be corrupted or encrypted.'));
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Render current PDF page and extract existing text with exact font styles
  const renderCurrentPage = useCallback(async () => {
    if (!pdfBytes) return;

    try {
      const pdfjs = (window as any).pdfjsLib;
      if (!pdfjs || !pdfCanvasRef.current) return;

      // CRITICAL: Slice the buffer so PDF.js Web Worker does NOT detach our master copy!
      const workerBytes = new Uint8Array(pdfBytes.slice(0).buffer);
      const loadingTask = pdfjs.getDocument({ data: workerBytes });
      const doc = await loadingTask.promise;
      const page = await doc.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoomScale });

      // Record native unscaled page dimensions
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const pageHeightPt = unscaledViewport.height;
      const pageWidthPt = unscaledViewport.width;

      setPageDimensions((prev) => ({
        ...prev,
        [currentPage]: { width: pageWidthPt, height: pageHeightPt },
      }));

      const canvas = pdfCanvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
      }

      if (drawCanvasRef.current) {
        drawCanvasRef.current.width = viewport.width;
        drawCanvasRef.current.height = viewport.height;
      }

      // If text hasn't been extracted for this page yet, extract and group it
      if (!pageTextMap[currentPage]) {
        setIsExtractingText(true);
        const textContent = await page.getTextContent();
        const rawItems = textContent.items;
        const styles = textContent.styles || {};

        const mappedItems: EditablePdfText[] = rawItems
          .map((item: any, idx: number) => {
            const tx = item.transform; // [scaleX, skewY, skewX, scaleY, tx, ty]
            const pdfX = tx[4];
            const pdfY = tx[5];
            const rawHeight = Math.abs(tx[3]) || item.height || 11;

            // Detect font family, bold, and italic from PDF.js style dictionary
            const fontObj = styles[item.fontName] || {};
            const fontNameLower = (item.fontName || '').toLowerCase() + ' ' + (fontObj.fontFamily || '').toLowerCase();

            let detectedFamily = 'Arial';
            if (fontObj.isMonospace || /mono|courier|consolas|typewriter/i.test(fontNameLower)) {
              detectedFamily = 'Courier New';
            } else if (fontObj.isSerif || /times|serif|roman|georgia|cambria/i.test(fontNameLower)) {
              detectedFamily = 'Times New Roman';
            }

            const isItemBold = /bold|black|heavy|medium|demi|b(?=[0-9]|$)/i.test(fontNameLower);
            const isItemItalic = /italic|oblique|i(?=[0-9]|$)/i.test(fontNameLower);
            const itemFontSize = Math.round(rawHeight * 10) / 10;
            const pdfWidth = item.width || Math.max(10, itemFontSize * (item.str.length * 0.55));

            return {
              id: `p${currentPage}-${idx}`,
              page: currentPage,
              text: item.str,
              originalText: item.str,
              pdfX,
              pdfY,
              pdfWidth,
              pdfHeight: rawHeight,
              pdfFontSize: itemFontSize,
              originalPdfX: pdfX,
              originalPdfY: pdfY,
              originalPdfWidth: pdfWidth,
              originalPdfHeight: rawHeight,
              offsetX: 0,
              offsetY: 0,
              fontFamily: detectedFamily,
              color: '#0f172a',
              backgroundColor: '#ffffff',
              isBold: isItemBold,
              isItalic: isItemItalic,
            };
          })
          .filter((it: EditablePdfText) => it.text.trim().length > 0);

        // Sort items naturally: top to bottom, then left to right
        const sortedItems = [...mappedItems].sort((a, b) => {
          if (Math.abs(a.pdfY - b.pdfY) > 4) {
            return b.pdfY - a.pdfY; // Top to bottom in PDF space
          }
          return a.pdfX - b.pdfX;
        });

        // Group text fragments on the same line into natural words/phrases
        const groupedLines: EditablePdfText[] = [];
        let currentLine: EditablePdfText | null = null;

        for (const item of sortedItems) {
          if (!currentLine) {
            currentLine = { ...item };
          } else if (
            Math.abs(item.pdfY - currentLine.pdfY) < 3.0 &&
            item.pdfX - (currentLine.pdfX + currentLine.pdfWidth) < 14 &&
            item.pdfX >= currentLine.pdfX
          ) {
            const needsSpace =
              !currentLine.text.endsWith(' ') &&
              !item.text.startsWith(' ') &&
              item.pdfX - (currentLine.pdfX + currentLine.pdfWidth) > 1.5;

            currentLine.text += (needsSpace ? ' ' : '') + item.text;
            currentLine.originalText = currentLine.text;
            currentLine.pdfWidth = (item.pdfX + item.pdfWidth) - currentLine.pdfX;
            currentLine.originalPdfWidth = currentLine.pdfWidth;
          } else {
            groupedLines.push(currentLine);
            currentLine = { ...item };
          }
        }
        if (currentLine) {
          groupedLines.push(currentLine);
        }

        setPageTextMap((prev) => ({
          ...prev,
          [currentPage]: groupedLines,
        }));
        setIsExtractingText(false);
      }
    } catch (err) {
      console.warn('PDF Page Render/Text extraction error:', err);
      setIsExtractingText(false);
    }
  }, [pdfBytes, currentPage, zoomScale, pageTextMap]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Current page dimensions
  const curPageDims = pageDimensions[currentPage] || { width: 595, height: 842 };
  const pageHeight = curPageDims.height;

  // Current page text elements
  const currentTexts = pageTextMap[currentPage] || [];
  const selectedText = currentTexts.find((t) => t.id === selectedTextId);

  // Sync toolbar when text is selected
  useEffect(() => {
    if (selectedText) {
      setFontFamily(selectedText.fontFamily);
      setFontSize(selectedText.pdfFontSize);
      setTextColor(selectedText.color);
      setTextBgColor(selectedText.backgroundColor || '#ffffff');
      setIsBold(selectedText.isBold);
      setIsItalic(selectedText.isItalic);
    }
  }, [selectedTextId, selectedText]);

  // Update text item properties
  const updateCurrentPageText = (id: string, updates: Partial<EditablePdfText>) => {
    setPageTextMap((prev) => {
      const pageList = prev[currentPage] || [];
      return {
        ...prev,
        [currentPage]: pageList.map((item) =>
          item.id === id ? { ...item, ...updates, isModified: true } : item
        ),
      };
    });
  };

  // Copy theme from currently selected text
  const copyCurrentTheme = () => {
    if (!selectedText) {
      alert('Please select a text block first to copy its theme.');
      return;
    }
    const theme: TextTheme = {
      fontFamily: selectedText.fontFamily,
      fontSize: selectedText.pdfFontSize,
      isBold: selectedText.isBold,
      isItalic: selectedText.isItalic,
      color: selectedText.color,
      backgroundColor: selectedText.backgroundColor || '#ffffff',
    };
    setCopiedTheme(theme);
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.6 } });
  };

  // Paste copied theme to currently selected text
  const pasteThemeToSelected = () => {
    if (!copiedTheme) {
      alert('No theme copied yet. Click "Pick Theme from PDF" or select a text and click "Copy Theme".');
      return;
    }
    if (!selectedTextId) {
      alert('Please select a text block to apply the copied theme to.');
      return;
    }

    updateCurrentPageText(selectedTextId, {
      fontFamily: copiedTheme.fontFamily,
      pdfFontSize: copiedTheme.fontSize,
      isBold: copiedTheme.isBold,
      isItalic: copiedTheme.isItalic,
      color: copiedTheme.color,
      backgroundColor: copiedTheme.backgroundColor,
      isModified: true,
    });
    setFontFamily(copiedTheme.fontFamily);
    setFontSize(copiedTheme.fontSize);
    setIsBold(copiedTheme.isBold);
    setIsItalic(copiedTheme.isItalic);
    setTextColor(copiedTheme.color);
    setTextBgColor(copiedTheme.backgroundColor);
    confetti({ particleCount: 25, spread: 45, origin: { y: 0.6 } });
  };

  // Start Format Painter (Pick Theme from PDF): Click any text in PDF to copy its complete style
  const startThemePicker = (targetItemId?: string) => {
    setThemePickerTargetId(targetItemId || selectedTextId || null);
    setIsThemePickerActive(true);
    setEyedropperTarget(null);
  };

  // Handle clicking a text item while Theme Picker is active
  const handleItemThemePick = (sourceItem: EditablePdfText) => {
    const picked: TextTheme = {
      fontFamily: sourceItem.fontFamily,
      fontSize: sourceItem.pdfFontSize,
      isBold: sourceItem.isBold,
      isItalic: sourceItem.isItalic,
      color: sourceItem.color,
      backgroundColor: sourceItem.backgroundColor || '#ffffff',
    };

    setCopiedTheme(picked);
    setFontFamily(picked.fontFamily);
    setFontSize(picked.fontSize);
    setIsBold(picked.isBold);
    setIsItalic(picked.isItalic);
    setTextColor(picked.color);
    setTextBgColor(picked.backgroundColor);

    // If an edited text was designated as the target, immediately apply this picked theme!
    if (themePickerTargetId) {
      updateCurrentPageText(themePickerTargetId, {
        fontFamily: picked.fontFamily,
        pdfFontSize: picked.fontSize,
        isBold: picked.isBold,
        isItalic: picked.isItalic,
        color: picked.color,
        backgroundColor: picked.backgroundColor,
        isModified: true,
      });
      setSelectedTextId(themePickerTargetId);
    }

    setIsThemePickerActive(false);
    setThemePickerTargetId(null);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
  };

  // Eyedropper: Apply sampled color to either text or background
  const applyPickedColor = (hex: string, target: EyedropperTarget) => {
    if (target === 'text') {
      setTextColor(hex);
      if (selectedTextId) {
        updateCurrentPageText(selectedTextId, { color: hex });
      }
    } else if (target === 'background') {
      setTextBgColor(hex);
      if (selectedTextId) {
        updateCurrentPageText(selectedTextId, { backgroundColor: hex });
      }
      if (selectedWhiteoutId) {
        setWhiteoutBoxes((prev) =>
          prev.map((b) => (b.id === selectedWhiteoutId ? { ...b, color: hex } : b))
        );
      }
    }
    setEyedropperTarget(null);
    setHoverSampledColor(null);
  };

  // Launch Eyedropper: Try native browser EyeDropper API first, fall back to canvas sampling
  const startColorPicking = async (target: 'text' | 'background') => {
    setIsThemePickerActive(false);
    if (typeof window !== 'undefined' && (window as any).EyeDropper) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          applyPickedColor(result.sRGBHex, target);
          return;
        }
      } catch {
        // User cancelled or pressed escape
      }
    }
    // Canvas sampler fallback
    setEyedropperTarget(target);
  };

  // Canvas hover: Sample pixel color underneath mouse
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!eyedropperTarget || !pdfCanvasRef.current) return;
    const rect = pdfCanvasRef.current.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    if (x >= 0 && x < pdfCanvasRef.current.width && y >= 0 && y < pdfCanvasRef.current.height) {
      const ctx = pdfCanvasRef.current.getContext('2d');
      if (ctx) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
        setHoverSampledColor(hex);
        setHoverSampledPos({ x: e.clientX, y: e.clientY });
      }
    }
  };

  // Canvas click: Apply sampled color
  const handleCanvasClickToSample = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!eyedropperTarget || !pdfCanvasRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const rect = pdfCanvasRef.current.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    if (x >= 0 && x < pdfCanvasRef.current.width && y >= 0 && y < pdfCanvasRef.current.height) {
      const ctx = pdfCanvasRef.current.getContext('2d');
      if (ctx) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
        applyPickedColor(hex, eyedropperTarget);
      }
    }
  };

  // Add brand new text box
  const addNewTextBox = (customPdfX?: number, customPdfY?: number) => {
    const newId = `custom-${Math.random().toString(36).substring(2, 9)}`;
    const posX = customPdfX !== undefined ? customPdfX : 72;
    const posY = customPdfY !== undefined ? customPdfY : pageHeight - 120;

    const newBox: EditablePdfText = {
      id: newId,
      page: currentPage,
      text: 'Click here to edit text...',
      originalText: '',
      pdfX: posX,
      pdfY: posY,
      pdfWidth: 160,
      pdfHeight: 18,
      pdfFontSize: fontSize,
      originalPdfX: posX,
      originalPdfY: posY,
      originalPdfWidth: 160,
      originalPdfHeight: 18,
      offsetX: 0,
      offsetY: 0,
      fontFamily,
      color: textColor,
      backgroundColor: textBgColor,
      isBold,
      isItalic,
      isNew: true,
      isModified: true,
    };

    setPageTextMap((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newBox],
    }));
    setSelectedTextId(newId);
  };

  // Add a whiteout rectangle mask to erase any part of the PDF
  const addWhiteoutBox = () => {
    const newId = `whiteout-${Math.random().toString(36).substring(2, 9)}`;
    const newBox: WhiteoutBoxItem = {
      id: newId,
      page: currentPage,
      pdfX: 72,
      pdfY: pageHeight - 150,
      pdfWidth: 180,
      pdfHeight: 36,
      color: textBgColor || '#ffffff',
    };
    setWhiteoutBoxes((prev) => [...prev, newBox]);
    setSelectedWhiteoutId(newId);
  };

  // Delete text block (whites it out from the PDF)
  const deleteTextBlock = (id: string) => {
    setPageTextMap((prev) => {
      const pageList = prev[currentPage] || [];
      return {
        ...prev,
        [currentPage]: pageList.map((item) =>
          item.id === id ? { ...item, isDeleted: true, isModified: true } : item
        ),
      };
    });
    if (selectedTextId === id) setSelectedTextId(null);
  };

  // Reset all edits on current page
  const resetCurrentPageEdits = () => {
    if (window.confirm('Reset all changes on this page back to original?')) {
      setPageTextMap((prev) => {
        const copy = { ...prev };
        delete copy[currentPage];
        return copy;
      });
      setWhiteoutBoxes((prev) => prev.filter((b) => b.page !== currentPage));
      setSelectedTextId(null);
      setSelectedWhiteoutId(null);
      clearDrawingLayer();
    }
  };

  // Drag text box around the PDF (operates in zoom-invariant PDF points)
  const handleDragStart = (e: React.MouseEvent, item: EditablePdfText) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedTextId(item.id);

    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialOffsetX: item.offsetX,
      initialOffsetY: item.offsetY,
      itemId: item.id,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return;
      const deltaScreenX = moveEvent.clientX - dragRef.current.startX;
      const deltaScreenY = moveEvent.clientY - dragRef.current.startY;

      const deltaPdfX = deltaScreenX / zoomScale;
      const deltaPdfY = -deltaScreenY / zoomScale;

      const newOffsetX = dragRef.current.initialOffsetX + deltaPdfX;
      const newOffsetY = dragRef.current.initialOffsetY + deltaPdfY;

      updateCurrentPageText(dragRef.current.itemId, {
        offsetX: Math.round(newOffsetX),
        offsetY: Math.round(newOffsetY),
        isModified: true,
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Freehand Pen / Highlighter Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawMode || eyedropperTarget || isThemePickerActive) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    isDrawing.current = true;
    lastX.current = e.clientX - rect.left;
    lastY.current = e.clientY - rect.top;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !isDrawMode || eyedropperTarget || isThemePickerActive) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX.current, lastY.current);
    ctx.lineTo(curX, curY);

    if (isHighlighter) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth * 4;
      ctx.lineCap = 'square';
    } else {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.stroke();
    lastX.current = curX;
    lastY.current = curY;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearDrawingLayer = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Signature Pad Handlers
  const startSigDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    isSigDrawing.current = true;
    sigLastX.current = e.clientX - rect.left;
    sigLastY.current = e.clientY - rect.top;
  };

  const sigDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSigDrawing.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(sigLastX.current, sigLastY.current);
    ctx.lineTo(curX, curY);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    sigLastX.current = curX;
    sigLastY.current = curY;
  };

  const stopSigDrawing = () => {
    isSigDrawing.current = false;
  };

  const clearSig = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const applySignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    setImageStamps((prev) => [
      ...prev,
      {
        id: `sig-${Date.now()}`,
        page: currentPage,
        dataUrl,
        pdfX: 72,
        pdfY: pageHeight - 200,
        pdfWidth: 160,
        pdfHeight: 64,
      },
    ]);
    setShowSignaturePad(false);
    clearSig();
  };

  // Insert image file as stamp
  const handleInsertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageStamps((prev) => [
        ...prev,
        {
          id: `img-${Date.now()}`,
          page: currentPage,
          dataUrl,
          pdfX: 72,
          pdfY: pageHeight - 220,
          pdfWidth: 140,
          pdfHeight: 100,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  // Save and export edited PDF cleanly with zero detached buffer errors!
  const exportEditedPdf = async () => {
    if (!pdfBytes) {
      alert('Please upload a PDF document first.');
      return;
    }

    try {
      // CRITICAL: Slice master Uint8Array to create a clean, fresh buffer copy for pdf-lib
      const exportBuffer = pdfBytes.slice(0).buffer;
      const pdfDoc = await PDFDocument.load(exportBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      // Embed standard PDF fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
      const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

      const getTargetFont = (family: string, bold: boolean) => {
        const fam = (family || '').toLowerCase();
        if (fam.includes('times') || fam.includes('serif') || fam.includes('roman') || fam.includes('georgia')) {
          return bold ? timesBold : timesFont;
        }
        if (fam.includes('courier') || fam.includes('mono')) {
          return bold ? courierBold : courierFont;
        }
        return bold ? helveticaBold : helveticaFont;
      };

      // 1. Watermark Stamp
      if (watermarkText.trim()) {
        for (const page of pages) {
          const { width, height } = page.getSize();
          const wFontSize = Math.min(width, height) / 9;
          const textW = helveticaBold.widthOfTextAtSize(watermarkText.toUpperCase(), wFontSize);
          page.drawText(watermarkText.toUpperCase(), {
            x: width / 2 - textW / 2,
            y: height / 2,
            size: wFontSize,
            font: helveticaBold,
            color: rgb(0.75, 0.75, 0.75),
            opacity: 0.28,
            rotate: degrees(45),
          });
        }
      }

      // 2. Whiteout Boxes (User-drawn redactions)
      for (const box of whiteoutBoxes) {
        if (box.page <= pages.length) {
          const page = pages[box.page - 1];
          let boxR = 1, boxG = 1, boxB = 1;
          const bg = box.color || '#ffffff';
          if (bg.startsWith('#') && bg.length === 7) {
            boxR = parseInt(bg.substring(1, 3), 16) / 255;
            boxG = parseInt(bg.substring(3, 5), 16) / 255;
            boxB = parseInt(bg.substring(5, 7), 16) / 255;
          }
          page.drawRectangle({
            x: box.pdfX,
            y: box.pdfY,
            width: box.pdfWidth,
            height: box.pdfHeight,
            color: rgb(boxR, boxG, boxB),
          });
        }
      }

      // 3. Apply text edits and movements across all pages
      for (let pNum = 1; pNum <= pages.length; pNum++) {
        const pageItems = pageTextMap[pNum] || [];
        const page = pages[pNum - 1];

        for (const item of pageItems) {
          // If deleted or modified/moved, white out the original text position with the sampled/chosen background color
          if (!item.isNew && (item.isDeleted || item.isModified)) {
            let maskR = 1, maskG = 1, maskB = 1;
            const bg = item.backgroundColor || '#ffffff';
            if (bg.startsWith('#') && bg.length === 7) {
              maskR = parseInt(bg.substring(1, 3), 16) / 255;
              maskG = parseInt(bg.substring(3, 5), 16) / 255;
              maskB = parseInt(bg.substring(5, 7), 16) / 255;
            }

            page.drawRectangle({
              x: Math.max(0, item.originalPdfX - 1),
              y: Math.max(0, item.originalPdfY - (item.pdfFontSize * 0.22)),
              width: item.originalPdfWidth + 2,
              height: item.pdfFontSize * 1.18,
              color: rgb(maskR, maskG, maskB), // Custom sampled background color
            });
          }

          // If not deleted and modified/new, draw the updated text at target location
          if (!item.isDeleted && (item.isNew || item.isModified || item.text !== item.originalText)) {
            const drawPdfX = item.pdfX + item.offsetX;
            const drawPdfY = item.pdfY + item.offsetY;

            let r = 0.06, g = 0.09, b = 0.16;
            if (item.color.startsWith('#') && item.color.length === 7) {
              r = parseInt(item.color.substring(1, 3), 16) / 255;
              g = parseInt(item.color.substring(3, 5), 16) / 255;
              b = parseInt(item.color.substring(5, 7), 16) / 255;
            }

            // If the text was moved and has a background color, draw background rectangle behind the new position too
            if (item.backgroundColor && (item.offsetX !== 0 || item.offsetY !== 0)) {
              let bgR = 1, bgG = 1, bgB = 1;
              if (item.backgroundColor.startsWith('#') && item.backgroundColor.length === 7) {
                bgR = parseInt(item.backgroundColor.substring(1, 3), 16) / 255;
                bgG = parseInt(item.backgroundColor.substring(3, 5), 16) / 255;
                bgB = parseInt(item.backgroundColor.substring(5, 7), 16) / 255;
              }
              page.drawRectangle({
                x: Math.max(0, drawPdfX - 1),
                y: Math.max(0, drawPdfY - (item.pdfFontSize * 0.22)),
                width: item.pdfWidth + 2,
                height: item.pdfFontSize * 1.18,
                color: rgb(bgR, bgG, bgB),
              });
            }

            const font = getTargetFont(item.fontFamily, item.isBold);

            // Strip unencodable characters to guarantee zero WinAnsi errors
            const safeText = item.text.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');

            page.drawText(safeText, {
              x: Math.max(5, drawPdfX),
              y: Math.max(5, drawPdfY),
              size: item.pdfFontSize,
              font,
              color: rgb(r, g, b),
            });
          }
        }
      }

      // 4. Burn Image Stamps & Signatures
      for (const stamp of imageStamps) {
        if (stamp.page <= pages.length) {
          const targetPage = pages[stamp.page - 1];
          const pngBuffer = await fetch(stamp.dataUrl).then((r) => r.arrayBuffer());
          const embeddedPng = await pdfDoc.embedPng(pngBuffer);

          targetPage.drawImage(embeddedPng, {
            x: stamp.pdfX,
            y: stamp.pdfY,
            width: stamp.pdfWidth,
            height: stamp.pdfHeight,
          });
        }
      }

      // 5. Burn Drawing Canvas
      const drawCanvas = drawCanvasRef.current;
      if (drawCanvas && currentPage <= pages.length) {
        const drawDataUrl = drawCanvas.toDataURL('image/png');
        if (drawDataUrl.length > 2000) {
          const pngBuffer = await fetch(drawDataUrl).then((r) => r.arrayBuffer());
          const embeddedDrawing = await pdfDoc.embedPng(pngBuffer);
          const targetPage = pages[currentPage - 1];
          const { width, height } = targetPage.getSize();

          targetPage.drawImage(embeddedDrawing, {
            x: 0,
            y: 0,
            width,
            height,
          });
        }
      }

      const savedBytes = await pdfDoc.save();
      const baseName = (pdfFile?.name || 'document').replace(/\.[^/.]+$/, '');
      downloadBlob(new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' }), `${baseName}_edited.pdf`);
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      alert('Error exporting edited PDF: ' + (err.message || 'Unknown export error'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-md flex flex-col justify-between overflow-hidden">
      
      {/* 1. INITIAL STATE: PROMPT USER TO UPLOAD PDF */}
      {!pdfFile ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl max-w-xl w-full p-8 text-center shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-rose-500/25 mb-5">
              <FileText className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Upload PDF Document to Edit
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Open any existing PDF to <strong className="text-slate-800 dark:text-slate-200 font-semibold">click and edit text</strong> directly inside the document, match font & colors, copy/pick text themes from the PDF, add signatures, and stamp watermarks.
            </p>

            <div className="mt-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 hover:border-rose-500 transition-colors bg-slate-50/50 dark:bg-slate-900/40">
              <input
                type="file"
                id="edit-pdf-file-picker"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => e.target.files && e.target.files[0] && handlePdfUpload(e.target.files[0])}
              />
              <label htmlFor="edit-pdf-file-picker" className="cursor-pointer block">
                <UploadCloud className="w-10 h-10 text-rose-500 mx-auto mb-3 animate-bounce-subtle" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isLoadingPdf ? 'Reading PDF Structure...' : 'Drag & Drop PDF or Click to Browse'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Contracts, application forms, resumes, manuals, invoices</p>
                <button
                  type="button"
                  className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all"
                >
                  Choose PDF File
                </button>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Clean in-place text editing & movement • 100% private in-browser</span>
            </div>
          </div>
        </div>
      ) : (
        /* 2. REAL PDF EDITOR WORKSPACE */
        <>
          {/* Top Ribbon Toolbar */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-md flex-shrink-0 z-20">
            
            {/* Document Header & Navigation */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
                  PDF
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                  {pdfFile.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                  {formatBytes(pdfFile.size)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                
                {/* Page Navigation */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      setSelectedTextId(null);
                    }}
                    disabled={currentPage === 1}
                    className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold px-1 text-slate-700 dark:text-slate-200">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      setSelectedTextId(null);
                    }}
                    disabled={currentPage === totalPages}
                    className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Zoom */}
                <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                  <button
                    onClick={() => setZoomScale((z) => Math.max(0.8, z - 0.2))}
                    className="p-0.5 text-slate-500 hover:text-slate-900"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1">{Math.round(zoomScale * 100)}%</span>
                  <button
                    onClick={() => setZoomScale((z) => Math.min(2.0, z + 0.2))}
                    className="p-0.5 text-slate-500 hover:text-slate-900"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Reset current page */}
                <button
                  onClick={resetCurrentPageEdits}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                  title="Reset edits on this page"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Page</span>
                </button>

                {/* Change PDF */}
                <button
                  onClick={() => setPdfFile(null)}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Change PDF
                </button>

                {/* Save and Download PDF */}
                <button
                  onClick={exportEditedPdf}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Edited PDF</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Word-Style Ribbon Tabs */}
            <div className="flex items-center px-4 gap-1 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
              <button
                onClick={() => { setActiveTab('text'); setIsDrawMode(false); }}
                className={`px-4 py-1.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'text' && !isDrawMode
                    ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Text & Typography
              </button>
              <button
                onClick={() => { setActiveTab('insert'); setIsDrawMode(false); }}
                className={`px-4 py-1.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'insert'
                    ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Insert Elements
              </button>
              <button
                onClick={() => { setActiveTab('draw'); setIsDrawMode(true); }}
                className={`px-4 py-1.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'draw' || isDrawMode
                    ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Draw & Annotate
              </button>
              <button
                onClick={() => { setActiveTab('watermark'); setIsDrawMode(false); }}
                className={`px-4 py-1.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'watermark'
                    ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Watermark Stamp
              </button>
            </div>

            {/* Sub-toolbar Controls */}
            <div className="p-2 px-4 flex items-center gap-3 overflow-x-auto min-h-[52px]">
              
              {/* TAB 1: EDIT & MOVE TEXT */}
              {activeTab === 'text' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => addNewTextBox()}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>+ Add New Text</span>
                  </button>

                  <button
                    onClick={addWhiteoutBox}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700"
                    title="Add a whiteout box to cover/erase any section of the PDF"
                  >
                    <Square className="w-3.5 h-3.5 text-slate-500 fill-white" />
                    <span>+ Whiteout Mask</span>
                  </button>

                  <div className="h-5 w-px bg-slate-200 dark:border-slate-700 mx-1"></div>

                  {/* Font Family */}
                  <select
                    value={fontFamily}
                    onChange={(e) => {
                      setFontFamily(e.target.value);
                      if (selectedTextId) updateCurrentPageText(selectedTextId, { fontFamily: e.target.value });
                    }}
                    className="text-xs py-1 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Arial">Arial (Sans-serif)</option>
                    <option value="Times New Roman">Times New Roman (Serif)</option>
                    <option value="Courier New">Courier New (Monospace)</option>
                  </select>

                  {/* Font Size */}
                  <select
                    value={fontSize}
                    onChange={(e) => {
                      const sz = Number(e.target.value);
                      setFontSize(sz);
                      if (selectedTextId) updateCurrentPageText(selectedTextId, { pdfFontSize: sz });
                    }}
                    className="text-xs py-1 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  >
                    <option value="8">8 pt</option>
                    <option value="9">9 pt</option>
                    <option value="10">10 pt</option>
                    <option value="11">11 pt</option>
                    <option value="12">12 pt</option>
                    <option value="14">14 pt</option>
                    <option value="16">16 pt</option>
                    <option value="18">18 pt</option>
                    <option value="22">22 pt</option>
                    <option value="28">28 pt</option>
                    <option value="36">36 pt</option>
                  </select>

                  {/* Bold & Italic */}
                  <button
                    onClick={() => {
                      setIsBold(!isBold);
                      if (selectedTextId) updateCurrentPageText(selectedTextId, { isBold: !isBold });
                    }}
                    className={`p-1.5 rounded ${isBold ? 'bg-slate-200 dark:bg-slate-700 text-rose-600' : 'hover:bg-slate-100'} font-bold`}
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsItalic(!isItalic);
                      if (selectedTextId) updateCurrentPageText(selectedTextId, { isItalic: !isItalic });
                    }}
                    className={`p-1.5 rounded ${isItalic ? 'bg-slate-200 dark:bg-slate-700 text-rose-600' : 'hover:bg-slate-100'} italic`}
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-5 w-px bg-slate-200 dark:border-slate-700 mx-1"></div>

                  {/* 1. TEXT COLOR PICKER + PDF COLOR PICKER */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Text:</span>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => {
                        setTextColor(e.target.value);
                        if (selectedTextId) updateCurrentPageText(selectedTextId, { color: e.target.value });
                      }}
                      className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                      title="Choose custom text color"
                    />
                    {/* Quick swatches */}
                    <div className="hidden xl:flex items-center gap-1">
                      {['#000000', '#0f172a', '#1e3a8a', '#991b1b', '#065f46'].map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setTextColor(c);
                            if (selectedTextId) updateCurrentPageText(selectedTextId, { color: c });
                          }}
                          style={{ backgroundColor: c }}
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 hover:scale-125 transition-transform"
                          title={`Color ${c}`}
                        />
                      ))}
                    </div>
                    {/* Eyedropper for Text */}
                    <button
                      onClick={() => startColorPicking('text')}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                        eyedropperTarget === 'text'
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                      }`}
                      title="Pick text color directly from PDF"
                    >
                      <Pipette className="w-3 h-3" />
                      <span className="hidden sm:inline">Pick from PDF</span>
                    </button>
                  </div>

                  {/* 2. BACKGROUND COLOR PICKER + PDF COLOR PICKER */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Background:</span>
                    <input
                      type="color"
                      value={textBgColor}
                      onChange={(e) => {
                        setTextBgColor(e.target.value);
                        if (selectedTextId) updateCurrentPageText(selectedTextId, { backgroundColor: e.target.value });
                        if (selectedWhiteoutId) {
                          setWhiteoutBoxes((prev) =>
                            prev.map((b) => (b.id === selectedWhiteoutId ? { ...b, color: e.target.value } : b))
                          );
                        }
                      }}
                      className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                      title="Choose background / mask color"
                    />
                    {/* Quick background swatches */}
                    <div className="hidden xl:flex items-center gap-1">
                      {['#ffffff', '#f8fafc', '#fefce8', '#f1f5f9'].map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setTextBgColor(c);
                            if (selectedTextId) updateCurrentPageText(selectedTextId, { backgroundColor: c });
                          }}
                          style={{ backgroundColor: c }}
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 hover:scale-125 transition-transform"
                          title={`Background ${c}`}
                        />
                      ))}
                    </div>
                    {/* Eyedropper for Background */}
                    <button
                      onClick={() => startColorPicking('background')}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                        eyedropperTarget === 'background'
                          ? 'bg-rose-600 text-white'
                          : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                      title="Pick background color directly from PDF canvas"
                    >
                      <Pipette className="w-3 h-3" />
                      <span className="hidden sm:inline">Pick from PDF</span>
                    </button>
                  </div>

                  <div className="h-5 w-px bg-slate-200 dark:border-slate-700 mx-1"></div>

                  {/* 3. TEXT THEME MATCHER / FORMAT PAINTER (PICK & COPY THEME) */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Theme:</span>
                    
                    {/* Pick Theme from PDF (Format Painter) */}
                    <button
                      onClick={() => startThemePicker()}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                        isThemePickerActive
                          ? 'bg-purple-600 text-white shadow animate-pulse'
                          : 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 hover:bg-purple-100 border border-purple-200 dark:border-purple-800'
                      }`}
                      title="Pick entire text theme (font, size, style, color, background) from any text on the PDF"
                    >
                      <Paintbrush className="w-3 h-3" />
                      <span>{isThemePickerActive ? 'Click Text to Copy' : 'Pick Theme from PDF'}</span>
                    </button>

                    {/* Copy Theme */}
                    <button
                      onClick={copyCurrentTheme}
                      disabled={!selectedTextId}
                      className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 flex items-center gap-0.5"
                      title="Copy styling theme of currently selected text"
                    >
                      <Copy className="w-3 h-3" />
                      <span className="hidden sm:inline">Copy</span>
                    </button>

                    {/* Paste Theme */}
                    <button
                      onClick={pasteThemeToSelected}
                      disabled={!copiedTheme || !selectedTextId}
                      className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-40 flex items-center gap-0.5"
                      title={copiedTheme ? `Paste theme: ${copiedTheme.fontFamily} ${copiedTheme.fontSize}pt` : 'Copy a theme first to paste'}
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      <span className="hidden sm:inline">Paste</span>
                    </button>

                    {copiedTheme && (
                      <span className="hidden 2xl:inline-block text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        {copiedTheme.fontFamily} {copiedTheme.fontSize}pt {copiedTheme.isBold ? 'B' : ''}
                      </span>
                    )}
                  </div>

                  {selectedTextId && (
                    <button
                      onClick={() => deleteTextBlock(selectedTextId)}
                      className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg flex items-center gap-1 border border-rose-200 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Selected</span>
                    </button>
                  )}
                </div>
              )}

              {/* TAB 2: INSERT ELEMENTS */}
              {activeTab === 'insert' && (
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleInsertImage}
                    />
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Insert Photo / Stamp</span>
                  </label>

                  <button
                    onClick={() => setShowSignaturePad(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                  >
                    <PenTool className="w-3.5 h-3.5 text-purple-500" />
                    <span>Draw & Stamp Signature</span>
                  </button>

                  <button
                    onClick={() => {
                      const now = new Date().toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      });
                      const newId = `date-${Date.now()}`;
                      const newBox: EditablePdfText = {
                        id: newId,
                        page: currentPage,
                        text: `Date: ${now}`,
                        originalText: '',
                        pdfX: 72,
                        pdfY: pageHeight - 140,
                        pdfWidth: 140,
                        pdfHeight: 18,
                        pdfFontSize: 11,
                        originalPdfX: 72,
                        originalPdfY: pageHeight - 140,
                        originalPdfWidth: 140,
                        originalPdfHeight: 18,
                        offsetX: 0,
                        offsetY: 0,
                        fontFamily: 'Arial',
                        color: '#0f172a',
                        backgroundColor: '#ffffff',
                        isBold: false,
                        isItalic: false,
                        isNew: true,
                        isModified: true,
                      };
                      setPageTextMap((prev) => ({
                        ...prev,
                        [currentPage]: [...(prev[currentPage] || []), newBox],
                      }));
                      setSelectedTextId(newId);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                  >
                    <Stamp className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Add Today's Date</span>
                  </button>
                </div>
              )}

              {/* TAB 3: DRAW & ANNOTATE */}
              {(activeTab === 'draw' || isDrawMode) && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Annotation Pen Active</span>
                  </span>

                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                      onClick={() => setIsHighlighter(false)}
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        !isHighlighter ? 'bg-white dark:bg-slate-900 shadow-sm text-rose-600' : 'text-slate-600'
                      }`}
                    >
                      Solid Pen
                    </button>
                    <button
                      onClick={() => setIsHighlighter(true)}
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        isHighlighter ? 'bg-white dark:bg-slate-900 shadow-sm text-amber-600' : 'text-slate-600'
                      }`}
                    >
                      Marker / Highlighter
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold">Color:</span>
                    <input
                      type="color"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold">Width:</span>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={penWidth}
                      onChange={(e) => setPenWidth(Number(e.target.value))}
                      className="w-20 accent-rose-600"
                    />
                    <span className="text-xs font-mono">{penWidth}px</span>
                  </div>

                  <button
                    onClick={clearDrawingLayer}
                    className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950 text-rose-600 text-xs font-semibold flex items-center gap-1 hover:bg-rose-100"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Clear Drawings</span>
                  </button>
                </div>
              )}

              {/* TAB 4: WATERMARK */}
              {activeTab === 'watermark' && (
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold">Diagonal Stamp:</span>
                    <input
                      type="text"
                      placeholder="e.g. APPROVED, CONFIDENTIAL"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="text-xs py-1 px-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-52"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {['APPROVED', 'CONFIDENTIAL', 'DRAFT'].map((stampText) => (
                      <button
                        key={stampText}
                        onClick={() => setWatermarkText(stampText)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      >
                        {stampText}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Active Eyedropper Banner */}
          {eyedropperTarget && (
            <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-inner animate-pulse">
              <div className="flex items-center gap-2">
                <Pipette className="w-4 h-4 animate-bounce" />
                <span>
                  Click anywhere on the PDF to pick the{' '}
                  <strong className="underline uppercase tracking-wide">
                    {eyedropperTarget === 'background' ? 'Background / Mask' : 'Text'} Color
                  </strong>
                </span>
              </div>
              <button
                onClick={() => {
                  setEyedropperTarget(null);
                  setHoverSampledColor(null);
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-0.5 rounded text-xs transition-colors"
              >
                Cancel (Esc)
              </button>
            </div>
          )}

          {/* Active Theme Picker (Format Painter) Banner */}
          {isThemePickerActive && (
            <div className="bg-purple-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-inner animate-pulse">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-4 h-4 animate-bounce" />
                <span>
                  <strong>Format Painter Active:</strong> Click on ANY text block in the document to copy its exact Font, Size, Bold/Style, Text Color & Background!
                </span>
              </div>
              <button
                onClick={() => {
                  setIsThemePickerActive(false);
                  setThemePickerTargetId(null);
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-0.5 rounded text-xs transition-colors"
              >
                Cancel (Esc)
              </button>
            </div>
          )}

          {/* Helper Banner */}
          {!eyedropperTarget && !isThemePickerActive && (
            <div className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 px-4 py-1.5 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>
                  <strong>Click any text to edit</strong> • Use <strong>Pick Theme from PDF</strong> to copy exact font & styling from any line • Double-click to add new text!
                </span>
              </div>
              {isExtractingText && (
                <span className="text-[11px] font-semibold flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                  Indexing PDF text elements...
                </span>
              )}
            </div>
          )}

          {/* MAIN PDF CANVAS & INTERACTIVE EDIT LAYER */}
          <div 
            onClick={() => {
              if (!eyedropperTarget && !isThemePickerActive) {
                setSelectedTextId(null);
                setSelectedWhiteoutId(null);
              }
            }}
            onMouseMove={handleCanvasMouseMove}
            className={`flex-1 overflow-auto p-6 sm:p-10 flex justify-center bg-slate-200 dark:bg-slate-950/80 ${
              eyedropperTarget ? 'cursor-crosshair' : isThemePickerActive ? 'cursor-cell' : ''
            }`}
          >
            <div 
              onClick={handleCanvasClickToSample}
              onDoubleClick={(e) => {
                if (eyedropperTarget || isThemePickerActive) return;
                if (e.target === pdfCanvasRef.current || (e.target as HTMLElement).tagName === 'CANVAS') {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const clickScreenX = e.clientX - rect.left;
                  const clickScreenY = e.clientY - rect.top;
                  const clickPdfX = clickScreenX / zoomScale;
                  const clickPdfY = pageHeight - (clickScreenY / zoomScale);
                  addNewTextBox(Math.round(clickPdfX), Math.round(clickPdfY));
                }
              }}
              className="relative shadow-2xl bg-white transition-all select-none border border-slate-300 dark:border-slate-800"
            >
              
              {/* PDF Background Canvas (User's crisp original PDF page) */}
              <canvas
                ref={pdfCanvasRef}
                className="block max-w-none"
              />

              {/* Freehand Drawing Overlay */}
              <canvas
                ref={drawCanvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className={`absolute inset-0 z-10 ${
                  isDrawMode && !eyedropperTarget && !isThemePickerActive ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
                }`}
              />

              {/* Watermark Preview Overlay */}
              {watermarkText.trim() && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
                  <span className="text-slate-400 text-6xl sm:text-7xl font-extrabold uppercase -rotate-45 tracking-widest opacity-25">
                    {watermarkText}
                  </span>
                </div>
              )}

              {/* 
                1. SOLID WHITEOUT MASK FOR MODIFIED, MOVED, OR DELETED ORIGINAL TEXT:
                Uses item's chosen or sampled backgroundColor so it blends seamlessly into tinted cells or banners!
              */}
              {currentTexts
                .filter((item) => !item.isNew && (item.isDeleted || item.isModified || selectedTextId === item.id))
                .map((item) => {
                  const maskLeft = Math.round(item.originalPdfX * zoomScale) - 1;
                  const maskTop = Math.round((pageHeight - item.originalPdfY) * zoomScale) - Math.round(item.pdfFontSize * zoomScale * 0.78);
                  const maskWidth = Math.round(item.originalPdfWidth * zoomScale) + 3;
                  const maskHeight = Math.round(item.pdfFontSize * zoomScale * 1.15);

                  return (
                    <div
                      key={`mask-${item.id}`}
                      style={{
                        left: `${maskLeft}px`,
                        top: `${maskTop}px`,
                        width: `${maskWidth}px`,
                        height: `${maskHeight}px`,
                        backgroundColor: item.backgroundColor || '#ffffff',
                      }}
                      className="absolute z-10 pointer-events-none"
                    />
                  );
                })}

              {/* 
                2. USER-DRAWN WHITEOUT REDACTION BOXES:
              */}
              {whiteoutBoxes
                .filter((box) => box.page === currentPage)
                .map((box) => {
                  const boxLeft = Math.round(box.pdfX * zoomScale);
                  const boxTop = Math.round((pageHeight - box.pdfY - box.pdfHeight) * zoomScale);
                  const boxWidth = Math.round(box.pdfWidth * zoomScale);
                  const boxHeight = Math.round(box.pdfHeight * zoomScale);
                  const isSelected = selectedWhiteoutId === box.id;

                  return (
                    <div
                      key={box.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWhiteoutId(box.id);
                      }}
                      style={{
                        left: `${boxLeft}px`,
                        top: `${boxTop}px`,
                        width: `${boxWidth}px`,
                        height: `${boxHeight}px`,
                        backgroundColor: box.color || '#ffffff',
                      }}
                      className={`absolute z-15 border ${
                        isSelected ? 'border-dashed border-rose-500 shadow-md' : 'border-transparent'
                      } cursor-pointer group`}
                    >
                      {isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWhiteoutBoxes((prev) => prev.filter((b) => b.id !== box.id));
                            setSelectedWhiteoutId(null);
                          }}
                          className="absolute -top-3 -right-3 bg-rose-600 text-white rounded-full p-1 shadow hover:bg-rose-700"
                          title="Remove Whiteout Mask"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}

              {/* 
                3. INTERACTIVE MOVABLE & EDITABLE TEXT BLOCKS:
                - Unselected & unedited items are 100% TRANSPARENT so they DO NOT show duplicate text over canvas!
                - On hover: A clean dashed outline highlights the clickable area.
                - When edited but unselected: Renders with NO border, NO rounded corners, and NO shadow so it looks 100% natural!
                - When Theme Picker is active: Hovering highlights with purple border to pick style.
                - When clicked/active: Shows an active blue ring and floating Word-style toolbar with color pickers, theme pickers and eyedroppers!
              */}
              {currentTexts
                .filter((item) => !item.isDeleted)
                .map((item) => {
                  const isSelected = selectedTextId === item.id;
                  const isVisibleText = isSelected || item.isModified || item.isNew;

                  // Dynamic screen coordinates from zoom-invariant PDF points
                  const screenX = Math.round((item.pdfX + item.offsetX) * zoomScale);
                  const screenY = Math.round((pageHeight - (item.pdfY + item.offsetY)) * zoomScale) - Math.round(item.pdfFontSize * zoomScale * 0.78);
                  const screenWidth = Math.max(16, Math.round(item.pdfWidth * zoomScale));
                  const screenHeight = Math.max(14, Math.round(item.pdfFontSize * zoomScale * 1.15));

                  return (
                    <div
                      key={item.id}
                      style={{
                        left: `${screenX}px`,
                        top: `${screenY}px`,
                        minWidth: `${screenWidth}px`,
                        minHeight: `${screenHeight}px`,
                        backgroundColor: isVisibleText ? (item.backgroundColor || '#ffffff') : 'transparent',
                      }}
                      onClick={(e) => {
                        if (eyedropperTarget) return;
                        if (isThemePickerActive) {
                          e.stopPropagation();
                          handleItemThemePick(item);
                          return;
                        }
                        e.stopPropagation();
                        setSelectedTextId(item.id);
                      }}
                      className={`absolute z-20 ${
                        isThemePickerActive
                          ? 'hover:outline hover:outline-2 hover:outline-purple-500 hover:bg-purple-100/30 cursor-pointer rounded-sm'
                          : isSelected
                          ? 'ring-2 ring-indigo-600 shadow-xl z-30 rounded-sm'
                          : isVisibleText
                          ? 'border-none ring-0 shadow-none rounded-none'
                          : 'hover:outline hover:outline-1 hover:outline-dashed hover:outline-indigo-400 hover:bg-indigo-50/10 cursor-pointer'
                      }`}
                    >
                      {/* Floating Handle & Word-style Actions: ONLY shown when actively selected! */}
                      {isSelected && !eyedropperTarget && !isThemePickerActive && (
                        <div 
                          className={`absolute ${
                            screenY < 45 ? 'top-full mt-2' : '-top-9'
                          } left-0 flex items-center gap-1.5 bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded-lg shadow-xl select-none z-40 whitespace-nowrap`}
                        >
                          {/* Drag to move */}
                          <div
                            onMouseDown={(e) => handleDragStart(e, item)}
                            className="cursor-grab active:cursor-grabbing flex items-center gap-1 font-bold text-slate-100 hover:text-indigo-400 py-0.5 px-1 rounded hover:bg-slate-800 transition-colors"
                            title="Click and drag to move this text anywhere on the page"
                          >
                            <Move className="w-3.5 h-3.5" />
                            <span>Move</span>
                          </div>

                          <div className="h-3 w-px bg-slate-700 mx-0.5"></div>

                          {/* Quick Font Size */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newSize = Math.max(7, item.pdfFontSize - 0.5);
                              updateCurrentPageText(item.id, { pdfFontSize: newSize });
                            }}
                            className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                            title="Decrease Font Size"
                          >
                            A-
                          </button>
                          <span className="text-[10px] font-mono font-bold text-slate-200">
                            {item.pdfFontSize}pt
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newSize = Math.min(72, item.pdfFontSize + 0.5);
                              updateCurrentPageText(item.id, { pdfFontSize: newSize });
                            }}
                            className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                            title="Increase Font Size"
                          >
                            A+
                          </button>

                          <div className="h-3 w-px bg-slate-700 mx-0.5"></div>

                          {/* Text Color In Floating Handle */}
                          <div className="flex items-center gap-1" title="Change text color">
                            <span className="text-[10px] text-slate-400">T:</span>
                            <input
                              type="color"
                              value={item.color}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateCurrentPageText(item.id, { color: e.target.value });
                                setTextColor(e.target.value);
                              }}
                              className="w-4 h-4 rounded cursor-pointer border-0 p-0"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startColorPicking('text');
                              }}
                              className="text-indigo-400 hover:text-indigo-300 p-0.5"
                              title="Pick text color from PDF"
                            >
                              <Pipette className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="h-3 w-px bg-slate-700 mx-0.5"></div>

                          {/* Background Color In Floating Handle */}
                          <div className="flex items-center gap-1" title="Change background / mask color">
                            <span className="text-[10px] text-slate-400">BG:</span>
                            <input
                              type="color"
                              value={item.backgroundColor || '#ffffff'}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateCurrentPageText(item.id, { backgroundColor: e.target.value });
                                setTextBgColor(e.target.value);
                              }}
                              className="w-4 h-4 rounded cursor-pointer border-0 p-0"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startColorPicking('background');
                              }}
                              className="text-rose-400 hover:text-rose-300 p-0.5"
                              title="Pick background color from PDF"
                            >
                              <Pipette className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="h-3 w-px bg-slate-700 mx-0.5"></div>

                          {/* Format Painter / Pick Theme in Floating Handle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startThemePicker(item.id);
                            }}
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-950/50 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors"
                            title="Format Painter: Click another line on the PDF to copy its exact font, size, and styling onto this text"
                          >
                            <Paintbrush className="w-3 h-3" />
                            <span>Match Style</span>
                          </button>

                          <div className="h-3 w-px bg-slate-700 mx-0.5"></div>

                          {/* Quick Delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTextBlock(item.id);
                            }}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors"
                            title="Erase / Delete this text from PDF"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>

                          {/* Done */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTextId(null);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 ml-1"
                            title="Finished editing"
                          >
                            <Check className="w-3 h-3" />
                            <span>Done</span>
                          </button>
                        </div>
                      )}

                      {/* Content editable text input */}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onFocus={() => setSelectedTextId(item.id)}
                        onBlur={(e) => {
                          const newText = e.currentTarget.innerText.trim();
                          if (newText !== item.text) {
                            const charRatio = item.isBold ? 0.62 : 0.52;
                            const newWidth = Math.max(item.pdfWidth, newText.length * item.pdfFontSize * charRatio);
                            updateCurrentPageText(item.id, { text: newText, pdfWidth: newWidth, isModified: true });
                          }
                        }}
                        onInput={(e) => {
                          const newText = e.currentTarget.innerText;
                          updateCurrentPageText(item.id, { text: newText, isModified: true });
                        }}
                        style={{
                          fontSize: `${item.pdfFontSize * zoomScale}px`,
                          fontFamily: item.fontFamily,
                          color: isVisibleText ? item.color : 'transparent',
                          fontWeight: item.isBold ? 700 : 400,
                          fontStyle: item.isItalic ? 'italic' : 'normal',
                          lineHeight: 1.0,
                        }}
                        className={`px-0 py-0 outline-none block min-w-[12px] whitespace-pre-wrap select-text ${
                          !isVisibleText ? 'select-none pointer-events-auto' : ''
                        }`}
                      >
                        {item.text}
                      </div>
                    </div>
                  );
                })}

              {/* Image Stamps & Signatures */}
              {imageStamps
                .filter((stamp) => stamp.page === currentPage)
                .map((stamp) => {
                  const stampLeft = Math.round(stamp.pdfX * zoomScale);
                  const stampTop = Math.round((pageHeight - stamp.pdfY - stamp.pdfHeight) * zoomScale);
                  const stampWidth = Math.round(stamp.pdfWidth * zoomScale);
                  const stampHeight = Math.round(stamp.pdfHeight * zoomScale);

                  return (
                    <div
                      key={stamp.id}
                      style={{
                        left: `${stampLeft}px`,
                        top: `${stampTop}px`,
                        width: `${stampWidth}px`,
                        height: `${stampHeight}px`,
                      }}
                      className="absolute z-20 group border border-dashed border-purple-500 p-1 bg-white/50 rounded cursor-move"
                    >
                      <button
                        onClick={() => setImageStamps((prev) => prev.filter((s) => s.id !== stamp.id))}
                        className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <img
                        src={stamp.dataUrl}
                        alt="stamp"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    </div>
                  );
                })}

            </div>
          </div>

          {/* Floating Eyedropper Magnifier / Color Badge Tooltip */}
          {eyedropperTarget && hoverSampledColor && (
            <div
              style={{
                left: `${hoverSampledPos.x + 16}px`,
                top: `${hoverSampledPos.y + 16}px`,
              }}
              className="fixed z-50 pointer-events-none bg-slate-900/95 text-white px-2.5 py-1.5 rounded-lg shadow-2xl border border-slate-700 flex items-center gap-2 backdrop-blur-sm select-none"
            >
              <div
                style={{ backgroundColor: hoverSampledColor }}
                className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
              />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-bold leading-tight">{hoverSampledColor}</span>
                <span className="text-[10px] text-slate-300 leading-tight">Click to pick color</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Signature Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-purple-600" />
              <span>Draw Your Signature</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Use your mouse or touchscreen to draw your signature:
            </p>

            <div className="mt-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950">
              <canvas
                ref={sigCanvasRef}
                width={400}
                height={160}
                onMouseDown={startSigDrawing}
                onMouseMove={sigDraw}
                onMouseUp={stopSigDrawing}
                onMouseLeave={stopSigDrawing}
                className="w-full h-40 cursor-crosshair"
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={clearSig}
                className="text-xs font-semibold text-rose-500 hover:underline"
              >
                Clear Signature
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSignaturePad(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={applySignature}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  Stamp on PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
