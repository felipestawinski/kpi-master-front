'use client';

import { useRef, useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onChooseClick = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f && !filename) {
      // Prefill filename (without extension) as a convenience
      const base = f.name.replace(/\.[^/.]+$/, '');
      setFilename(base);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      if (!filename) {
        const base = f.name.replace(/\.[^/.]+$/, '');
        setFilename(base);
      }
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const clearFile = () => setFile(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please select a file.');
    if (!filename.trim()) return alert('Please enter a filename.');

    try {
      setIsUploading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', filename.trim());

      const res = await fetch('http://localhost:8080/upload', {
        method: 'POST',
        headers: token ? { Authorization: token } : {},
        body: formData,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || 'Upload failed');

      alert('File uploaded successfully!');
      setFile(null);
      setFilename('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Small helpers
  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const isImage = file && file.type.startsWith('image/');
  const previewUrl = file ? URL.createObjectURL(file) : null;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Envie um arquivo</h1>
          <p className="mt-1 text-sm text-gray-600">
            Escolha um xlxs, dê um nome, e envie para IPFS de maneira segura.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dropzone */}
          <div
            onClick={onChooseClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={[
              'relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition',
              isDragging ? 'border-blue-500/70 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
              'bg-white/30 backdrop-blur-sm shadow-sm',
            ].join(' ')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChooseClick()}
            aria-label="File dropzone"
          >
            {/* Icon */}
            <div className="mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 15a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4 5 5 0 0 0-5-5h-1a4 4 0 1 0-7.75 1.5M12 12v9m0-9l-3 3m3-3l3 3"
                />
              </svg>
            </div>

            {!file ? (
              <>
                <p className="text-sm font-medium text-gray-900">
                  Arraste e solte seu arquivo aqui, ou{' '}
                  <span className="text-blue-600 underline underline-offset-4">busque</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">Sem restrições de tipo de arquivo</p>
              </>
            ) : (
              <div className="w-full max-w-md text-left">
                <div className="flex items-center gap-4">
                  {isImage ? (
                    <img
                      src={previewUrl!}
                      alt="Preview"
                      className="h-16 w-16 rounded-md object-cover ring-1 ring-gray-200"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-100 ring-1 ring-gray-200">
                      <span className="text-xs text-gray-500">FILE</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">{file.name}</div>
                    <div className="text-xs text-gray-500">{file.type || 'Unknown type'} • {formatBytes(file.size)}</div>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={onChooseClick}
                      className="rounded-md bg-white px-3 py-1.5 text-sm ring-1 ring-gray-300 hover:bg-gray-50"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 ring-1 ring-gray-300 hover:bg-gray-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              onChange={onFileChange}
              className="hidden"
              // accept not restricted purposely
            />
          </div>

          {/* Filename */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Filename</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename (without extension, if you want)"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-blue-500 focus:ring-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              You can rename before uploading. If you leave the extension out, the server can add it.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isUploading || !file || !filename.trim()}
              className={[
                'rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm',
                isUploading || !file || !filename.trim()
                  ? 'bg-blue-400/60 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500',
              ].join(' ')}
            >
              {isUploading ? 'Uploading…' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setFilename('');
              }}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium ring-1 ring-gray-300 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
