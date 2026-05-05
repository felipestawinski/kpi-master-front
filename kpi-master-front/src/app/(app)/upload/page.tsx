'use client';

import AuthGuard from '@/components/AuthGuard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, File, X, Image as ImageIcon, Check, HelpCircle, ShieldCheck, AlertTriangle } from 'lucide-react';

/* ── Tiny Toast Components ─────────────────────────────────────────── */

function SuccessToast({ message, onDone }: { message: string; onDone: () => void }) {
 const [exiting, setExiting] = useState(false);

 useEffect(() => {
  const fadeTimer = setTimeout(() => setExiting(true), 2800);
  const removeTimer = setTimeout(onDone, 3400);
  return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
 }, [onDone]);

 return (
  <div
   className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-xl ${exiting ? 'toast-exit' : 'toast-enter'}`}
   style={{ background: 'rgba(16, 185, 129, 0.25)', border: '1px solid rgba(16, 185, 129, 0.35)' }}
  >
   <div className="p-1 rounded-full bg-emerald-500/40">
    <Check className="w-4 h-4 text-emerald-300" />
   </div>
   <span className="text-sm font-semibold text-emerald-200 drop-shadow-lg whitespace-nowrap">{message}</span>
  </div>
 );
}

function ErrorToast({ message, onDone }: { message: string; onDone: () => void }) {
 const [exiting, setExiting] = useState(false);

 useEffect(() => {
  const fadeTimer = setTimeout(() => setExiting(true), 3800);
  const removeTimer = setTimeout(onDone, 4400);
  return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
 }, [onDone]);

 return (
  <div
   className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-xl ${exiting ? 'toast-exit' : 'toast-enter'}`}
   style={{ background: 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(239, 68, 68, 0.35)' }}
  >
   <div className="p-1 rounded-full bg-red-500/40">
    <AlertTriangle className="w-4 h-4 text-red-300" />
   </div>
   <span className="text-sm font-semibold text-red-200 drop-shadow-lg whitespace-nowrap">{message}</span>
  </div>
 );
}

/* ── Main Page ─────────────────────────────────────────────────────── */

export function UploadPage() {
 const [file, setFile] = useState<File | null>(null);
 const [filename, setFilename] = useState('');
 const [institution, setInstitution] = useState('');
 const [isDragging, setIsDragging] = useState(false);
 const [isUploading, setIsUploading] = useState(false);
 const [isConfirming, setIsConfirming] = useState(false);
 const [uploadSuccess, setUploadSuccess] = useState(false);
 const [uploadError, setUploadError] = useState<string | null>(null);
 const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const [dataHealthCheck, setDataHealthCheck] = useState(true);
 const [healthCheckResult, setHealthCheckResult] = useState<string | null>(null);
 const [showHealthCheck, setShowHealthCheck] = useState(false);
 const fileInputRef = useRef<HTMLInputElement | null>(null);

 const onChooseClick = () => fileInputRef.current?.click();

 const showSuccess = useCallback(() => {
  if (successTimerRef.current) clearTimeout(successTimerRef.current);
  setUploadSuccess(true);
  successTimerRef.current = setTimeout(() => setUploadSuccess(false), 3500);
 }, []);

 const showError = useCallback((msg: string) => {
  if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
  setUploadError(msg);
  errorTimerRef.current = setTimeout(() => setUploadError(null), 4500);
 }, []);

 useEffect(() => {
  return () => {
   if (successTimerRef.current) clearTimeout(successTimerRef.current);
   if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
  };
 }, []);

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
  if (!file) return showError('Por favor, selecione um arquivo.');
  if (!filename.trim()) return showError('Por favor, insira um nome para o arquivo.');

  try {
   setIsUploading(true);
   const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

   if (dataHealthCheck) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename.trim());

    const res = await fetch('http://localhost:8080/health-check', {
     method: 'POST',
     headers: token ? { Authorization: token } : {},
     body: formData,
    });

    const responseText = await res.text();
    if (!res.ok) throw new Error(responseText || 'Health check failed');

    const data = JSON.parse(responseText);
    if (data.dataHealthCheck) {
     setHealthCheckResult(data.dataHealthCheck);
     setShowHealthCheck(true);
    }
   } else {
    await handleConfirmedUpload('raw');
   }
  } catch (err: any) {
   showError('Erro: ' + err.message);
  } finally {
   setIsUploading(false);
  }
 };

 const handleConfirmedUpload = async (mode: 'raw' | 'cleaned') => {
  if (!file) return;
  try {
   setIsConfirming(true);
   const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

   const formData = new FormData();
   formData.append('file', file);
   formData.append('filename', filename.trim());
   formData.append('institution', institution.trim());
   formData.append('mode', mode);

   const res = await fetch('http://localhost:8080/upload-confirmed', {
    method: 'POST',
    headers: token ? { Authorization: token } : {},
    body: formData,
   });

   const responseText = await res.text();
   if (!res.ok) throw new Error(responseText || 'Upload failed');

   setShowHealthCheck(false);
   showSuccess();
   setTimeout(() => {
    setFile(null);
    setFilename('');
   }, 3000);
  } catch (err: any) {
   showError('Erro: ' + err.message);
  } finally {
   setIsConfirming(false);
  }
 };

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
   {uploadSuccess && (
    <SuccessToast
     message="Arquivo enviado com sucesso!"
     onDone={() => setUploadSuccess(false)}
    />
   )}
   {uploadError && (
    <ErrorToast
     message={uploadError}
     onDone={() => setUploadError(null)}
    />
   )}
   {/* Data Health Check Popup */}
   {showHealthCheck && healthCheckResult && (
    <div
     className="fixed inset-0 z-50 flex items-center justify-center p-4"
     style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
    >
     <div
      className="relative w-full max-w-2xl backdrop-blur-xl bg-black/70 rounded-2xl shadow-2xl fade-in"
      onClick={(e) => e.stopPropagation()}
     >
      <div className="flex items-center justify-between p-6 border-b border-white/10">
       <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30">
         <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-white drop-shadow-lg">
         Data Health Check
        </h2>
       </div>
       <button
        type="button"
        onClick={() => setShowHealthCheck(false)}
        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200"
        aria-label="Fechar"
        disabled={isConfirming}
       >
        <X className="w-4 h-4 text-white/80" />
       </button>
      </div>

      <div className="mx-6 mt-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/20 ">
       <div className="p-1.5 rounded-full bg-amber-500/30">
        <ShieldCheck className="w-4 h-4 text-amber-300" />
       </div>
       <span className="text-sm font-semibold text-amber-300 drop-shadow-lg">
        Revise o relatório e escolha como enviar o arquivo.
       </span>
      </div>

      <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
       <pre className="text-sm text-white/90 whitespace-pre-wrap break-words font-mono leading-relaxed">
        {healthCheckResult}
       </pre>
      </div>

      <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row justify-end gap-3">
       <button
        type="button"
        onClick={() => handleConfirmedUpload('raw')}
        disabled={isConfirming}
        className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-sm transition-all duration-300 flex items-center justify-center space-x-2"
       >
        {isConfirming ? (
         <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        ) : (
         <>
          <Upload className="w-4 h-4" />
          <span>Enviar Arquivo Original</span>
         </>
        )}
       </button>
       <button
        type="button"
        onClick={() => handleConfirmedUpload('cleaned')}
        disabled={isConfirming}
        className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
       >
        {isConfirming ? (
         <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        ) : (
         <>
          <Check className="w-4 h-4" />
          <span>Enviar Arquivo Limpo</span>
         </>
        )}
       </button>
      </div>
     </div>
    </div>
   )}

   <style jsx global>{`
    .custom-scrollbar::-webkit-scrollbar {
     width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
     background: rgba(255, 255, 255, 0.05);
     border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
     background: rgba(245, 158, 11, 0.4);
     border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
     background: rgba(245, 158, 11, 0.6);
    }
   `}</style>
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

    @keyframes toastIn {
      from {
       opacity: 0;
       transform: translateY(-12px) scale(0.95);
      }
      to {
       opacity: 1;
       transform: translateY(0) scale(1);
      }
     }

     @keyframes toastOut {
      from {
       opacity: 1;
       transform: translateY(0) scale(1);
      }
      to {
       opacity: 0;
       transform: translateY(-12px) scale(0.95);
      }
     }

     .toast-enter {
      animation: toastIn 0.35s ease-out forwards;
     }

     .toast-exit {
      animation: toastOut 0.6s ease-in forwards;
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
     <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl p-8 slide-up">
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
           className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-sm transition-all duration-300 flex items-center space-x-2"
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

     <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl p-8 slide-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div>
        <label className="block text-sm font-semibold uppercase tracking-wider text-white/90 mb-3 drop-shadow-lg flex items-center space-x-2">
         <File className="w-4 h-4 text-amber-300" />
         <span>Nome do Arquivo</span>
         <span className="text-red-400">*</span>
        </label>
        <input
         type="text"
         value={filename}
         onChange={(e) => setFilename(e.target.value)}
         placeholder="Digite o nome do arquivo"
         className="w-full px-4 py-3 rounded-xl bg-black/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500/70 transition-all backdrop-blur-sm shadow-lg"
        />
       </div>

       <div>
        <label className="block text-sm font-semibold uppercase tracking-wider text-white/90 mb-3 drop-shadow-lg flex items-center space-x-2">
         <File className="w-4 h-4 text-amber-300" />
         <span>Instituição</span>
         <span className="text-white/50 text-xs font-normal normal-case">(opcional)</span>
        </label>
        <input
         type="text"
         value={institution}
         onChange={(e) => setInstitution(e.target.value)}
         placeholder="Digite a instituição"
         className="w-full px-4 py-3 rounded-xl bg-black/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500/70 transition-all backdrop-blur-sm shadow-lg"
        />
       </div>
      </div>
      <p className="mt-3 text-xs text-white/50">
       <span className="text-red-400">*</span> Campo obrigatório
      </p>
     </div>

     <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl p-6 slide-up">
      <div className="flex items-center justify-between">
       <div className="flex items-center gap-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-white/90 drop-shadow-lg">
         Data Health Check
        </span>
        <div className="relative group">
         <button
          type="button"
          className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 cursor-help"
          aria-label="Informações sobre Data Health Check"
         >
          <HelpCircle className="w-3 h-3 text-white/70" />
         </button>
         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2.5 bg-black/90 backdrop-blur-xl rounded-xl text-xs text-white/90 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl z-50 pointer-events-none">
          <p>Verifica automaticamente a qualidade dos dados do arquivo antes da análise, identificando valores nulos, inconsistências e possíveis problemas que podem afetar os resultados.</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 border-r border-b border-white/20 rotate-45 -mt-1"></div>
         </div>
        </div>
       </div>
       <button
        type="button"
        onClick={() => setDataHealthCheck(!dataHealthCheck)}
        className={[
         'relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
         dataHealthCheck
          ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30'
          : 'bg-white/20',
        ].join(' ')}
        role="switch"
        aria-checked={dataHealthCheck}
        aria-label="Ativar Data Health Check"
       >
        <span
         className={[
          'inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300',
          dataHealthCheck ? 'translate-x-6' : 'translate-x-1',
         ].join(' ')}
        />
       </button>
      </div>
     </div>

     <div className="flex items-center gap-4 slide-up">
      <button
       type="submit"
       disabled={isUploading || !file || !filename.trim()}
       className={[
        'flex-1 px-6 py-4 rounded-xl font-semibold text-white shadow-2xl transition-all duration-300 flex items-center justify-center space-x-3 text-lg',
        isUploading || !file || !filename.trim()
         ? 'bg-gray-500/30 cursor-not-allowed '
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
