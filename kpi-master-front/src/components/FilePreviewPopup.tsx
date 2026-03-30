'use client';

import { X, FileText } from 'lucide-react';

type PreviewFile = {
 id: number;
 filename: string;
 institution: string;
};

type FilePreviewPopupProps = {
 isOpen: boolean;
 onClose: () => void;
 files: PreviewFile[];
 selectedFileId: number | null;
 onFileSelect: (fileId: number) => void;
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
 if (!isOpen) return null;

 return (
  <div
   className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
   onClick={onClose}
  >
   <div
    className="w-full max-w-5xl max-h-[85vh] bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    onClick={(e) => e.stopPropagation()}
   >
    <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
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
      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
      aria-label="Fechar prévia"
     >
      <X className="w-4 h-4" />
     </button>
    </div>

    <div className="px-5 py-4 border-b border-white/10">
     <label className="block text-white/80 text-xs font-medium mb-2">Arquivo para pré-visualizar</label>
     <select
      value={selectedFileId ?? ''}
      onChange={(e) => onFileSelect(Number(e.target.value))}
      className="w-full p-2.5 rounded-lg bg-black/40 text-white border border-white/15 focus:outline-none focus:ring-2 focus:ring-amber-500/60 text-sm"
     >
      {files.map((file) => (
       <option key={file.id} value={file.id} className="bg-gray-900 text-white">
        {file.filename} • {file.institution}
       </option>
      ))}
     </select>
    </div>

    <div className="p-5 overflow-auto max-h-[55vh] custom-scrollbar">
     {loading && (
      <div className="flex items-center space-x-3 text-white/80 py-8 justify-center">
       <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
       <span className="text-sm">Carregando prévia...</span>
      </div>
     )}

     {!loading && error && (
      <div className="rounded-lg bg-red-500/15 border border-red-400/30 text-red-200 p-4 text-sm">
       {error}
      </div>
     )}

     {!loading && !error && headers.length > 0 && (
      <div className="overflow-auto rounded-lg border border-white/10">
       <table className="w-full text-sm text-white/90">
        <thead className="bg-white/10">
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
          <tr key={`row-${rowIndex}`} className="border-t border-white/10 hover:bg-white/5">
           {headers.map((_, colIndex) => (
            <td key={`cell-${rowIndex}-${colIndex}`} className="px-3 py-2 align-top max-w-[220px] truncate" title={row[colIndex] ?? ''}>
             {row[colIndex] ?? ''}
            </td>
           ))}
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     )}

     {!loading && !error && headers.length === 0 && (
      <div className="text-center text-white/70 py-8 text-sm">
       Nenhum dado disponível para visualização.
      </div>
     )}
    </div>
   </div>
  </div>
 );
}
