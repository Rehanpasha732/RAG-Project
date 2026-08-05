'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  Upload,
  FileText,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  Copy,
  Check,
  Download,
  File,
  X,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import ParticlesBackground from '@/components/ParticlesBackground';
import ExtractedTextViewer from '@/components/ExtractedTextViewer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setDragActive(false);
      toast.success(`File selected: ${acceptedFiles[0].name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/tiff': ['.tiff', '.tif'],
    },
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data: ExtractionResult = await res.json();
      setResult(data);
      toast.success(`Text extracted: ${data.extracted.textLength.toLocaleString()} characters`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
  };

  const handleDragEnter = () => setDragActive(true);
  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) setDragActive(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* 3D Particles Background */}
      <ParticlesBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              DocXtract
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#upload"
              className="text-sm btn-primary py-2 px-4 !rounded-lg"
            >
              Try Now <ArrowRight className="inline w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-300 font-medium">
              AI-Powered Document Text Extraction
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              Extract Text From
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Any Document
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Upload PDFs, Word docs, images, and more. Get instant text extraction
            with AI-powered OCR. Fast, secure, and free.
          </p>
        </div>

        {/* Upload Section */}
        <section id="upload" className="max-w-3xl mx-auto">
          {/* Dropzone */}
          <div
            ref={dropzoneRef}
            {...getRootProps()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={clsx(
              'glass-card p-10 md:p-16 cursor-pointer transition-all duration-500',
              'border-dashed',
              (isDragActive || dragActive)
                ? 'border-indigo-400/60 scale-[1.02] bg-indigo-500/10 shadow-2xl shadow-indigo-500/20'
                : 'border-white/20 hover:border-indigo-500/40 hover:bg-white/[0.07]',
              file && 'border-green-500/40 bg-green-500/5'
            )}
          >
            <input {...getInputProps()} />

            {/* 3D Floating Icons */}
            <div className="relative mb-8">
              <div className="w-20 h-20 mx-auto relative">
                {/* Orbiting rings */}
                <div className="absolute inset-0 animate-spin-slow">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-lg shadow-indigo-400/50" />
                </div>
                <div className="absolute inset-0 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '8s' }}>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50" />
                </div>

                {/* Center icon */}
                <div className={clsx(
                  'absolute inset-0 flex items-center justify-center transition-all duration-500',
                  isDragActive && 'scale-110'
                )}>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-glow">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Orbit ring */}
                <div className="absolute inset-[-20px] rounded-full border border-indigo-500/20 animate-spin-slow" style={{ animationDuration: '10s' }} />
              </div>
            </div>

            {!file ? (
              <>
                <h3 className="text-xl font-semibold mb-3">
                  Drop your document here
                </h3>
                <p className="text-gray-500 mb-6">
                  or click to browse — PDF, DOCX, TXT, CSV, Images
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['PDF', 'DOCX', 'TXT', 'CSV', 'PNG', 'JPG'].map((fmt) => (
                    <span
                      key={fmt}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-gray-400"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="animate-slide-up">
                <div className="flex items-center justify-center gap-3 mb-1">
                  <FileText className="w-6 h-6 text-green-400" />
                  <span className="text-lg font-semibold text-green-300 truncate max-w-xs">
                    {file.name}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClear(); }}
                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {file && (
            <div className="mt-6 animate-slide-up">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary w-full md:w-auto text-lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="inline w-5 h-5 mr-2 animate-spin" />
                    Extracting Text...
                  </>
                ) : (
                  <>
                    <Sparkles className="inline w-5 h-5 mr-2" />
                    Extract Text
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      </section>

      {/* Result Section */}
      {result && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 pb-20 animate-slide-up">
          <ExtractedTextViewer result={result} />
        </section>
      )}

      {/* Features Section */}
      {!result && (
        <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Why <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">DocXtract</span>?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Lightning Fast',
                desc: 'Extract text from documents in seconds with optimized parsing engines.',
                color: 'from-amber-500 to-orange-600',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                desc: 'Your documents are processed securely. No data is stored permanently.',
                color: 'from-emerald-500 to-teal-600',
              },
              {
                icon: FileText,
                title: 'Multi-Format',
                desc: 'Support for PDF, DOCX, TXT, CSV, images with OCR, and more.',
                color: 'from-indigo-500 to-purple-600',
              },
            ].map((feat, i) => (
              <div
                key={i}
                className="glass-card p-6 hover:bg-white/[0.08] transition-all duration-300 group"
              >
                <div
                  className={clsx(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300',
                    feat.color
                  )}
                >
                  <feat.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feat.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 backdrop-blur-xl py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          Built with ❤️ using Next.js, Express & Tailwind CSS
        </div>
      </footer>
    </main>
  );
}
