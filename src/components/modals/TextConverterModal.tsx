import React, { useState } from 'react';
import { 
  X, 
  Code, 
  Copy, 
  Download, 
  Check, 
  ArrowRightLeft,
  FileText
} from 'lucide-react';
import { 
  convertJsonToCsv, 
  convertCsvToJson, 
  convertMarkdownToHtml, 
  fileToBase64 
} from '../../utils/documentTools';
import { downloadBlob } from '../../utils/formatHelpers';

interface TextConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'json-csv' | 'markdown-html' | 'base64';
}

export const TextConverterModal: React.FC<TextConverterModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'json-csv',
}) => {
  const [mode, setMode] = useState<'json-csv' | 'csv-json' | 'markdown-html' | 'base64-encode'>(
    defaultMode === 'markdown-html'
      ? 'markdown-html'
      : defaultMode === 'base64'
      ? 'base64-encode'
      : 'json-csv'
  );

  const [inputVal, setInputVal] = useState<string>('');
  const [outputVal, setOutputVal] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleConvert = () => {
    try {
      if (mode === 'json-csv') {
        setOutputVal(convertJsonToCsv(inputVal));
      } else if (mode === 'csv-json') {
        setOutputVal(convertCsvToJson(inputVal));
      } else if (mode === 'markdown-html') {
        setOutputVal(convertMarkdownToHtml(inputVal));
      } else if (mode === 'base64-encode') {
        setOutputVal(btoa(inputVal));
      }
    } catch (err: any) {
      setOutputVal('Error parsing data: ' + err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mode === 'base64-encode') {
      fileToBase64(file).then((b64) => {
        setOutputVal(b64);
        setInputVal(`[Loaded file: ${file.name} (${file.size} bytes)]`);
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setInputVal(reader.result as string);
    };
    reader.readAsText(file);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadResult = () => {
    let ext = 'txt';
    let mime = 'text/plain';

    if (mode === 'json-csv') {
      ext = 'csv';
      mime = 'text/csv';
    } else if (mode === 'csv-json') {
      ext = 'json';
      mime = 'application/json';
    } else if (mode === 'markdown-html') {
      ext = 'html';
      mime = 'text/html';
    }

    const blob = new Blob([outputVal], { type: mime });
    downloadBlob(blob, `converted_result.${ext}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Data & Code Formatter
              </h3>
              <p className="text-xs text-slate-500">
                Convert JSON, CSV, Markdown, and Base64 with live instant preview
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

        {/* Mode Selector Tabs */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setMode('json-csv')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'json-csv'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            JSON → CSV
          </button>
          <button
            onClick={() => setMode('csv-json')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'csv-json'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            CSV → JSON
          </button>
          <button
            onClick={() => setMode('markdown-html')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'markdown-html'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Markdown → HTML
          </button>
          <button
            onClick={() => setMode('base64-encode')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'base64-encode'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Base64 Encoder
          </button>
        </div>

        {/* Dual Editor Workspace */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Input Panel */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Source Input (paste text or choose file)
              </span>
              <label className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                Upload file
              </label>
            </div>
            <textarea
              rows={12}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Paste raw data or text here..."
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Output Panel */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Converted Output
              </span>
              {outputVal && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={downloadResult}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>
            <textarea
              rows={12}
              readOnly
              value={outputVal}
              placeholder="Converted output will appear here..."
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>

        </div>

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleConvert}
            disabled={!inputVal.trim()}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transform Data</span>
          </button>
        </div>

      </div>
    </div>
  );
};
