'use client';

import AuthGuard from '@/components/AuthGuard';
import ChartGuidePopup from '@/components/ChartGuidePopup';
import FilePreviewPopup from '@/components/FilePreviewPopup';
import ChatMessageBubble from '@/components/ChatMessageBubble';
import type { ChatMessage } from '@/components/ChatMessageBubble';
import { useEffect, useState, useRef, useCallback } from 'react';
import { FileText, Send, ChevronDown, Edit2, Check, X, Trash2, HelpCircle, Download, Eye, Wrench, Image } from 'lucide-react';

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

type SelectionMode = 'files' | 'institutions';

const DEFAULT_TEMPLATE_QUESTIONS = [
  "Provide a full overview of the file",
  "Are the dataset clean? Are there NaN values?",
  "What are the main KPIs covered in this file?",
  "Summarize the key findings and insights",
  "What are the data quality issues, if any?"
];

const AVAILABLE_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-5",
  "gpt-5-mini",
  "o1",
  "o3",
  "o4-mini",
  "gpt-5.4",
  "gpt-5.4-mini",
];

const DEFAULT_MODEL = "gpt-4o";
const MAX_FILES_PER_ANALYSIS_REQUEST = 4;

function ChatPage() {
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
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [imageGenSelected, setImageGenSelected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  // Refs for the fixed right-edge scrollbar (DOM-only, no React state)
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const scrollThumbRef = useRef<HTMLDivElement>(null);
  // Track whether we are restoring history so scrollToBottom uses instant jump
  const isLoadingHistory = useRef(false);

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
    const behavior = isLoadingHistory.current ? 'instant' : 'smooth';
    messagesEndRef.current?.scrollIntoView({ behavior: behavior as ScrollBehavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Update the fixed right-edge scrollbar via direct DOM manipulation (no setState)
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const update = () => {
      const thumb = scrollThumbRef.current;
      const track = scrollTrackRef.current;
      if (!thumb || !track) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const canScroll = scrollHeight > clientHeight;
      if (!canScroll) {
        track.style.display = 'none';
        return;
      }
      track.style.display = '';
      const thumbRatio = clientHeight / scrollHeight;
      const thumbHeight = Math.max(thumbRatio * 100, 8);
      const scrollRatio = scrollTop / (scrollHeight - clientHeight);
      const thumbTop = scrollRatio * (100 - thumbHeight);
      thumb.style.top = `${thumbTop}%`;
      thumb.style.height = `${thumbHeight}%`;
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [messages, isLoading]);

  // Drag-to-scroll handler for the fixed scrollbar thumb (DOM-only)
  const handleScrollbarDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = messagesScrollRef.current;
    if (!el) return;
    const startY = e.clientY;
    const startScrollTop = el.scrollTop;
    const trackHeight = window.innerHeight;
    const { scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    const onMove = (ev: MouseEvent) => {
      const deltaY = ev.clientY - startY;
      const scrollDelta = (deltaY / trackHeight) * scrollHeight;
      el.scrollTop = Math.min(Math.max(startScrollTop + scrollDelta, 0), maxScroll);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // Click on track to jump scroll position
  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = messagesScrollRef.current;
    if (!el) return;
    if ((e.target as HTMLElement).classList.contains('fixed-scroll-thumb')) return;
    const trackRect = e.currentTarget.getBoundingClientRect();
    const clickRatio = (e.clientY - trackRect.top) / trackRect.height;
    const { scrollHeight, clientHeight } = el;
    el.scrollTop = clickRatio * (scrollHeight - clientHeight);
  }, []);

  // Forward wheel events from anywhere on the page to the chat scroll container
  // Uses rAF-based smooth interpolation for buttery momentum scrolling
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;

    let targetScrollTop = el.scrollTop;
    let animating = false;
    const LERP = 0.18; // damping factor – lower = smoother/slower, higher = snappier
    const EPSILON = 0.5; // stop animating when close enough (px)

    const animate = () => {
      const diff = targetScrollTop - el.scrollTop;
      if (Math.abs(diff) < EPSILON) {
        el.scrollTop = targetScrollTop;
        animating = false;
        return;
      }
      el.scrollTop += diff * LERP;
      requestAnimationFrame(animate);
    };

    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      // Skip if inside a separately-scrollable element (dropdowns, etc.)
      if (target.closest('.dropdown-scrollbar')) return;

      const maxScroll = el.scrollHeight - el.clientHeight;
      targetScrollTop = Math.min(Math.max(targetScrollTop + e.deltaY, 0), maxScroll);

      if (!animating) {
        animating = true;
        requestAnimationFrame(animate);
      }
    };

    // Keep targetScrollTop in sync when user scrolls natively (e.g. drag scrollbar thumb)
    const onScroll = () => {
      if (!animating) {
        targetScrollTop = el.scrollTop;
      }
    };

    document.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);


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
          content: msg.content || ' ',
          image: msg.image || '',
          chartCode: msg.chartCode || '',
          timestamp: msg.timestamp.toISOString(),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('Failed to save chat message:', text);
        return null;
      }
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
      if (!res.ok) {
        const text = await res.text();
        console.error('Failed to load chat history:', text);
        return [];
      }
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
          chartCode: msg.chartCode || undefined,
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
      if (!res.ok) {
        const text = await res.text();
        console.error('Failed to load chat image:', text);
        return null;
      }
      const data = await res.json();
      return data.image as string;
    } catch (err) {
      console.error('Error loading chat image:', err);
      return null;
    }
  };

  // Load messages and lazily load images for those that have them
  const loadAndSetMessages = async (chatId: string) => {
    isLoadingHistory.current = true;
    const msgs = await loadChatHistoryFromAPI(chatId);
    setMessages(msgs);

    // Collect messages that need images
    const imageMsgs = msgs.filter(m => m.hasImage && m._id);
    if (imageMsgs.length === 0) {
      isLoadingHistory.current = false;
      return;
    }

    // Mark all image-bearing messages as loading in one setState
    setMessages(prev => prev.map(m => m.hasImage && m._id ? { ...m, imageLoading: true } : m));

    // Load all images in parallel, then apply in a single batch update
    const results = await Promise.all(
      imageMsgs.map(async (msg) => {
        const image = await loadChatImage(msg._id!);
        return { _id: msg._id!, image };
      })
    );

    const imageMap = new Map(results.map(r => [r._id, r.image]));
    setMessages(prev =>
      prev.map(m =>
        m._id && imageMap.has(m._id)
          ? { ...m, image: imageMap.get(m._id) ?? undefined, imageLoading: false }
          : m
      )
    );

    isLoadingHistory.current = false;
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
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setIsToolsDropdownOpen(false);
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

  const sendMessage = async (generateChart?: boolean, chartRecommendation: boolean = false) => {
    // If generateChart is not explicitly passed, use the toggled imageGenSelected state
    const shouldGenerateChart = generateChart !== undefined ? generateChart : imageGenSelected;
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

      if (fileIds.length > MAX_FILES_PER_ANALYSIS_REQUEST) {
        throw new Error(`Selecione no máximo ${MAX_FILES_PER_ANALYSIS_REQUEST} arquivos por análise.`);
      }

      const res = await fetch('http://localhost:8080/analysis-gen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `${token}` } : {}),
        },
        body: JSON.stringify({
          fileIds: fileIds,
          prompt: currentPrompt,
          generateChart: shouldGenerateChart,
          chartRecommendation: chartRecommendation,
          chatId: identifier,
          forceRefresh: false,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        // Read body as text to surface error details regardless of content-type
        const errText = await res.text();
        let detail = 'Erro ao processar a análise.';
        try { detail = JSON.parse(errText)?.detail || JSON.parse(errText)?.message || errText || detail; } catch { detail = errText || detail; }
        throw new Error(detail);
      }

      // ── TEXT-ONLY streaming path ──────────────────────────────────────────
      if (!shouldGenerateChart && !chartRecommendation) {
        const assistantMsgId = (Date.now() + 1).toString();
        const assistantMessage: ChatMessage = {
          id: assistantMsgId,
          type: 'assistant',
          content: '',
          timestamp: new Date(),
        };

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let firstChunk = true;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          if (firstChunk) {
            // Add the message skeleton and hide the spinner on the first chunk
            setMessages(prev => [...prev, { ...assistantMessage, content: accumulated }]);
            setIsLoading(false);
            firstChunk = false;
          } else {
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.id === assistantMsgId) {
                updated[updated.length - 1] = { ...last, content: accumulated };
              }
              return updated;
            });
          }
        }

        // Save fully-accumulated assistant message after stream ends
        const finalAssistantMessage: ChatMessage = {
          ...assistantMessage,
          content: accumulated,
        };
        if (identifier) {
          saveChatMessageToAPI(identifier, finalAssistantMessage);
        }
        // No token data is available from streaming; skip localStorage update
        return;
      }

      // ── Chart / recommendation path (non-streaming) ───────────────────────
      const response = await res.text();
      let payload: any = {};
      try {
        payload = response ? JSON.parse(response) : {};
      } catch {
        payload = { raw: response };
      }

      // When image generation was requested and an image was returned,
      // show only the image without the text analysis.
      const hasGeneratedImage = shouldGenerateChart && !!payload.image;
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: hasGeneratedImage ? '' : (payload.text_response || response),
        timestamp: new Date(),
        image: payload.image || undefined,
        hasImage: !!payload.image,
        chartCode: payload.chart_code || undefined,
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      // Save assistant message to MongoDB
      if (identifier) {
        saveChatMessageToAPI(identifier, assistantMessage);
      }

      // Update token usage in localStorage and notify the TokenUsageBar
      console.log('DEBUG FRONTEND - Payload recebido:', payload);
      if (payload.tokensUsed !== undefined) {
        console.log('DEBUG FRONTEND - tokenUsed =', payload.tokensUsed);
        localStorage.setItem('tokensUsed', String(payload.tokensUsed));
      }
      if (payload.tokenLimit !== undefined) {
        localStorage.setItem('tokenLimit', String(payload.tokenLimit));
      }
      if (payload.tokensUsed !== undefined || payload.tokenLimit !== undefined) {
        window.dispatchEvent(new Event('tokenUsageUpdated'));
      }
    } catch (err) {
      const errorText = err instanceof Error && err.message
        ? err.message
        : 'Desculpe, ocorreu um erro ao processar sua pergunta.';

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: errorText,
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      if (identifier) {
        saveChatMessageToAPI(identifier, errorMessage);
      }
    } finally {
      setIsLoading(false);
      setImageGenSelected(false);
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
    .hidden-scrollbar {
      overflow-y: hidden;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE/Edge */
    }
    .hidden-scrollbar::-webkit-scrollbar {
      display: none; /* Chrome/Safari */
    }

    .dropdown-scrollbar {
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.18) transparent;
    }
    .dropdown-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .dropdown-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .dropdown-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.18);
      border-radius: 4px;
      transition: background 0.2s;
    }
    .dropdown-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.35);
    }

    /* Horizontal scrollbar for code panels – matches the lateral scrollbar style */
    .code-scrollbar {
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.18) transparent;
    }
    .code-scrollbar::-webkit-scrollbar {
      height: 8px;  /* matches the 8px width of the side scrollbar track */
      width: 0;
    }
    .code-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .code-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.18);
      border-radius: 0;
      transition: background 0.2s, opacity 0.3s;
      opacity: 0.6;
    }
    .code-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.35);
      opacity: 1;
    }

    .fixed-scroll-track {
      position: fixed;
      right: 0;
      top: 0;
      bottom: 0;
      width: 8px;
      z-index: 50;
      pointer-events: auto;
      cursor: pointer;
    }
    .fixed-scroll-thumb {
      position: absolute;
      right: 0;
      width: 8px;
      border-radius: 4px;
      background: rgba(255,255,255,0.18);
      transition: background 0.2s, opacity 0.3s;
      opacity: 0.6;
      cursor: grab;
      pointer-events: auto;
    }
    .fixed-scroll-thumb:hover,
    .fixed-scroll-thumb:active {
      background: rgba(255,255,255,0.35);
      opacity: 1;
    }
    .fixed-scroll-thumb:active {
      cursor: grabbing;
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

      <div className="mx-auto w-full max-w-3xl flex-1 flex flex-col min-h-0">

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
                  className="px-4 py-2 rounded-xl bg-black/40 text-white backdrop-blur-md hover:bg-black/50 transition-all duration-300 flex items-center space-x-2 group shadow-xl"
                >
                  <span className="text-md font-medium text-white/80">Modelo:</span>
                  <span className="text-md font-medium text-amber-300">{selectedModel}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-white/80 transition-transform duration-300 ${isModelDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute z-40 right-0 mt-2 w-56 rounded-xl bg-zinc-800 overflow-hidden dropdown-enter">
                    <div className="max-h-96 dropdown-scrollbar">
                      {AVAILABLE_MODELS.map((model, index) => (
                        <button
                          key={model}
                          onClick={() => {
                            setSelectedModel(model);
                            setIsModelDropdownOpen(false);
                          }}
                          className={`w-full p-3 text-left hover:bg-white/10 transition-all duration-200 flex items-center justify-between ${selectedModel === model ? 'bg-amber-500/20' : ''} ${index !== 0 ? 'border-t border-white/10' : ''}`}
                        >
                          <span className="font-medium text-gray-300 text-sm">{model}</span>
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
            <div className="relative">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 backdrop-blur-md shadow-lg">
                {/* Clickable file selector */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 hover:bg-white/5 rounded-lg px-2 py-1 -mx-1 transition-all duration-200 group"
                >
                  <div className="p-2 rounded-lg bg-amber-500/30 shadow-lg group-hover:bg-amber-500/40 transition-colors">
                    <FileText className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="text-white text-sm text-left">
                    {selectionMode === 'files' && selectedFile && (
                      <span><strong>{selectedFile.filename}</strong> • {selectedFile.institution}</span>
                    )}
                    {selectionMode === 'institutions' && selectedInstitution && (
                      <span><strong>{selectedInstitution}</strong> • {selectedFileIds.size} arquivo(s)</span>
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className="flex items-center space-x-3">
                  {/* Compact Model Selector */}
                  <div className="relative" ref={modelDropdownRef}>
                    <button
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="px-3 py-1.5 text-xs rounded-xl bg-transparent hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 flex items-center space-x-1.5 text-sm"
                    >
                      <span className="text-white/60 text-sm">Modelo:</span>
                      <span className="text-amber-300 font-medium text-sm">{selectedModel}</span>
                      <ChevronDown className={`w-3 h-3 text-white/60 transition-transform duration-300 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isModelDropdownOpen && (
                      <div className="absolute z-40 right-0 mt-2 w-56 rounded-xl bg-zinc-800 overflow-hidden dropdown-enter">
                        <div className="max-h-96 dropdown-scrollbar">
                          {AVAILABLE_MODELS.map((model, index) => (
                            <button
                              key={model}
                              onClick={() => {
                                setSelectedModel(model);
                                setIsModelDropdownOpen(false);
                              }}
                              className={`w-full p-3 text-left hover:bg-white/10 transition-all duration-200 flex items-center justify-between ${selectedModel === model ? 'bg-amber-500/20' : ''} ${index !== 0 ? 'border-t border-white/10' : ''}`}
                            >
                              <span className="font-medium text-gray-300 text-sm">{model}</span>
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
                    onClick={handleOpenPreview}
                    disabled={getPreviewFiles().length === 0}
                    className="px-3 py-1.5 text-xs rounded-xl bg-transparent hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white/80 hover:text-white transition-all duration-200 flex items-center space-x-1.5"
                    title="Pré-visualizar arquivo"
                  >
                    <Eye className="w-4.5 h-4.5" />
                    <span className="text-sm">Prévia</span>
                  </button>
                </div>
              </div>

              {/* Inline file/institution dropdown */}
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 rounded-xl bg-zinc-800 shadow-2xl overflow-hidden dropdown-enter">
                  <div className="max-h-72 dropdown-scrollbar">
                    {selectionMode === 'files' ? (
                      files.length === 0 ? (
                        <div className="p-4 text-center text-gray-300 font-medium">Nenhum arquivo disponível</div>
                      ) : (
                        files.map((file, index) => (
                          <button
                            key={file.id}
                            onClick={() => handleFileSelect(file)}
                            className={`w-full p-4 text-left hover:bg-white/10 transition-all duration-200 flex items-center space-x-3 group ${selectedFile?.id === file.id ? 'bg-amber-500/20' : ''} ${index !== 0 ? 'border-t border-white/10' : ''}`}
                          >
                            <div className={`p-2 rounded-lg transition-colors ${selectedFile?.id === file.id ? 'bg-amber-500 text-white' : 'bg-white/10 text-gray-300 group-hover:bg-amber-500/30'}`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-300 truncate">{file.filename}</div>
                              <div className="text-sm text-gray-400 truncate">{file.institution} • {file.writer}</div>
                            </div>
                            {selectedFile?.id === file.id && (
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500"></div>
                            )}
                          </button>
                        ))
                      )
                    ) : (
                      getInstitutions().length === 0 ? (
                        <div className="p-4 text-center text-gray-300 font-medium">Nenhuma instituição disponível</div>
                      ) : (
                        getInstitutions().map((institution, index) => (
                          <div key={institution} className={index !== 0 ? 'border-t border-white/10' : ''}>
                            <button
                              onClick={() => handleInstitutionSelect(institution)}
                              className={`w-full p-4 text-left hover:bg-white/10 transition-all duration-200 ${selectedInstitution === institution ? 'bg-amber-500/20' : ''}`}
                            >
                              <div className="font-medium text-gray-300">{institution}</div>
                              <div className="text-sm text-gray-400">{getFilesForInstitution(institution).length} arquivo(s)</div>
                            </button>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full p-4 rounded-sm bg-black/40 text-white backdrop-blur-md hover:bg-black/50 transition-all duration-300 flex items-center justify-between group shadow-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-sm bg-amber-500/30 group-hover:bg-amber-500/40 transition-colors shadow-lg">
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
                  <ChevronDown className={`w-5 h-5 text-white/80 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 rounded-sm bg-zinc-800 shadow-2xl overflow-hidden dropdown-enter">
                    <div className="max-h-96 dropdown-scrollbar">
                      {selectionMode === 'files' ? (
                        files.length === 0 ? (
                          <div className="p-4 text-center text-gray-300 font-medium">Nenhum arquivo disponível</div>
                        ) : (
                          files.map((file, index) => (
                            <button
                              key={file.id}
                              onClick={() => handleFileSelect(file)}
                              className={`w-full p-4 text-left hover:bg-white/10 flex items-center space-x-3 group ${selectedFile?.id === file.id ? 'bg-amber-500/20' : ''} ${index !== 0 ? 'border-t border-white/10' : ''}`}
                            >
                              <div className={`p-2 rounded-lg transition-colors ${selectedFile?.id === file.id ? 'bg-amber-500 text-white' : 'bg-white/10 text-gray-300 group-hover:bg-amber-500/30'}`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-300 truncate">{file.filename}</div>
                                <div className="text-sm text-gray-400 truncate">{file.institution} • {file.writer}</div>
                              </div>
                              {selectedFile?.id === file.id && (
                                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500"></div>
                              )}
                            </button>
                          ))
                        )
                      ) : (
                        getInstitutions().length === 0 ? (
                          <div className="p-4 text-center text-gray-300 font-medium">Nenhuma instituição disponível</div>
                        ) : (
                          getInstitutions().map((institution, index) => (
                            <div key={institution} className={index !== 0 ? 'border-t border-white/10' : ''}>
                              <button
                                onClick={() => handleInstitutionSelect(institution)}
                                className={`w-full p-4 text-left hover:bg-white/10 transition-all duration-200 ${selectedInstitution === institution ? 'bg-amber-500/20' : ''}`}
                              >
                                <div className="font-medium text-gray-300">{institution}</div>
                                <div className="text-sm text-gray-400">{getFilesForInstitution(institution).length} arquivo(s)</div>
                              </button>

                              {selectedInstitution === institution && (
                                <div className="bg-zinc-900/60 px-4 pb-4 space-y-2">
                                  <div className="text-xs text-gray-400 font-medium mb-2">Selecione os arquivos:</div>
                                  {getFilesForInstitution(institution).map((file) => (
                                    <label
                                      key={file.id}
                                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedFileIds.has(file.id)}
                                        onChange={() => toggleFileSelection(file.id)}
                                        className="w-4 h-4 text-amber-500 border-gray-600 rounded focus:ring-amber-500"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-300 truncate">{file.filename}</div>
                                        <div className="text-xs text-gray-400 truncate">{file.writer}</div>
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
                <div className="mt-3 p-3 rounded-sm bg-amber-500/20 text-amber-100 text-sm flex items-center space-x-2 message-enter shadow-lg backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-sm bg-amber-400 animate-pulse shadow-lg"></div>
                  <span className="drop-shadow-md rounded-sm">Arquivo selecionado: <strong>{selectedFile.filename}</strong></span>
                </div>
              )}

              {selectionMode === 'institutions' && selectedInstitution && (
                <div className="mt-3 p-3 rounded-sm bg-amber-500/20 text-amber-100 text-sm message-enter shadow-lg backdrop-blur-sm">
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
                Perguntas salvas:
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
                    className="p-3 rounded-sm bg-black/30 text-white text-sm text-left hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg group"
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

        {/* Chat Messages — no box, free-flowing */}
        <div className="flex-1 min-h-0 relative">
          {/* Clear history floating button */}
          {messages.length > 0 && (
            <div className="absolute top-0 right-0 z-10">
              <button
                onClick={clearChatHistory}
                className="text-red-300/70 hover:text-red-200 transition-colors"
                aria-label="Limpar histórico"
                title="Limpar histórico"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div ref={messagesScrollRef} className="h-full px-2 pt-10 pb-8 space-y-4 hidden-scrollbar">
            {messages.length === 0 ? (
              <div className="text-center text-white py-12">
                <div className="mb-4 inline-block p-4 rounded-full bg-white/10 backdrop-blur-sm shadow-lg">
                  <FileText className="w-8 h-8 drop-shadow-lg" />
                </div>
                <div className="text-lg drop-shadow-lg">
                  {selectedFile
                    ? `Faça uma pergunta sobre ${selectedFile.filename}!`
                    : 'Selecione um arquivo'
                  }
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  isLastMessage={index === messages.length - 1}
                  scrollContainerRef={messagesScrollRef}
                  onAmplifyImage={setAmplifiedImage}
                  onDownloadImage={handleDownloadImage}
                  onSaveToGallery={saveToGallery}
                />
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
        <div className="relative flex space-x-3 flex-shrink-0 pt-2 max-w-3xl mx-auto w-full">


          {/* Chart Guide Button */}
          <div
            onClick={() => setIsChartGuideOpen(true)}
            className="absolute -left-7 bottom-4 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer z-20"
            title="Guia de Visualizações"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsChartGuideOpen(true);
              }
            }}
          >
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                selectionMode === 'files'
                  ? (selectedFile ? "Digite sua pergunta..." : "Selecione um arquivo primeiro")
                  : (selectedInstitution && selectedFileIds.size > 0
                    ? "Digite sua pergunta..."
                    : "Selecione uma instituição e arquivos primeiro")
              }
              disabled={
                (selectionMode === 'files' && !selectedFile) ||
                (selectionMode === 'institutions' && (!selectedInstitution || selectedFileIds.size === 0)) ||
                isLoading //aqui
              }
              className="w-full p-5 pr-16 pb-16 rounded-3xl bg-zinc-800/90 text-white placeholder-white/50 backdrop-blur-md resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/90 focus:border-zinc-900/90 transition-all duration-300 custom-scrollbar disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
              rows={3}
            />

            <div className="absolute left-5 bottom-5 z-30 flex items-end space-x-2.5" ref={toolsDropdownRef}>
              <div className="relative">
                <button
                  onClick={() => setIsToolsDropdownOpen((prev) => !prev)}
                  className="flex rounded-xl px-3 py-1.5 text-sm items-center space-x-1.5 bg-transparent hover:bg-gray-400/20 text-white/80"
                  disabled={isLoading}
                >
                  <span>Ferramentas</span>
                  <ChevronDown className={`w-4.5 h-4.5 transition-transform duration-200 ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>



                {isToolsDropdownOpen && (
                  <div className="absolute left-0 bottom-9 min-w-52 rounded-xl bg-black/90 backdrop-blur-md shadow-2xl overflow-hidden">
                    <button
                      onClick={() => {
                        setIsToolsDropdownOpen(false);
                        setImageGenSelected((prev) => !prev);
                      }}
                      className={`w-full flex items-center space-x-2 text-left rounded-xl px-3 py-1.5 text-sm transition-colors ${imageGenSelected
                        ? 'text-amber-300 bg-amber-500/15'
                        : 'text-white/90 hover:bg-white/10'
                        }`}
                    >
                      <Image className="w-4 h-4 text-amber-400" />
                      <span>Criar imagem</span>
                      {imageGenSelected && (
                        <Check className="w-3.5 h-3.5 ml-auto text-amber-400" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {imageGenSelected && (
                <div className="flex items-center rounded-xl px-3 py-1.5 text-sm bg-transparent hover:bg-amber-500/20 text-amber-300 text-sm font-medium animate-[fadeIn_0.2s_ease-out] gap-2">
                  <Image className="w-4 h-4" />
                  <span>Criar imagem</span>
                  <button
                    onClick={() => setImageGenSelected(false)}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-amber-400/30 transition-colors"
                    title="Remover geração de imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="absolute right-5 bottom-4 z-30">
              <button
                onClick={() => sendMessage()}
                disabled={
                  !inputMessage.trim() ||
                  (selectionMode === 'files' && !selectedFile) ||
                  (selectionMode === 'institutions' && (!selectedInstitution || selectedFileIds.size === 0)) ||
                  isLoading
                }
                className="w-11 h-11 bg-transparent disabled:opacity-40 disabled:cursor-not-allowed text-white/90 hover:text-white rounded-full flex items-center justify-center relative group"
                title="Enviar"
              >
                <span className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-gray-400/20 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100"></span> {/*aqui*/}
                <Send className="w-5 h-5 relative z-10" />
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* Fixed right-edge scrollbar (DOM-ref driven, no React re-renders) */}
      <div ref={scrollTrackRef} className="fixed-scroll-track" style={{ display: 'none' }} onClick={handleTrackClick}>
        <div
          ref={scrollThumbRef}
          className="fixed-scroll-thumb"
          onMouseDown={handleScrollbarDrag}
        />
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
          className="fixed inset-0 z-[100] bg-zinc-900 backdrop-blur-md flex items-center justify-center p-4 lg:p-8"
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
          <div className="relative flex items-center justify-center w-full h-full">
            <img
              src={amplifiedImage.startsWith('data:') ? amplifiedImage : `data:image/png;base64,${amplifiedImage}`}
              alt="Amplified visualization"
              className="max-w-xl lg:max-w-3xl object-contain rounded-xl shadow-2xl"
              style={{ maxWidth: '50vw', maxHeight: '50vh', width: '100%', height: '100%' }}
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