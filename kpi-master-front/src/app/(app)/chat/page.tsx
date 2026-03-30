'use client';

import AuthGuard from '@/components/AuthGuard';
import ChartGuidePopup from '@/components/ChartGuidePopup';
import FilePreviewPopup from '@/components/FilePreviewPopup';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState, useRef } from 'react';
import { FileText, Send, ChevronDown, Edit2, Check, X, Trash2, HelpCircle, BarChart3, Sparkles, Download, ImagePlus, Search, Eye } from 'lucide-react';

type ApiFile = {
 id: number;
 filename: string;
 institution: string;
 writer: string;
 date: string;
 fileAddress: string;
 fileType?: string;
};

type FilePreviewResponse = {
 headers?: string[];
 rows?: string[][];
 detail?: string;
};

type ChatMessage = {
 id: string;
 _id?: string; // MongoDB ObjectId for lazy image loading
 type: 'user' | 'assistant';
 content: string;
 timestamp: Date;
 image?: string; // Base64 encoded image or URL
 hasImage?: boolean; // Flag from API indicating image exists
 imageLoading?: boolean; // True while loading image lazily
};

type SelectionMode = 'files' | 'institutions';

const DEFAULT_TEMPLATE_QUESTIONS = [
 "Provide a full overview of the file",
 "Are the dataset clean? Are there NaN values?",
 "What are the main KPIs covered in this file?",
 "Summarize the key findings and insights",
 "What are the data quality issues, if any?"
];

const AVAILABLE_MODELS = [
 "gpt-5.4-pro",
 "gpt-5.4",
 "gpt-5.2-pro",
 "gpt-5.2",
 "gpt-5",
 "gpt-5-mini",
 "gpt-5-nano",
 "gpt-4.1",
 "gpt-4.1-mini",
 "gpt-4.1-nano",
 "gpt-4o",
];

const DEFAULT_MODEL = "gpt-5-mini";

