'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  Upload,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  File as FileIcon,
  Clock,
  HardDrive,
  Layers,
} from 'lucide-react';
import clsx from 'clsx';
import ParticlesBackground from '@/components/ParticlesBackground';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppNav from '@/components/AppNav';
import * as api from '@/lib/api';
import type { DocumentItem } from '@/lib/api';

function DashboardContent() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await api.listDocuments();
      setDocuments(res.documents);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load documents';
      toast.error(message);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      await api.uploadDocument(file);
      toast.success(`${file.name} uploaded and processed`);
      await fetchDocuments();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }, [fetchDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: uploading,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
  });

  const startEdit = (doc: DocumentItem) => {
    setEditingId(doc.id);
    setEditValue(doc.originalName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (id: string) => {
    if (!editValue.trim()) return;
    try {
      await api.renameDocument(id, editValue.trim());
      setDocuments((docs) => docs.map((d) => (d.id === id ? { ...d, originalName: editValue.trim() } : d)));
      toast.success('Renamed');
      cancelEdit();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Rename failed';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteDocument(id);
      setDocuments((docs) => docs.filter((d) => d.id !== id));
      toast.success('Document deleted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />
      <AppNav />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Your Documents</h1>
          <p className="text-gray-500 text-sm">Upload, rename, and manage your document library.</p>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={clsx(
            'glass-card p-8 cursor-pointer transition-all duration-300 mb-8',
            'border-dashed',
            isDragActive
              ? 'border-indigo-400/60 scale-[1.01] bg-indigo-500/10'
              : 'border-white/20 hover:border-indigo-500/40 hover:bg-white/[0.07]',
            uploading && 'pointer-events-none opacity-70'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">
                {uploading ? 'Processing document…' : 'Drop a document here, or click to browse'}
              </h3>
              <p className="text-sm text-gray-500">PDF, DOCX, DOC, TXT, CSV — chunked and embedded automatically</p>
            </div>
          </div>
        </div>

        {/* Documents list */}
        {loadingDocs ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="glass-card p-12 text-center text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No documents yet. Upload your first one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="glass-card p-4 flex items-center gap-4 hover:bg-white/[0.07] transition-colors"
              >
                <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
                  <FileIcon className="w-5 h-5 text-indigo-300" />
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === doc.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(doc.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="glass-input py-1.5 px-3 text-sm flex-1"
                      />
                      <button
                        onClick={() => saveEdit(doc.id)}
                        className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium truncate">{doc.originalName}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" /> {doc.sizeFormatted}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" /> {doc.pages} pg
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(doc.uploadedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </span>
                  </div>
                </div>

                {editingId !== doc.id && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => startEdit(doc)}
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Rename"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
