'use client';
import { FaRegCalendar } from "react-icons/fa";
import AuthGuard from '@/components/AuthGuard';
import { useEffect, useState, useRef } from 'react';
import { Search as SearchIcon, FileText, Building2, User, Hash, Copy, Check, X, Download, Save, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

type ApiFile = {
 id: string;
 filename: string;
 institution: string;
 writer: string;
 date: string;
 fileAddress: string;
 fileType?: string;
};

type SearchTypeOption = {
 value: 'filename' | 'institution' | 'writer';
 label: string;
 icon: React.ReactNode;
};

const SEARCH_TYPE_OPTIONS: SearchTypeOption[] = [
 { value: 'filename', label: 'Nome', icon: <FileText className="w-4 h-4" /> },
 { value: 'institution', label: 'Instituição', icon: <Building2 className="w-4 h-4" /> },
 { value: 'writer', label: 'Autor', icon: <User className="w-4 h-4" /> },
];

export function SearchPage() {
 const [files, setFiles] = useState<ApiFile[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [searchTerm, setSearchTerm] = useState('');
 const [searchType, setSearchType] = useState<'filename' | 'institution' | 'writer'>('filename');
 const [isSearching, setIsSearching] = useState(false);
 const [isDropdownOpen, setIsDropdownOpen] = useState(false);
 const [currentPage, setCurrentPage] = useState(0);
 const FILES_PER_PAGE = 10;

 const [username, setUsername] = useState<string | null>(null);
 const [token, setToken] = useState<string | null>(null);
 const [analysisImage, setAnalysisImage] = useState<string | null>(null);

 const dropdownRef = useRef<HTMLDivElement>(null);
 const [copiedCid, setCopiedCid] = useState<string | null>(null);

 const extractCid = (fileAddress: string) => {
  return fileAddress.split('/').pop() ?? '';
 };

 const handleCopyCid = async (cid: string) => {
  try {
   await navigator.clipboard.writeText(cid);
   setCopiedCid(cid);
   setTimeout(() => setCopiedCid(null), 2000);
  } catch {
   // fallback
  }
 };

 useEffect(() => {
  try {
   const rawUser = localStorage.getItem('user');
   if (rawUser) {
    const parsed = JSON.parse(rawUser);
    setUsername(parsed?.username ?? null);
   } else {
    setUsername(localStorage.getItem('username'));
   }
   setToken(localStorage.getItem('token'));
  } catch {
   setUsername(null);
   setToken(null);
  }
 }, []);

 useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
   if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
    setIsDropdownOpen(false);
   }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const fetchFiles = async () => {
  if (!username) {
   setError('No username found. Please log in again.');
   setLoading(false);
   return;
  }
  try {
   setLoading(true);
   setError(null);
   const res = await fetch('http://localhost:8080/files', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     ...(token ? { Authorization: `${token}` } : {}),
    },
    body: JSON.stringify({ username }),
   });
   const data: ApiFile[] = await res.json();

   if (!res.ok) throw new Error('Failed to load files.');

   setFiles(Array.isArray(data) ? data : []);
   setCurrentPage(0);
  } catch (err: any) {
   setError(err.message || 'Error fetching files.');
  } finally {
   setLoading(false);
  }
 };

 const handleSearch = async () => {
  if (!searchTerm.trim()) {
   fetchFiles();
   return;
  }

  try {
   setIsSearching(true);
   setError(null);
   const res = await fetch('http://localhost:8080/search-file', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     ...(token ? { Authorization: `${token}` } : {}),
    },
    body: JSON.stringify({
     searchType,
     searchTerm: searchTerm.trim(),
    }),
   });

   const data = await res.json();

   if (!res.ok) throw new Error('Search failed.');

   // Handle different response formats: direct array, or wrapped in { files: [...] }, { data: [...] }, etc.
   let filesArray: ApiFile[] = [];
   if (Array.isArray(data)) {
    filesArray = data;
   } else if (data && typeof data === 'object') {
    // Check for common wrapper properties
    filesArray = data.files || data.data || data.results || data.items || [];
   }

   setFiles(filesArray);
   setCurrentPage(0);
  } catch (err: any) {
   setError(err.message || 'Error searching files.');
  } finally {
   setIsSearching(false);
  }
 };

 useEffect(() => {
  if (username !== null) {
   fetchFiles();
  }
 }, [username]);

 const formatDate = (s?: string) => {
  if (!s) return '-';
  const [d, t] = s.split(' ');
  const [y, m, day] = (d || '').split('-').map(Number);
  const [hh, mm, ss] = (t || '').split(':').map(Number);
  const dt = new Date(y, (m || 1) - 1, day || 1, hh || 0, mm || 0, ss || 0);
  return isNaN(dt.getTime()) ? s : dt.toLocaleString();
 };

 const saveOnStatistics = async (image: string | null) => {
  if (!image) return;

  const res = await fetch('http://localhost:8080/statistics-gen', {
   method: 'POST',
   headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `${token}` } : {}),
   },
   body: JSON.stringify({
    image: image,
   }),
  });

  const text = await res.text();
  const payload = JSON.parse(text);
 };

 const getSearchIcon = () => {
  switch (searchType) {
   case 'filename':
    return <FileText className="w-5 h-5 text-amber-300" />;
   case 'institution':
    return <Building2 className="w-5 h-5 text-amber-300" />;
   case 'writer':
    return <User className="w-5 h-5 text-amber-300" />;
   default:
    return <SearchIcon className="w-5 h-5 text-amber-300" />;
  }
 };

 const getSearchTypeLabel = () => {
  switch (searchType) {
   case 'filename':
    return 'Nome do Arquivo';
   case 'institution':
    return 'Instituição';
   case 'writer':
    return 'Autor';
   default:
    return 'Buscar';
  }
 };

 const selectedOption = SEARCH_TYPE_OPTIONS.find(o => o.value === searchType)!;

 return (
  <div className="p-6 min-h-screen">
   <style jsx global>{`
    .custom-scrollbar::-webkit-scrollbar {
     width: 8px;
     height: 8px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
     background: rgba(255, 255, 255, 0.05);
     border-radius: 10px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
     background: rgba(251, 191, 36, 0.5);
     border-radius: 10px;
     transition: background 0.3s ease;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
     background: rgba(251, 191, 36, 0.7);
    }

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

    @keyframes slideIn {
     from {
      opacity: 0;
      transform: translateY(-10px);
     }
     to {
      opacity: 1;
      transform: translateY(0);
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

    .fade-in {
     animation: fadeIn 0.3s ease-out;
    }

    .slide-up {
     animation: slideUp 0.4s ease-out;
    }

    .dropdown-enter {
     animation: slideIn 0.2s ease-out;
    }

    .dropdown-scrollbar {
     overflow-y: auto;
     scrollbar-width: thin;
     scrollbar-color: rgba(255,255,255,0.88);
    }
    .dropdown-scrollbar::-webkit-scrollbar {
     width: 6px;
    }
    .dropdown-scrollbar::-webkit-scrollbar-track {
     background: transparent;
    }
    .dropdown-scrollbar::-webkit-scrollbar-thumb {
     background: rgba(255,255,255,0.88);
     border-radius: 4px;
     transition: background 0.2s;
    }
    .dropdown-scrollbar::-webkit-scrollbar-thumb:hover {
     background: rgba(255,255,255,0.85);
    }

    .cid-cell {
     position: relative;
     cursor: pointer;
    }

    .cid-tooltip {
     visibility: hidden;
     opacity: 0;
     position: absolute;
     bottom: calc(100% + 8px);
     left: 50%;
     transform: translateX(-50%) translateY(4px);
     background: rgba(0, 0, 0, 0.9);
     backdrop-filter: blur(12px);
     border: 1px solid rgba(251, 191, 36, 0.3);
     color: #fbbf24;
     padding: 8px 14px;
     border-radius: 10px;
     font-size: 12px;
     font-family: monospace;
     white-space: nowrap;
     z-index: 50;
     pointer-events: none;
     transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
     box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }

    .cid-tooltip::after {
     content: '';
     position: absolute;
     top: 100%;
     left: 50%;
     transform: translateX(-50%);
     border-width: 5px;
     border-style: solid;
     border-color: rgba(0, 0, 0, 0.9) transparent transparent transparent;
    }

    .cid-cell:hover .cid-tooltip {
     visibility: visible;
     opacity: 1;
     transform: translateX(-50%) translateY(0);
    }

    .cid-copied {
     background: rgba(16, 185, 129, 0.9) !important;
     border-color: rgba(16, 185, 129, 0.5) !important;
     color: white !important;
    }

    .cid-copied::after {
     border-color: rgba(16, 185, 129, 0.9) transparent transparent transparent !important;
    }
   `}</style>

   <div className="mx-auto max-w-7xl">

    {/* Search Section */}
    <div className="mb-6 backdrop-blur-xl bg-black/40 rounded-2xl p-6 shadow-2xl slide-up overflow-visible relative z-20">
     <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1" ref={dropdownRef}>
       <label className="block text-sm font-medium text-white mb-2 drop-shadow-lg">
        Buscar por
       </label>
       <div className="relative">
        <button
         onClick={() => setIsDropdownOpen(!isDropdownOpen)}
         className="w-full p-4 rounded-xl bg-black/40 text-white backdrop-blur-md hover:bg-black/50 flex items-center justify-between group shadow-xl"
        >
         <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/30 group-hover:bg-amber-500/40 transition-colors shadow-lg">
           {selectedOption.icon}
          </div>
          <div className="font-medium drop-shadow-md">{selectedOption.label}</div>
         </div>
         <ChevronDown
          className={`w-5 h-5 text-white/80 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
         />
        </button>

        {isDropdownOpen && (
         <div className="absolute z-50 w-full mt-2 rounded-xl bg-zinc-800 shadow-2xl overflow-hidden dropdown-enter">
          <div className="max-h-96 dropdown-scrollbar">
           {SEARCH_TYPE_OPTIONS.map((option, index) => (
            <button
             key={option.value}
             onClick={() => {
              setSearchType(option.value);
              setIsDropdownOpen(false);
             }}
             className={`w-full p-4 text-left hover:bg-white/10 flex items-center space-x-3 group ${searchType === option.value ? 'bg-amber-500/20' : ''
              } ${index !== 0 ? 'border-t border-white/10' : ''}`}
            >
             <div className={`p-2 rounded-lg transition-colors ${searchType === option.value
              ? 'bg-amber-500 text-white'
              : 'bg-white/10 text-gray-300 group-hover:bg-amber-500/30'
              }`}>
              {option.icon}
             </div>
             <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-300 truncate">
               {option.label}
              </div>
             </div>
             {searchType === option.value && (
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500"></div>
             )}
            </button>
           ))}
          </div>
         </div>
        )}
       </div>
      </div>
      <div className="flex-[2]">
       <label className="block text-sm font-medium text-white mb-2 drop-shadow-lg">
        Termo de busca
       </label>
       <div className="flex gap-2">
        <div className="flex-1 relative">
         <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={`Buscar por ${getSearchTypeLabel().toLowerCase()}...`}
          className="w-full px-4 py-3 pr-10 rounded-xl bg-black/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500/70 transition-all backdrop-blur-sm shadow-lg"
         />
         {searchTerm && (
          <button
           onClick={() => {
            setSearchTerm('');
            fetchFiles();
           }}
           className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
          >
           <X className="w-4 h-4" />
          </button>
         )}
        </div>
        <button
         onClick={handleSearch}
         disabled={isSearching}
         className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 group"
        >
         <SearchIcon className={`w-4 h-4 ${isSearching ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
         <span>{isSearching ? 'Buscando...' : 'Buscar'}</span>
        </button>
       </div>
      </div>
     </div>
    </div>

    {/* Loading State */}
    {loading && (
     <div className="backdrop-blur-xl bg-black/40 rounded-2xl p-12 shadow-2xl text-center fade-in">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mb-4"></div>
      <p className="text-white/90 drop-shadow-lg">Carregando arquivos…</p>
     </div>
    )}

    {/* Error State */}
    {!loading && error && (
     <div className="backdrop-blur-xl bg-red-500/20 rounded-2xl p-6 text-red-200 shadow-2xl fade-in">
      <div className="flex items-center gap-3">
       <span className="text-2xl">⚠️</span>
       <span className="drop-shadow-lg">{error}</span>
      </div>
     </div>
    )}

    {/* Empty State */}
    {!loading && !isSearching && !error && files.length === 0 && (
     <div className="backdrop-blur-xl bg-black/40 rounded-2xl p-12 shadow-2xl text-center fade-in">
      <div className="mb-4 inline-block p-4 rounded-full bg-white/10 backdrop-blur-sm shadow-lg">
       <FileText className="w-12 h-12 text-white drop-shadow-lg" />
      </div>
      <p className="text-white/90 text-lg drop-shadow-lg">
       {searchTerm ? 'Nenhum arquivo encontrado para sua busca.' : 'Nenhum arquivo encontrado.'}
      </p>
      {searchTerm && (
       <button
        onClick={() => {
         setSearchTerm('');
         fetchFiles();
        }}
        className="mt-4 px-6 py-2 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors"
       >
        Limpar busca
       </button>
      )}
     </div>
    )}

    {/* Files Table */}
    {!loading && !error && files.length > 0 && (() => {
     const totalPages = Math.ceil(files.length / FILES_PER_PAGE);
     const paginatedFiles = files.slice(currentPage * FILES_PER_PAGE, (currentPage + 1) * FILES_PER_PAGE);
     const startIndex = currentPage * FILES_PER_PAGE;
     return (
     <div className="backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl overflow-hidden slide-up">
      <div className="px-6 py-4 border-b border-white/10 bg-black/20">
       <div className="flex items-center justify-between">
        <div className="text-sm text-white/80 drop-shadow-md flex items-center space-x-2">
         <FileText className="w-4 h-4" />
         <span>{files.length} arquivo{files.length !== 1 ? 's' : ''} encontrado{files.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center space-x-4">
         {searchTerm && (
          <div className="text-xs text-amber-300 drop-shadow-md">
           Resultados para: &quot;{searchTerm}&quot;
          </div>
         )}
         {totalPages > 1 && (
          <div className="flex items-center space-x-2">
           <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
            aria-label="Página anterior"
           >
            <ChevronLeft className="w-4 h-4" />
           </button>
           <span className="text-xs text-white/70 tabular-nums min-w-[60px] text-center">
            {currentPage + 1} / {totalPages}
           </span>
           <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
            aria-label="Próxima página"
           >
            <ChevronRight className="w-4 h-4" />
           </button>
          </div>
         )}
        </div>
       </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
       <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-black/30">
         <tr>
          <Th>
           <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Nome</span>
           </div>
          </Th>
           <Th>
            <div className="flex items-center space-x-2">
             <Hash className="w-4 h-4" />
             <span>CID</span>
            </div>
           </Th>
          <Th>
           <div className="flex items-center space-x-2">
            <FaRegCalendar className="w-4 h-4" />
            <span>Data</span>
           </div>
          </Th>

          <Th>Arquivo</Th>
         </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
         {paginatedFiles.map((f, index) => (
          <tr
           key={f.id}
           className="hover:bg-white/10 group"
           style={{
            animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
           }}
          >
           <Td className="font-medium text-white drop-shadow-md">{f.filename}</Td>
            <Td>
             {f.fileAddress ? (() => {
              const cid = extractCid(f.fileAddress);
              const isCopied = copiedCid === cid;
              return (
               <div
                className="cid-cell inline-flex items-center gap-2 group/cid"
                onClick={() => handleCopyCid(cid)}
                title=""
               >
                <span className="font-mono text-xs text-amber-300/90 drop-shadow-md">
                 {cid.substring(0, 20)}…
                </span>
                <span className={`transition-all duration-200 ${isCopied ? 'text-emerald-400' : 'text-white/30 group-hover/cid:text-amber-400'}`}>
                 {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </span>
                <div className={`cid-tooltip ${isCopied ? 'cid-copied' : ''}`}>
                 {isCopied ? '✓ Copiado!' : cid}
                </div>
               </div>
              );
             })() : (
              <span className="text-white/40">—</span>
             )}
            </Td>
           <Td className="drop-shadow-md">{formatDate(f.date)}</Td>
           <Td>
            {f.fileAddress ? (
             <a
              href={f.fileAddress}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium transition-all group/link"
             >
              <span className="drop-shadow-md">Abrir</span>
              <span className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform">↗</span>
             </a>
            ) : (
             <span className="text-white/40">—</span>
            )}
           </Td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
      {totalPages > 1 && (
       <div className="px-6 py-3 border-t border-white/10 bg-black/20 flex items-center justify-between">
        <span className="text-xs text-white/50">
         Mostrando {startIndex + 1}–{Math.min(startIndex + FILES_PER_PAGE, files.length)} de {files.length}
        </span>
        <div className="flex items-center space-x-2">
         <button
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white text-xs flex items-center space-x-1"
          aria-label="Página anterior"
         >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Anterior</span>
         </button>
         <span className="text-xs text-white/70 tabular-nums">
          {currentPage + 1} / {totalPages}
         </span>
         <button
          onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={currentPage === totalPages - 1}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white text-xs flex items-center space-x-1"
          aria-label="Próxima página"
         >
          <span>Próxima</span>
          <ChevronRight className="w-3.5 h-3.5" />
         </button>
        </div>
       </div>
      )}
     </div>
     );
    })()}

    {/* Analysis Image Section */}
    {analysisImage && (
     <div className="mt-6 backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl p-8 fade-in">
      <div className="flex items-center justify-between mb-6">
       <h2 className="text-2xl font-bold text-white drop-shadow-lg flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-amber-500/30">
         <FileText className="w-6 h-6 text-amber-300" />
        </div>
        <span>Análise Gerada</span>
       </h2>
       <button
        onClick={() => setAnalysisImage(null)}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
       >
        <X className="w-5 h-5" />
       </button>
      </div>
      <div className="flex justify-center mb-6 bg-white/5 rounded-xl p-4 ">
       <img
        src={`${analysisImage}`}
        alt="Analysis Chart"
        className="max-w-full h-auto rounded-lg shadow-2xl"
       />
      </div>
      <div className="flex flex-wrap justify-center gap-3">
       <button
        onClick={() => saveImage(analysisImage)}
        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 group"
       >
        <Download className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
        <span>Fazer Download</span>
       </button>
       <button
        onClick={() => saveOnStatistics(analysisImage)}
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 group"
       >
        <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span>Salvar em "Estatísticas"</span>
       </button>
      </div>
     </div>
    )}
   </div>
  </div>
 );
}

function Th({ children }: { children: React.ReactNode }) {
 return (
  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/90 drop-shadow-lg">
   {children}
  </th>
 );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
 return <td className={`px-6 py-4 text-sm text-white/80 ${className}`}>{children}</td>;
}

export default function ProtectedSearchPage() {
 return (
  <AuthGuard>
   <SearchPage />
  </AuthGuard>
 );
}

export function saveImage(image: string | null) {
 if (!image) return;

 const link = document.createElement('a');
 link.href = image;
 link.download = 'analysis.png';
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
}
