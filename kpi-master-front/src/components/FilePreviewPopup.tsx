'use client';

import { X, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

type PreviewFile = {
 id: string;
 filename: string;
 institution: string;
};

type FilePreviewPopupProps = {
 isOpen: boolean;
 onClose: () => void;
 files: PreviewFile[];
 selectedFileId: string | null;
 onFileSelect: (fileId: string) => void;
 loading: boolean;
 error: string | null;
 headers: string[];
 rows: string[][];
};

export default function FilePreviewPopup({
 isOpen,
 onClose,
 files,
 selectedFileId,
 onFileSelect,
 loading,
 error,
 headers,
 rows,
}: FilePreviewPopupProps) {
 // Defer heavy table rendering until the opening animation finishes.
 // This prevents layout thrashing during the width transition.
 const [contentReady, setContentReady] = useState(false);

 useEffect(() => {
  if (isOpen) {
   const timer = setTimeout(() => setContentReady(true), 400);
   return () => clearTimeout(timer);
  }
  setContentReady(false);
 }, [isOpen]);

 const showTable = contentReady && !loading && !error && headers.length > 0;

 return (
  <div
   className={`file-preview-panel ${isOpen ? 'file-preview-panel--open' : ''}`}
  >
   {/* Header */}
   <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
    <div className="flex items-center space-x-3 min-w-0">
     <div className="p-2 rounded-lg bg-amber-500/20">
      <FileText className="w-4 h-4 text-amber-300" />
     </div>
     <div className="min-w-0">
      <h3 className="text-white font-semibold text-sm sm:text-base truncate">Prévia do arquivo</h3>
       <p className="text-white/60 text-xs sm:text-sm truncate">Visualização rápida das primeiras linhas dos dados</p>
     </div>
    </div>

    <button
     onClick={onClose}
     className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex-shrink-0"
     aria-label="Fechar prévia"
    >
     <X className="w-4 h-4" />
    </button>
   </div>

   {/* File selector */}
   {files.length > 1 && (
    <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
     <label className="block text-white/80 text-xs font-medium mb-2">Arquivo para pré-visualizar</label>
     <select
      value={selectedFileId ?? ''}
      onChange={(e) => onFileSelect(e.target.value)}
      className="w-full p-2.5 rounded-lg bg-black/40 text-white border border-white/15 focus:outline-none focus:ring-2 focus:ring-amber-500/60 text-sm"
     >
      {files.map((file) => (
       <option key={file.id} value={file.id} className="bg-gray-900 text-white">
        {file.filename} • {file.institution}
       </option>
      ))}
     </select>
    </div>
   )}

   {/* Content */}
   <div className="flex-1 min-h-0 overflow-auto p-5 preview-panel-scrollbar">
    {(loading || !contentReady) && (
     <div className="flex items-center space-x-3 text-white/80 py-8 justify-center">
      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm">Carregando prévia...</span>
     </div>
    )}

    {contentReady && !loading && error && (
     <div className="rounded-lg bg-red-500/15 border border-red-400/30 text-red-200 p-4 text-sm">
      {error}
     </div>
    )}

    {showTable && (
     <div
      className="rounded-lg border border-white/10"
      style={{ width: 'fit-content', minWidth: '100%' }}
     >
      <table className="text-sm text-white/90" style={{ minWidth: 'max-content' }}>
       <thead className="bg-zinc-900 sticky top-0 z-10">
        <tr>
         {headers.map((header, index) => (
          <th key={`${header}-${index}`} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
           {header || `Coluna ${index + 1}`}
          </th>
         ))}
        </tr>
       </thead>
       <tbody>
        {rows.map((row, rowIndex) => (
         <tr
          key={`row-${rowIndex}`}
          className="border-t border-white/10 hover:bg-white/5 preview-row-virtual"
         >
          {headers.map((_, colIndex) => (
           <td key={`cell-${rowIndex}-${colIndex}`} className="px-3 py-2 align-top max-w-[220px] truncate whitespace-nowrap" title={row[colIndex] ?? ''}>
            {row[colIndex] ?? ''}
           </td>
          ))}
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    )}

    {contentReady && !loading && !error && headers.length === 0 && (
     <div className="text-center text-white/70 py-8 text-sm">
      Nenhum dado disponível para visualização.
     </div>
    )}
   </div>
  </div>
 );
}
