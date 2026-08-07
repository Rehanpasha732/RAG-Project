'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  Upload,
  FileText,
  Loader2,
  Trash2,
  Search,
  RefreshCw,
  Eye,
} from 'lucide-react';
import clsx from 'clsx';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminSidebarNav from '@/components/admin/AdminSidebarNav';
import Modal from '@/components/ui/Modal';
import * as adminApi from '@/lib/adminApi';
import type { AdminDocument, AdminUserRow } from '@/lib/adminApi';

const STATUS_STYLES: Record<string, string> = {
  processing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ready: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize', STATUS_STYLES[status] || STATUS_STYLES.ready)}>
      {status}
    </span>
  );
}

function UploadModal({ users, onClose, onUploaded }: { users: AdminUserRow[]; onClose: () => void; onUploaded: () => void }) {
  const [targetUserId, setTargetUserId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: uploading,
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error('Choose a file to upload');
      return;
    }
    if (!targetUserId) {
      toast.error('Choose a user to upload on behalf of');
      return;
    }
    setUploading(true);
    try {
      await adminApi.adminUploadDocument(file, targetUserId);
      toast.success(`${file.name} uploaded`);
      onUploaded();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title="Upload document" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">On behalf of</label>
          <select
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="glass-input w-full py-2.5 px-3 text-sm bg-[#12181f]"
          >
            <option value="">Select a user…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div
          {...getRootProps()}
          className={clsx(
            'glass-card p-6 cursor-pointer transition-all border-dashed',
            isDragActive ? 'border-teal-400/60 bg-teal-500/10' : 'border-white/20 hover:border-teal-500/40',
            uploading && 'pointer-events-none opacity-70'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Upload className="w-5 h-5 text-white" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{file ? file.name : 'Drop a file here, or click to browse'}</p>
              <p className="text-xs text-gray-500">PDF, DOCX, DOC, TXT, CSV, images</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn-primary w-full flex items-center justify-center gap-2 !py-2.5 text-sm"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Processing…' : 'Upload'}
        </button>
      </div>
    </Modal>
  );
}

function DetailModal({ doc, onClose }: { doc: AdminDocument; onClose: () => void }) {
  return (
    <Modal title={doc.originalName} onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Status</span><StatusBadge status={doc.status} /></div>
        <div className="flex justify-between"><span className="text-gray-500">Owner</span><span>{doc.ownerName} ({doc.ownerEmail})</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Size</span><span>{doc.sizeFormatted}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Pages</span><span>{doc.pages}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Text length</span><span>{doc.textLength} chars</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Uploaded</span><span>{new Date(doc.uploadedAt).toLocaleString()}</span></div>
        {doc.error && (
          <div className="pt-2 border-t border-white/10">
            <p className="text-red-400 text-xs">{doc.error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function DocumentsContent() {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [detailDoc, setDetailDoc] = useState<AdminDocument | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.adminListDocuments(q ? { q } : undefined);
      setDocuments(res.documents);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    adminApi.listUsers().then((res) => setUsers(res.users)).catch(() => {});
  }, [fetchDocuments]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document and all its embeddings? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await adminApi.adminDeleteDocument(id);
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
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">Documents</h1>
          <p className="text-gray-500 text-sm">Upload and manage documents on behalf of your users.</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary !py-2.5 !px-5 text-sm flex items-center gap-2">
          <Upload className="w-4 h-4" /> Upload
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchDocuments(search);
        }}
        className="relative mb-6 max-w-sm"
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by file name…"
          className="glass-input w-full py-2.5 pl-10 pr-4 text-sm"
        />
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center">
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button onClick={() => fetchDocuments(search)} className="btn-secondary text-sm inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-500">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No documents yet. Upload one to get started.</p>
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-white/10">
                <th className="px-5 py-3 font-medium">File</th>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Size</th>
                <th className="px-5 py-3 font-medium">Uploaded</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3 truncate max-w-xs">{doc.originalName}</td>
                  <td className="px-5 py-3 text-gray-400">{doc.ownerName}</td>
                  <td className="px-5 py-3"><StatusBadge status={doc.status} /></td>
                  <td className="px-5 py-3 text-gray-400">{doc.sizeFormatted}</td>
                  <td className="px-5 py-3 text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setDetailDoc(doc)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                        title="Delete"
                      >
                        {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showUpload && (
        <UploadModal users={users} onClose={() => setShowUpload(false)} onUploaded={() => fetchDocuments(search)} />
      )}
      {detailDoc && <DetailModal doc={detailDoc} onClose={() => setDetailDoc(null)} />}
    </div>
  );
}

export default function AdminDocumentsPage() {
  return (
    <AdminProtectedRoute>
      <AdminSidebarNav>
        <DocumentsContent />
      </AdminSidebarNav>
    </AdminProtectedRoute>
  );
}
