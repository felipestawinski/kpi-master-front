'use client';

import AuthGuard from '@/components/AuthGuard';
import { useRef, useState } from 'react';
import { Upload, File, X, Image as ImageIcon, Check } from 'lucide-react';

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onChooseClick = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setUploadSuccess(false);
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
      setUploadSuccess(false);
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

  const clearFile = () => {
    setFile(null);
    setUploadSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Por favor, selecione um arquivo.');
    if (!filename.trim()) return alert('Por favor, insira um nome para o arquivo.');

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

      setUploadSuccess(true);
      setTimeout(() => {
        setFile(null);
        setFilename('');
        setUploadSuccess(false);
      }, 3000);
    } catch (err: any) {
      alert('Erro: ' + err.message);
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
    <div className="p-6 max-h-screen overflow-y-auto">
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes success {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .slide-up {
          animation: slideUp 0.4s ease-out;
        }

        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
        }

        .success-animation {
          animation: success 0.5s ease-out;
        }
      `}</style>

      <div className="mx-auto max-w-3xl">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dropzone */}
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl border border-white/30 p-8 slide-up">
            <div
              onClick={onChooseClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={[
                'relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300',
                isDragging 
                  ? 'border-amber-400/70 bg-amber-500/20 scale-105' 
                  : 'border-white/30 hover:border-amber-400/50 hover:bg-white/5',
              ].join(' ')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChooseClick()}
              aria-label="File dropzone"
            >
              {/* Icon */}
              <div className={`mb-4 p-3 rounded-full bg-white/10 backdrop-blur-sm ${isDragging ? 'pulse-animation' : ''}`}>
                <Upload className="h-12 w-12 text-amber-300 drop-shadow-lg" />
              </div>

              {!file ? (
                <>
                  <p className="text-lg font-semibold text-white drop-shadow-lg mb-2">
                    Arraste e solte seu arquivo aqui
                  </p>
                  <p className="text-white/60 mb-4">ou</p>
                  <div className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    Buscar Arquivo
                  </div>
                  <p className="mt-6 text-sm text-white/50">Sem restrições de tipo de arquivo</p>
                </>
              ) : (
                <div className="w-full text-center fade-in">
                  <div className="flex items-center justify-center gap-6 mb-6">
                    {isImage ? (
                      <div className="relative">
                        <img
                          src={previewUrl!}
                          alt="Preview"
                          className="h-24 w-24 rounded-xl object-cover ring-2 ring-amber-400/50 shadow-xl"
                        />
                        <div className="absolute -top-2 -right-2 p-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg">
                          <ImageIcon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-white/10 ring-2 ring-amber-400/50 shadow-xl backdrop-blur-sm">
                        <File className="h-12 w-12 text-amber-300" />
                      </div>
                    )}
                  </div>
                  <div className="mb-6">
                    <div className="text-lg font-semibold text-white drop-shadow-lg mb-1">{file.name}</div>
                    <div className="text-sm text-white/60">{file.type || 'Unknown type'} • {formatBytes(file.size)}</div>
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChooseClick();
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Mudar Arquivo
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-300 flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Remover</span>
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                onChange={onFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Filename Input */}
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl border border-white/30 p-8 slide-up">
            <label className="block text-sm font-semibold uppercase tracking-wider text-white/90 mb-3 drop-shadow-lg flex items-center space-x-2">
              <File className="w-4 h-4 text-amber-300" />
              <span>Nome do Arquivo</span>
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Digite um nome para seu arquivo"
              className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500/70 transition-all backdrop-blur-sm shadow-lg"
            />
            <p className="mt-2 text-xs text-white/50">Este nome será usado para identificar o arquivo no sistema</p>
          </div>

          {/* Success Message */}
          {uploadSuccess && (
            <div className="backdrop-blur-xl bg-green-500/20 rounded-2xl p-6 border border-green-400/50 shadow-2xl success-animation">
              <div className="flex items-center justify-center gap-3 text-green-300">
                <div className="p-2 rounded-full bg-green-500/30">
                  <Check className="w-6 h-6" />
                </div>
                <span className="text-lg font-semibold drop-shadow-lg">Arquivo enviado com sucesso!</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 slide-up">
            <button
              type="submit"
              disabled={isUploading || !file || !filename.trim()}
              className={[
                'flex-1 px-6 py-4 rounded-xl font-semibold text-white shadow-2xl transition-all duration-300 flex items-center justify-center space-x-3 text-lg',
                isUploading || !file || !filename.trim()
                  ? 'bg-gray-500/30 cursor-not-allowed border border-white/10'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 hover:shadow-amber-500/50 hover:scale-105',
              ].join(' ')}
            >
              {isUploading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Enviar para IPFS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProtectedUploadPage() {
  return (
    <AuthGuard>
      <UploadPage />
    </AuthGuard>
  );
}
