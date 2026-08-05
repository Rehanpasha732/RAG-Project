'use client';

import { useState } from 'react';
import { Copy, Check, Download, FileText, Clock, HardDrive } from 'lucide-react';
import clsx from 'clsx';

interface ExtractionResult {
  success: boolean;
  document: {
    id: string;
    originalName: string;
    fileName: string;
    mimetype: string;
    size: number;
    sizeFormatted: string;
    uploadedAt: string;
  };
  extracted: {
    text: string;
    textLength: number;
    pages: number;
    metadata: Record<string, unknown>;
  };
}

interface Props {
  result: ExtractionResult;
}

export default function ExtractedTextViewer({ result }: Props) {
  const [copied, setCopied] = useState(false);
  const { document: doc, extracted } = result;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(extracted.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([extracted.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.originalName.replace(/\.[^.]+$/, '')}_extracted.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  // Get first few lines for preview stats
  const lines = extracted.text.split('\n').filter(Boolean);
  const wordCount = extracted.text.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: FileText, label: 'File', value: doc.originalName },
          { icon: HardDrive, label: 'Size', value: doc.sizeFormatted },
          { icon: Clock, label: 'Uploaded', value: formatDate(doc.uploadedAt) },
          {
            label: 'Content',
            value: `${extracted.textLength.toLocaleString()} chars · ${wordCount.toLocaleString()} words · ${extracted.pages} pg · ${lines.length} lines`,
          },
        ].map((stat, i) => (
          <div key={i} className={clsx(
            'glass-card p-4',
            i === 3 && 'col-span-2 md:col-span-1'
          )}>
            <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
            <div className="font-medium text-sm truncate">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Text Viewer */}
      <div className="glass-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-gray-500 ml-3 font-mono">
              {doc.originalName}_extracted.txt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download .txt
            </button>
          </div>
        </div>

        {/* Text Content */}
        <div className="p-5 max-h-[500px] overflow-y-auto">
          {extracted.text.trim() ? (
            <pre className="font-mono text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
              {extracted.text}
            </pre>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No text could be extracted from this document.</p>
              <p className="text-sm mt-1">
                Try a different format or check if the file contains selectable text.
              </p>
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="px-5 py-2 border-t border-white/5 bg-white/[0.02] flex items-center justify-between text-xs text-gray-600">
          <span>
            {lines.length} lines · {wordCount.toLocaleString()} words
          </span>
          <span>{extracted.textLength.toLocaleString()} characters</span>
        </div>
      </div>
    </div>
  );
}