export function ChatPage() {
 const [files, setFiles] = useState<ApiFile[]>([]);
 const [selectedFile, setSelectedFile] = useState<ApiFile | null>(null);
 const [messages, setMessages] = useState<ChatMessage[]>([]);
 const [inputMessage, setInputMessage] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const [username, setUsername] = useState<string | null>(null);
 const [token, setToken] = useState<string | null>(null);
 const [isDropdownOpen, setIsDropdownOpen] = useState(false);
 const [templateQuestions, setTemplateQuestions] = useState<string[]>(DEFAULT_TEMPLATE_QUESTIONS);
 const [isEditingTemplates, setIsEditingTemplates] = useState(false);
 const [editedQuestions, setEditedQuestions] = useState<string[]>([]);
 const [selectionMode, setSelectionMode] = useState<SelectionMode>('files');
 const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
 const [selectedFileIds, setSelectedFileIds] = useState<Set<number>>(new Set());
 const [isChartGuideOpen, setIsChartGuideOpen] = useState(false);
 const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
 const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
 const [amplifiedImage, setAmplifiedImage] = useState<string | null>(null);
 const [toastMessage, setToastMessage] = useState<string | null>(null);
 const [isPreviewOpen, setIsPreviewOpen] = useState(false);
 const [previewFileId, setPreviewFileId] = useState<number | null>(null);
 const [previewLoading, setPreviewLoading] = useState(false);
 const [previewError, setPreviewError] = useState<string | null>(null);
 const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
 const [previewRows, setPreviewRows] = useState<string[][]>([]);
 const messagesEndRef = useRef<HTMLDivElement>(null);
 const dropdownRef = useRef<HTMLDivElement>(null);
 const modelDropdownRef = useRef<HTMLDivElement>(null);

 // Auto-hide toast after 3s
 useEffect(() => {
  if (toastMessage) {
   const timer = setTimeout(() => setToastMessage(null), 3000);
   return () => clearTimeout(timer);
  }
 }, [toastMessage]);

 const showToast = (msg: string) => setToastMessage(msg);

 // Track if chat is active (has messages) to expand the chat area
 const isChatActive = messages.length > 0 || isLoading;

 const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 };

 useEffect(() => {
  scrollToBottom();
 }, [messages, isLoading]);

 // Save a single chat message to MongoDB via API
 const saveChatMessageToAPI = async (chatId: string, msg: ChatMessage) => {
  try {
   const res = await fetch('http://localhost:8080/chat/save', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     ...(token ? { Authorization: `${token}` } : {}),
    },
    body: JSON.stringify({
     chatId,
     type: msg.type,
     content: msg.content,
     image: msg.image || '',
     timestamp: msg.timestamp.toISOString(),
    }),
   });
   const data = await res.json();
   return data._id as string;
  } catch (err) {
   console.error('Error saving chat message:', err);
   return null;
  }
 };

 // Load chat history from MongoDB via API
 const loadChatHistoryFromAPI = async (chatId: string): Promise<ChatMessage[]> => {
  try {
   const res = await fetch('http://localhost:8080/chat/load', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     ...(token ? { Authorization: `${token}` } : {}),
    },
    body: JSON.stringify({ chatId }),
   });
   const data = await res.json();
   if (Array.isArray(data)) {
    return data.map((msg: any) => ({
     id: msg._id || msg.id,
     _id: msg._id,
     type: msg.type,
     content: msg.content,
     timestamp: new Date(msg.timestamp),
     hasImage: msg.hasImage || false,
     imageLoading: false,
    }));
   }
   return [];
  } catch (err) {
   console.error('Error loading chat history:', err);
   return [];
  }
 };

 // Load a single message's image lazily from MongoDB
 const loadChatImage = async (messageId: string) => {
  try {
   const res = await fetch('http://localhost:8080/chat/image', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     ...(token ? { Authorization: `${token}` } : {}),
    },
    body: JSON.stringify({ messageId }),
   });
   const data = await res.json();
   return data.image as string;
  } catch (err) {
   console.error('Error loading chat image:', err);
   return null;
  }
 };

 // Load messages and lazily load images for those that have them
 const loadAndSetMessages = async (chatId: string) => {
  const msgs = await loadChatHistoryFromAPI(chatId);
  setMessages(msgs);

  // Lazily load images for messages that have them
  for (const msg of msgs) {
   if (msg.hasImage && msg._id) {
    // Mark as loading
    setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, imageLoading: true } : m));
    const image = await loadChatImage(msg._id);
    if (image) {
     setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, image, imageLoading: false } : m));
    } else {
     setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, imageLoading: false } : m));
    }
   }
  }
 };

 // Clear chat history for current selection via API
 const clearChatHistory = async () => {
  const identifier = getChatIdentifier();
  if (!identifier) return;

  try {
   await fetch('http://localhost:8080/chat/clear', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     ...(token ? { Authorization: `${token}` } : {}),
    },
    body: JSON.stringify({ chatId: identifier }),
   });
  } catch (err) {
   console.error('Error clearing chat history:', err);
  }
  setMessages([]);
 };

 const saveToGallery = async (base64Image: string) => {
  try {
   const res = await fetch('http://localhost:8080/gallery/save', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     ...(token ? { Authorization: `${token}` } : {}),
    },
    body: JSON.stringify({ image: base64Image }),
   });
   if (res.ok) {
    showToast('Imagem salva na galeria!');
   } else {
    showToast('Erro ao salvar imagem.');
   }
  } catch (err) {
   console.error('Error saving to gallery:', err);
   showToast('Erro ao salvar imagem.');
  }
 };

 const handleDownloadImage = (base64Image: string) => {
  const link = document.createElement('a');
  link.href = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
  link.download = `chart_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
 };

 const getPreviewFiles = (): ApiFile[] => {
  if (selectionMode === 'files') {
   return selectedFile ? [selectedFile] : [];
  }

  if (!selectedInstitution) {
   return [];
  }

  return getFilesForInstitution(selectedInstitution).filter((file) => selectedFileIds.has(file.id));
 };

 const loadFilePreview = async (fileId: number) => {
  const file = files.find((item) => item.id === fileId);
  if (!file) {
   setPreviewError('Arquivo não encontrado para pré-visualização.');
   setPreviewHeaders([]);
   setPreviewRows([]);
   return;
  }

  setPreviewLoading(true);
  setPreviewError(null);
  setPreviewHeaders([]);
  setPreviewRows([]);

  try {
  const response = await fetch('http://localhost:8080/file-preview', {
   method: 'POST',
   headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `${token}` } : {}),
   },
   body: JSON.stringify({
    fileId,
    maxRows: 20,
    maxCols: 12,
   }),
  });

   if (!response.ok) {
   const payload: FilePreviewResponse = await response.json().catch(() => ({}));
   throw new Error(payload.detail || `Falha ao carregar arquivo (status ${response.status}).`);
   }

  const preview: FilePreviewResponse = await response.json();
  setPreviewHeaders(preview.headers ?? []);
  setPreviewRows(preview.rows ?? []);
  } catch {
   setPreviewError('Não foi possível carregar a prévia deste arquivo. Verifique se o arquivo está acessível e tente novamente.');
  } finally {
   setPreviewLoading(false);
  }
 };

 const handleOpenPreview = () => {
  const previewFiles = getPreviewFiles();
  if (previewFiles.length === 0) {
   return;
  }

  const targetFile = previewFiles.find((file) => file.id === previewFileId) || previewFiles[0];
  setPreviewFileId(targetFile.id);
  setIsPreviewOpen(true);
  void loadFilePreview(targetFile.id);
 };

 const handlePreviewFileSelect = (fileId: number) => {
  setPreviewFileId(fileId);
  void loadFilePreview(fileId);
 };

 // Get unique institutions from files
 const getInstitutions = (): string[] => {
  const institutions = new Set(files.map(f => f.institution));
  return Array.from(institutions).sort();
 };

 // Get files for selected institution
 const getFilesForInstitution = (institution: string): ApiFile[] => {
  return files.filter(f => f.institution === institution);
 };

 // Get chat identifier for storage
 const getChatIdentifier = (): string | null => {
  if (selectionMode === 'files' && selectedFile) {
   return `file_${selectedFile.id}`;
  }
  if (selectionMode === 'institutions' && selectedInstitution) {
   return `institution_${selectedInstitution}`;
  }
  return null;
 };

 // Toggle file selection in multi-select mode
 const toggleFileSelection = (fileId: number) => {
  const newSelection = new Set(selectedFileIds);
  if (newSelection.has(fileId)) {
   newSelection.delete(fileId);
  } else {
   newSelection.add(fileId);
  }
  setSelectedFileIds(newSelection);
 };

 // Select all files for institution
 const selectAllFilesForInstitution = (institution: string) => {
  const institutionFiles = getFilesForInstitution(institution);
  const allIds = new Set(institutionFiles.map(f => f.id));
  setSelectedFileIds(allIds);
 };

 // Handle mode change
 const handleModeChange = (mode: SelectionMode) => {
  setSelectionMode(mode);
  setSelectedFile(null);
  setSelectedInstitution(null);
  setSelectedFileIds(new Set());
  setMessages([]);
  setIsPreviewOpen(false);
  setPreviewFileId(null);
  setIsDropdownOpen(false);
 };

 // Handle institution selection
 const handleInstitutionSelect = (institution: string) => {
  setSelectedInstitution(institution);
  selectAllFilesForInstitution(institution);
  const identifier = `institution_${institution}`;
  loadAndSetMessages(identifier);
  setIsDropdownOpen(false);
 };

 // Handle file selection in files mode
 const handleFileSelect = (file: ApiFile) => {
  setSelectedFile(file);
  const identifier = `file_${file.id}`;
  loadAndSetMessages(identifier);
  setIsDropdownOpen(false);
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

   // Load template questions from localStorage
   const savedTemplates = localStorage.getItem('templateQuestions');
   if (savedTemplates) {
    setTemplateQuestions(JSON.parse(savedTemplates));
   }
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
   if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
    setIsModelDropdownOpen(false);
   }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const fetchFiles = async () => {
  if (!username) return;

  try {
   const res = await fetch('http://localhost:8080/files', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     ...(token ? { Authorization: `${token}` } : {}),
    },
    body: JSON.stringify({ username }),
   });
   const data: ApiFile[] = await res.json();

   if (res.ok) {
    setFiles(Array.isArray(data) ? data : []);
   }
  } catch (err) {
   console.error('Error fetching files:', err);
  }
 };

 useEffect(() => {
  if (username !== null) {
   fetchFiles();
  }
 }, [username]);

 const sendMessage = async (generateChart: boolean = false, chartRecommendation: boolean = false) => {
  // Chart recommendation doesn't require text input
  if (!chartRecommendation && (!inputMessage.trim() || isLoading)) return;
  if (chartRecommendation && isLoading) return;

  // Check if we have any files to analyze
  const hasSelection = selectionMode === 'files' ? selectedFile : (selectedInstitution && selectedFileIds.size > 0);
  if (!hasSelection) return;

  const displayPrompt = chartRecommendation
   ? 'Qual gráfico de visualização é adequado para esse arquivo?'
   : inputMessage;

  const userMessage: ChatMessage = {
   id: Date.now().toString(),
   type: 'user',
   content: displayPrompt,
   timestamp: new Date(),
  };

  const updatedMessages = [...messages, userMessage];
  setMessages(updatedMessages);
  const currentPrompt = chartRecommendation ? displayPrompt : inputMessage;
  setInputMessage('');
  setIsLoading(true);

  // Save user message to MongoDB (fire-and-forget)
  const identifier = getChatIdentifier();
  if (identifier) {
   saveChatMessageToAPI(identifier, userMessage).then(savedId => {
    if (savedId) {
     setMessages(prev => prev.map(m => m.id === userMessage.id ? { ...m, _id: savedId } : m));
    }
   });
  }

  try {
   if (currentPrompt.toLowerCase().trim() === 'teste') {
    const assistantMessage: ChatMessage = {
     id: (Date.now() + 1).toString(),
     type: 'assistant',
     content: 'Esta é uma resposta genérica de teste. O sistema está funcionando corretamente!',
     timestamp: new Date(),
    };
    const finalMessages = [...updatedMessages, assistantMessage];
    setMessages(finalMessages);
    if (identifier) {
     saveChatMessageToAPI(identifier, assistantMessage);
    }
    setIsLoading(false);
    return;
   }

   // Prepare file IDs for analysis
   const fileIds = selectionMode === 'files'
    ? [selectedFile!.id]
    : Array.from(selectedFileIds);

   const res = await fetch('http://localhost:8080/analysis-gen', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     ...(token ? { Authorization: `${token}` } : {}),
    },
    body: JSON.stringify({
     fileIds: fileIds,
     prompt: currentPrompt,
     generateChart: generateChart,
     chartRecommendation: chartRecommendation,
      chatId: identifier,
      forceRefresh: false,
     model: selectedModel,
    }),
   });

   const response = await res.text();
   const payload = JSON.parse(response);

   const assistantMessage: ChatMessage = {
    id: (Date.now() + 1).toString(),
    type: 'assistant',
    content: payload.text_response || response,
    timestamp: new Date(),
    image: payload.image || undefined,
    hasImage: !!payload.image,
   };

   const finalMessages = [...updatedMessages, assistantMessage];
   setMessages(finalMessages);
   // Save assistant message to MongoDB
   if (identifier) {
    saveChatMessageToAPI(identifier, assistantMessage);
   }
  } catch (err) {
   const errorMessage: ChatMessage = {
    id: (Date.now() + 1).toString(),
    type: 'assistant',
    content: 'Desculpe, ocorreu um erro ao processar sua pergunta.',
    timestamp: new Date(),
   };
   const finalMessages = [...updatedMessages, errorMessage];
   setMessages(finalMessages);
   if (identifier) {
    saveChatMessageToAPI(identifier, errorMessage);
   }
  } finally {
   setIsLoading(false);
  }
 };

 const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
   e.preventDefault();
   sendMessage();
  }
 };

 const handleTemplateClick = (question: string) => {
  setInputMessage(question);
 };

 const startEditingTemplates = () => {
  setEditedQuestions([...templateQuestions]);
  setIsEditingTemplates(true);
 };

 const saveTemplateQuestions = () => {
  const validQuestions = editedQuestions.filter(q => q.trim() !== '');
  if (validQuestions.length === 0) {
   setEditedQuestions([...templateQuestions]);
   setIsEditingTemplates(false);
   return;
  }
  setTemplateQuestions(validQuestions);
  localStorage.setItem('templateQuestions', JSON.stringify(validQuestions));
  setIsEditingTemplates(false);
 };

 const cancelEditingTemplates = () => {
  setEditedQuestions([]);
  setIsEditingTemplates(false);
 };

 const updateTemplateQuestion = (index: number, value: string) => {
  const updated = [...editedQuestions];
  updated[index] = value;
  setEditedQuestions(updated);
 };

 const addTemplateQuestion = () => {
  setEditedQuestions([...editedQuestions, '']);
 };

 const removeTemplateQuestion = (index: number) => {
  if (editedQuestions.length > 1) {
   setEditedQuestions(editedQuestions.filter((_, i) => i !== index));
  }
 };

 return (
  <div className="p-6 h-screen flex flex-col overflow-hidden">
   <style jsx global>{`
    .custom-scrollbar::-webkit-scrollbar {
     width: 8px;
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

    .message-enter {
     animation: fadeIn 0.3s ease-out;
    }

    .dropdown-enter {
     animation: slideIn 0.2s ease-out;
    }

    /* Dark overlay for better contrast */
    .chat-overlay {
     background: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 100%);
    }
    
    /* Expanded chat mode */
    .chat-expanded {
     max-width: 66rem !important;
     padding-left: 2rem !important;
     padding-right: 2rem !important;
    }
    
    .selection-collapsed {
     animation: collapseIn 0.3s ease-out;
    }
    
    @keyframes collapseIn {
     from {
      opacity: 1;
      max-height: 200px;
     }
     to {
      opacity: 1;
      max-height: 60px;
     }
    }
   `}</style>

   <div className={`mx-auto flex-1 flex flex-col min-h-0 transition-all duration-500 ease-in-out ${isChatActive ? 'chat-expanded w-full' : 'max-w-6xl'}`}>

    {/* Custom File Selection Dropdown - Collapses when chat is active */}
    <div className={`flex-shrink-0 relative z-20 transition-all duration-500 ease-in-out ${isChatActive ? 'mb-3' : 'mb-6'}`} ref={dropdownRef}>
     {/* Mode Selection Toggle - Hidden when chat is active */}
     {!isChatActive && (
      <div className="mb-4 flex items-center justify-between">
       <div className="flex items-center space-x-2">
        <button
         onClick={() => handleModeChange('files')}
         className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${selectionMode === 'files'
          ? 'bg-amber-500 text-white shadow-lg'
          : 'bg-black/30 text-white/70 hover:bg-black/40'
          }`}
        >
         Arquivos
        </button>
        <button
         onClick={() => handleModeChange('institutions')}
         className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${selectionMode === 'institutions'
          ? 'bg-amber-500 text-white shadow-lg'
          : 'bg-black/30 text-white/70 hover:bg-black/40'
          }`}
        >
         Instituições
        </button>
       </div>

       {/* Model Selector Dropdown */}
       <div className="relative" ref={modelDropdownRef}>
        <button
         onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
         className="px-4 py-2 rounded-lg bg-black/40 text-white backdrop-blur-md hover:bg-black/50 transition-all duration-300 flex items-center space-x-2 group shadow-xl"
        >
         <span className="text-sm font-medium text-white/80">Modelo:</span>
         <span className="text-sm font-medium text-amber-300">{selectedModel}</span>
         <ChevronDown
          className={`w-4 h-4 text-white/80 transition-transform duration-300 ${isModelDropdownOpen ? 'rotate-180' : ''}`}
         />
        </button>

        {isModelDropdownOpen && (
         <div className="absolute z-10 right-0 mt-2 w-56 rounded-xl bg-white/98 backdrop-blur-sm shadow-2xl overflow-hidden dropdown-enter">
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
           {AVAILABLE_MODELS.map((model, index) => (
            <button
             key={model}
             onClick={() => {
              setSelectedModel(model);
              setIsModelDropdownOpen(false);
             }}
             className={`w-full p-3 text-left hover:bg-amber-50 transition-all duration-200 flex items-center justify-between group ${selectedModel === model ? 'bg-amber-100' : ''} ${index !== 0 ? 'border-t border-gray-100' : ''}`}
            >
             <span className="font-medium text-gray-900 text-sm">{model}</span>
             {selectedModel === model && (
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500"></div>
             )}
            </button>
           ))}
          </div>
         </div>
        )}
       </div>
      </div>
     )}

     {/* Compact bar when chat is active */}
     {isChatActive ? (
      <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 backdrop-blur-md shadow-lg">
       <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-amber-500/30 shadow-lg">
         <FileText className="w-4 h-4 text-amber-300" />
        </div>
        <div className="text-white text-sm">
         {selectionMode === 'files' && selectedFile && (
          <span><strong>{selectedFile.filename}</strong> • {selectedFile.institution}</span>
         )}
         {selectionMode === 'institutions' && selectedInstitution && (
          <span><strong>{selectedInstitution}</strong> • {selectedFileIds.size} arquivo(s)</span>
         )}
        </div>
       </div>
       <div className="flex items-center space-x-3">
        {/* Compact Model Selector */}
        <div className="relative" ref={modelDropdownRef}>
         <button
          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 flex items-center space-x-1.5"
         >
          <span className="text-white/60">Modelo:</span>
          <span className="text-amber-300 font-medium">{selectedModel}</span>
          <ChevronDown className={`w-3 h-3 text-white/60 transition-transform duration-300 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
         </button>

         {isModelDropdownOpen && (
          <div className="absolute z-10 right-0 mt-2 w-56 rounded-xl bg-white/98 backdrop-blur-sm shadow-2xl overflow-hidden dropdown-enter">
           <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {AVAILABLE_MODELS.map((model, index) => (
             <button
              key={model}
              onClick={() => {
               setSelectedModel(model);
               setIsModelDropdownOpen(false);
              }}
              className={`w-full p-3 text-left hover:bg-amber-50 transition-all duration-200 flex items-center justify-between ${selectedModel === model ? 'bg-amber-100' : ''} ${index !== 0 ? 'border-t border-gray-100' : ''}`}
             >
              <span className="font-medium text-gray-900 text-sm">{model}</span>
              {selectedModel === model && (
               <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500"></div>
              )}
             </button>
            ))}
           </div>
          </div>
         )}
        </div>
        <button
         onClick={() => {
          setMessages([]);
          setSelectedFile(null);
          setSelectedInstitution(null);
          setSelectedFileIds(new Set());
          setIsPreviewOpen(false);
          setPreviewFileId(null);
         }}
         className="px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 "
        >
         Trocar arquivo
        </button>
        <button
         onClick={handleOpenPreview}
         disabled={getPreviewFiles().length === 0}
         className="px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white/80 hover:text-white transition-all duration-200 flex items-center space-x-1.5"
         title="Pré-visualizar arquivo"
        >
         <Eye className="w-3.5 h-3.5" />
         <span>Prévia</span>
        </button>
       </div>
      </div>
     ) : (
      <>
       <label className="block text-sm font-medium text-white mb-2 drop-shadow-lg">
        {selectionMode === 'files' ? 'Selecione um arquivo:' : 'Selecione uma instituição:'}
       </label>
       <div className="relative">
        <button
         onClick={() => setIsDropdownOpen(!isDropdownOpen)}
         className="w-full p-4 rounded-xl bg-black/40 text-white backdrop-blur-md hover:bg-black/50 transition-all duration-300 flex items-center justify-between group shadow-xl"
        >
         <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/30 group-hover:bg-amber-500/40 transition-colors shadow-lg">
           <FileText className="w-5 h-5 text-amber-300" />
          </div>
          <div className="text-left">
           {selectionMode === 'files' ? (
            selectedFile ? (
             <>
              <div className="font-medium drop-shadow-md">{selectedFile.filename}</div>
              <div className="text-sm text-white/80 drop-shadow-md">{selectedFile.institution}</div>
             </>
            ) : (
             <div className="text-white/80 drop-shadow-md">Escolha um arquivo...</div>
            )
           ) : (
            selectedInstitution ? (
             <>
              <div className="font-medium drop-shadow-md">{selectedInstitution}</div>
              <div className="text-sm text-white/80 drop-shadow-md">
               {selectedFileIds.size} arquivo(s) selecionado(s)
              </div>
             </>
            ) : (
             <div className="text-white/80 drop-shadow-md">Escolha uma instituição...</div>
            )
           )}
          </div>
         </div>
         <ChevronDown
          className={`w-5 h-5 text-white/80 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''
           }`}
         />
        </button>

        {isDropdownOpen && (
         <div className="absolute z-10 w-full mt-2 rounded-xl bg-white/98 backdrop-blur-sm shadow-2xl overflow-hidden dropdown-enter">
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
           {selectionMode === 'files' ? (
            files.length === 0 ? (
             <div className="p-4 text-center text-gray-600 font-medium">
              Nenhum arquivo disponível
             </div>
            ) : (
             files.map((file, index) => (
              <button
               key={file.id}
               onClick={() => handleFileSelect(file)}
               className={`w-full p-4 text-left hover:bg-amber-50 transition-all duration-200 flex items-center space-x-3 group ${selectedFile?.id === file.id ? 'bg-amber-100' : ''
                } ${index !== 0 ? 'border-t border-gray-100' : ''}`}
              >
               <div className={`p-2 rounded-lg transition-colors ${selectedFile?.id === file.id
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600 group-hover:bg-amber-100'
                }`}>
                <FileText className="w-4 h-4" />
               </div>
               <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                 {file.filename}
                </div>
                <div className="text-sm text-gray-500 truncate">
                 {file.institution} • {file.writer}
                </div>
               </div>
               {selectedFile?.id === file.id && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500"></div>
               )}
              </button>
             ))
            )
           ) : (
            getInstitutions().length === 0 ? (
             <div className="p-4 text-center text-gray-600 font-medium">
              Nenhuma instituição disponível
             </div>
            ) : (
             getInstitutions().map((institution, index) => (
              <div key={institution} className={index !== 0 ? 'border-t border-gray-100' : ''}>
               <button
                onClick={() => handleInstitutionSelect(institution)}
                className={`w-full p-4 text-left hover:bg-amber-50 transition-all duration-200 ${selectedInstitution === institution ? 'bg-amber-50' : ''
                 }`}
               >
                <div className="font-medium text-gray-900">{institution}</div>
                <div className="text-sm text-gray-500">
                 {getFilesForInstitution(institution).length} arquivo(s)
                </div>
               </button>

               {selectedInstitution === institution && (
                <div className="bg-gray-50 px-4 pb-4 space-y-2">
                 <div className="text-xs text-gray-600 font-medium mb-2">
                  Selecione os arquivos:
                 </div>
                 {getFilesForInstitution(institution).map((file) => (
                  <label
                   key={file.id}
                   className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors"
                   onClick={(e) => e.stopPropagation()}
                  >
                   <input
                    type="checkbox"
                    checked={selectedFileIds.has(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
                   />
                   <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                     {file.filename}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                     {file.writer}
                    </div>
                   </div>
                  </label>
                 ))}
                </div>
               )}
              </div>
             ))
            )
           )}
          </div>
         </div>
        )}
       </div>

       {selectionMode === 'files' && selectedFile && (
        <div className="mt-3 p-3 rounded-lg bg-amber-500/20 text-amber-100 text-sm flex items-center space-x-2 message-enter shadow-lg backdrop-blur-sm">
         <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-lg"></div>
         <span className="drop-shadow-md">Arquivo selecionado: <strong>{selectedFile.filename}</strong></span>
        </div>
       )}

       {selectionMode === 'institutions' && selectedInstitution && (
        <div className="mt-3 p-3 rounded-lg bg-amber-500/20 text-amber-100 text-sm message-enter shadow-lg backdrop-blur-sm">
         <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-lg"></div>
          <span className="drop-shadow-md">
           Instituição: <strong>{selectedInstitution}</strong>
          </span>
         </div>
         <div className="text-xs text-amber-200/80 drop-shadow-md">
          {selectedFileIds.size} de {getFilesForInstitution(selectedInstitution).length} arquivo(s) selecionado(s)
         </div>
        </div>
       )}
      </>
     )}
    </div>

    {/* Template Questions Section */}
    {(selectedFile || selectedInstitution) && messages.length === 0 && (
     <div className="mb-4 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
       <label className="block text-sm font-medium text-white drop-shadow-lg">
        Perguntas sugeridas:
       </label>
       {!isEditingTemplates ? (
        <button
         onClick={startEditingTemplates}
         className="text-xs text-amber-300 hover:text-amber-200 flex items-center space-x-1 transition-colors"
        >
         <Edit2 className="w-3 h-3" />
         <span>Editar</span>
        </button>
       ) : (
        <div className="flex items-center space-x-2">
         <button
          onClick={saveTemplateQuestions}
          className="text-xs text-green-300 hover:text-green-200 flex items-center space-x-1 transition-colors"
         >
          <Check className="w-3 h-3" />
          <span>Salvar</span>
         </button>
         <button
          onClick={cancelEditingTemplates}
          className="text-xs text-red-300 hover:text-red-200 flex items-center space-x-1 transition-colors"
         >
          <X className="w-3 h-3" />
          <span>Cancelar</span>
         </button>
        </div>
       )}
      </div>

      {!isEditingTemplates ? (
       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {templateQuestions.map((question, index) => (
         <button
          key={index}
          onClick={() => handleTemplateClick(question)}
          disabled={isLoading}
          className="p-3 rounded-lg bg-black/30 text-white text-sm text-left hover:bg-black/40 hover:border-amber-400/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg hover:shadow-amber-500/20 group"
         >
          <span className="group-hover:text-amber-200 transition-colors drop-shadow-md">
           {question}
          </span>
         </button>
        ))}
       </div>
      ) : (
       <div className="space-y-2">
        {editedQuestions.map((question, index) => (
         <div key={index} className="flex items-center space-x-2">
          <input
           type="text"
           value={question}
           onChange={(e) => updateTemplateQuestion(index, e.target.value)}
           placeholder="Digite uma pergunta..."
           className="flex-1 p-3 rounded-lg bg-black/30 text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500/70 transition-all backdrop-blur-sm"
          />
          <button
           onClick={() => removeTemplateQuestion(index)}
           disabled={editedQuestions.length === 1}
           className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
           <X className="w-4 h-4" />
          </button>
         </div>
        ))}
        <button
         onClick={addTemplateQuestion}
         className="w-full p-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors text-sm"
        >
         + Adicionar pergunta
        </button>
       </div>
      )}
     </div>
    )}

    {/* Chat Messages */}
    <div className="flex-1 mb-4 min-h-0 rounded-xl bg-black/40 backdrop-blur-md overflow-hidden shadow-2xl">
     {/* Header with Clear History button */}
     {messages.length > 0 && (
      <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-black/20">
       <div className="text-sm text-white/80 drop-shadow-md">
        {messages.length} mensagem{messages.length !== 1 ? 's' : ''}
       </div>
       <button
        onClick={clearChatHistory}
        className="text-xs text-red-300 hover:text-red-200 flex items-center space-x-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/20 border border-transparent hover:border-red-400/30"
       >
        <Trash2 className="w-3 h-3" />
        <span>Limpar histórico</span>
       </button>
      </div>
     )}

     <div className="h-full overflow-y-auto p-6 space-y-4 custom-scrollbar">
      {messages.length === 0 ? (
       <div className="text-center text-white py-12">
        <div className="mb-4 inline-block p-4 rounded-full bg-white/10 backdrop-blur-sm shadow-lg">
         <FileText className="w-8 h-8 drop-shadow-lg" />
        </div>
        <div className="text-lg drop-shadow-lg">
         {selectedFile
          ? `Faça uma pergunta sobre ${selectedFile.filename}!`
          : 'Selecione um arquivo para começar a conversar'
         }
        </div>
       </div>
      ) : (
       messages.map((message, index) => (
        <div
         key={message.id}
         className={`flex message-enter ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
         style={{
          animationDelay: `${index * 0.1}s`,
         }}
        >
         <div
          className={`max-w-[75%] p-4 rounded-2xl transition-all duration-300 ${message.type === 'user'
           ? 'bg-white/10 text-white rounded-br-sm backdrop-blur-sm'
           : 'text-white'
           }`}
         >
          <div className={`prose prose-sm max-w-none prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 ${message.type === 'user' ? 'whitespace-pre-wrap' : ''} ${message.type === 'assistant' ? 'prose-p:text-white/90 prose-headings:text-white prose-strong:text-white prose-li:text-white/90 leading-normal' : 'leading-relaxed'}`}>
           <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          {message.imageLoading && (
           <div className="mt-3 flex items-center space-x-2 text-white/60 text-sm">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Carregando imagem...</span>
           </div>
          )}
          {message.image && !message.imageLoading && (
           <div className="mt-3 relative group inline-block cursor-pointer overflow-hidden rounded-lg" onClick={() => setAmplifiedImage(message.image!)}>
            <img
             src={message.image.startsWith('data:') ? message.image : `data:image/png;base64,${message.image}`}
             alt="Generated visualization"
             className="max-w-full h-auto shadow-lg"
            />
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
             <Search className="w-8 h-8 text-white/80 drop-shadow-lg" />
            </div>
            
            {/* Action Buttons (Bottom Left) */}
            <div className="absolute bottom-3 left-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <button
              onClick={(e) => { e.stopPropagation(); handleDownloadImage(message.image!); }}
              className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md shadow-lg transition-all hover:-translate-y-0.5"
              title="Baixar imagem"
             >
              <Download className="w-4 h-4" />
             </button>
             <button
              onClick={(e) => { e.stopPropagation(); saveToGallery(message.image!); }}
              className="p-2 bg-amber-500/80 hover:bg-amber-600 text-white rounded-lg backdrop-blur-md shadow-lg transition-all flex items-center space-x-2 hover:scale-105"
              title="Enviar para galeria"
             >
              <ImagePlus className="w-4 h-4" />
              <span className="text-xs font-medium">Salvar</span>
             </button>
            </div>
           </div>
          )}
         </div>
        </div>
       ))
      )}
      {isLoading && (
       <div className="flex justify-start message-enter">
        <div className="text-white p-4 rounded-2xl">
         <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
           <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
           <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
           <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="font-medium">Analisando...</span>
         </div>
        </div>
       </div>
      )}
      <div ref={messagesEndRef} />
     </div>
    </div>

    {/* Message Input */}
    <div className="flex space-x-3 flex-shrink-0">

     {/* Chart Guide Button */}
     <button
      onClick={() => setIsChartGuideOpen(true)}
      className="px-4 py-3 bg-white/10 hover:bg-white/20 hover:border-amber-400/40 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-amber-500/20 flex items-center space-x-2 group"
      title="Guia de Visualizações"
     >
      <HelpCircle className="w-5 h-5 text-amber-300 group-hover:text-amber-200 transition-colors" />
      <span className="text-sm font-medium hidden sm:inline">Guia</span>
     </button>
     {/* Chart Recommendation Button */}
     <button
      onClick={() => sendMessage(false, true)}
      disabled={
       (selectionMode === 'files' && !selectedFile) ||
       (selectionMode === 'institutions' && (!selectedInstitution || selectedFileIds.size === 0)) ||
       isLoading
      }
      className="px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 shadow-xl hover:shadow-violet-500/40 flex items-center space-x-2 group"
      title="Descubra qual gráfico é ideal para seus dados"
     >
      <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium hidden md:inline">Qual Gráfico?</span>
     </button>
     <div className="flex-1 relative">
      <textarea
       value={inputMessage}
       onChange={(e) => setInputMessage(e.target.value)}
       onKeyPress={handleKeyPress}
       placeholder={
        selectionMode === 'files'
         ? (selectedFile ? "Digite sua pergunta sobre o arquivo..." : "Selecione um arquivo primeiro")
         : (selectedInstitution && selectedFileIds.size > 0
          ? "Digite sua pergunta sobre os arquivos selecionados..."
          : "Selecione uma instituição e arquivos primeiro")
       }
       disabled={
        (selectionMode === 'files' && !selectedFile) ||
        (selectionMode === 'institutions' && (!selectedInstitution || selectedFileIds.size === 0)) ||
        isLoading
       }
       className="w-full p-4 pr-12 rounded-xl bg-black/40 text-white placeholder-white/70 backdrop-blur-md resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500/70 transition-all duration-300 custom-scrollbar disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
       rows={3}
      />
     </div>
     {/* Generate Chart Button */}
     <button
      onClick={() => sendMessage(true)}
      disabled={
       !inputMessage.trim() ||
       (selectionMode === 'files' && !selectedFile) ||
       (selectionMode === 'institutions' && (!selectedInstitution || selectedFileIds.size === 0)) ||
       isLoading
      }
      className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 shadow-xl hover:shadow-emerald-500/40 flex items-center space-x-2 group"
      title="Gerar gráfico junto com a resposta"
     >
      <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium hidden md:inline">Gerar Gráfico</span>
     </button>
     {/* Send (text-only) Button */}
     <button
      onClick={() => sendMessage()}
      disabled={
       !inputMessage.trim() ||
       (selectionMode === 'files' && !selectedFile) ||
       (selectionMode === 'institutions' && (!selectedInstitution || selectedFileIds.size === 0)) ||
       isLoading
      }
      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 shadow-2xl hover:shadow-amber-500/50 flex items-center space-x-2 group"
     >
      <span className="font-medium">Enviar</span>
      <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
     </button>
    </div>
   </div>

   {/* Chart Guide Popup */}
   <ChartGuidePopup
    isOpen={isChartGuideOpen}
    onClose={() => setIsChartGuideOpen(false)}
   />

  <FilePreviewPopup
   isOpen={isPreviewOpen}
   onClose={() => setIsPreviewOpen(false)}
   files={getPreviewFiles()}
   selectedFileId={previewFileId}
   onFileSelect={handlePreviewFileSelect}
   loading={previewLoading}
   error={previewError}
   headers={previewHeaders}
   rows={previewRows}
  />

   {/* Lightbox Modal */}
   {amplifiedImage && (
    <div 
     className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 lg:p-8"
     onClick={() => setAmplifiedImage(null)}
    >
     <div className="absolute top-6 right-6 flex items-center space-x-4">
      <button
       onClick={(e) => { e.stopPropagation(); handleDownloadImage(amplifiedImage); }}
       className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all flex items-center space-x-2"
      >
       <Download className="w-5 h-5" />
       <span className="font-medium hidden sm:inline">Baixar</span>
      </button>
      <button
       onClick={() => setAmplifiedImage(null)}
       className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all"
      >
       <X className="w-5 h-5" />
      </button>
     </div>
     <div className="relative max-w-full max-h-full flex items-center justify-center">
      <img 
       src={amplifiedImage.startsWith('data:') ? amplifiedImage : `data:image/png;base64,${amplifiedImage}`}
       alt="Amplified visualization"
       className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
       onClick={(e) => e.stopPropagation()}
      />
     </div>
    </div>
   )}

   {/* Toast Notification */}
   {toastMessage && (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 bg-black/80 backdrop-blur-md text-white rounded-full shadow-2xl flex items-center space-x-3 animate-[slideIn_0.3s_ease-out]">
     <Check className="w-4 h-4 text-green-400" />
     <span className="text-sm font-medium">{toastMessage}</span>
    </div>
   )}
  </div>
 );
}

export default function ProtectedChatPage() {
 return (
  <AuthGuard>
   <ChatPage />
  </AuthGuard>
 );
}