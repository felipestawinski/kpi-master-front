'use client';

import AuthGuard from '@/components/AuthGuard';
import { useEffect, useState, useRef } from 'react';
import { FileText, Send, ChevronDown, Edit2, Check, X, Trash2 } from 'lucide-react';

type ApiFile = {
  id: number;
  filename: string;
  institution: string;
  writer: string;
  date: string;
  fileAddress: string;
};

type ChatMessage = {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const DEFAULT_TEMPLATE_QUESTIONS = [
  "Provide a full overview of the file",
  "Are the dataset clean? Are there NaN values?",
  "What are the main KPIs covered in this file?",
  "Summarize the key findings and insights",
  "What are the data quality issues, if any?"
];

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Save chat history to localStorage
  const saveChatHistory = (fileId: number, chatMessages: ChatMessage[]) => {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '{}');
    chatHistory[fileId] = chatMessages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString()
    }));
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  };

  // Load chat history from localStorage
  const loadChatHistory = (fileId: number): ChatMessage[] => {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '{}');
    const fileHistory = chatHistory[fileId];
    if (fileHistory && Array.isArray(fileHistory)) {
      return fileHistory.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
    return [];
  };

  // Clear chat history for current file
  const clearChatHistory = () => {
    if (!selectedFile) return;
    
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '{}');
    delete chatHistory[selectedFile.id];
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    setMessages([]);
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

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedFile || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const currentPrompt = inputMessage;
    setInputMessage('');
    setIsLoading(true);

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
        saveChatHistory(selectedFile.id, finalMessages);
        setIsLoading(false);
        return;
      }

      const res = await fetch('http://localhost:8080/analysis-gen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `${token}` } : {}),
        },
        body: JSON.stringify({
          fileId: selectedFile.id,
          prompt: currentPrompt,
        }),
      });

      const response = await res.text();
      const payload = JSON.parse(response);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: payload.text_response || response,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveChatHistory(selectedFile.id, finalMessages);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua pergunta.',
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveChatHistory(selectedFile.id, finalMessages);
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
      `}</style>

      <div className="mx-auto max-w-6xl flex-1 flex flex-col min-h-0">

        {/* Custom File Selection Dropdown */}
        <div className="mb-6 flex-shrink-0" ref={dropdownRef}>
          <label className="block text-sm font-medium text-white mb-2 drop-shadow-lg">
            Selecione um arquivo:
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full p-4 rounded-xl bg-black/40 border border-white/30 text-white backdrop-blur-md hover:bg-black/50 transition-all duration-300 flex items-center justify-between group shadow-xl"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/30 group-hover:bg-amber-500/40 transition-colors shadow-lg">
                  <FileText className="w-5 h-5 text-amber-300" />
                </div>
                <div className="text-left">
                  {selectedFile ? (
                    <>
                      <div className="font-medium drop-shadow-md">{selectedFile.filename}</div>
                      <div className="text-sm text-white/80 drop-shadow-md">{selectedFile.institution}</div>
                    </>
                  ) : (
                    <div className="text-white/80 drop-shadow-md">Escolha um arquivo...</div>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-white/80 transition-transform duration-300 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-2 rounded-xl bg-white/98 backdrop-blur-sm shadow-2xl border border-white/30 overflow-hidden dropdown-enter">
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {files.length === 0 ? (
                    <div className="p-4 text-center text-gray-600 font-medium">
                      Nenhum arquivo disponível
                    </div>
                  ) : (
                    files.map((file, index) => (
                      <button
                        key={file.id}
                        onClick={() => {
                          setSelectedFile(file);
                          setMessages(loadChatHistory(file.id));
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full p-4 text-left hover:bg-amber-50 transition-all duration-200 flex items-center space-x-3 group ${
                          selectedFile?.id === file.id ? 'bg-amber-100' : ''
                        } ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                        style={{
                          animationDelay: `${index * 0.05}s`,
                        }}
                      >
                        <div className={`p-2 rounded-lg transition-colors ${
                          selectedFile?.id === file.id
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
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-100 text-sm flex items-center space-x-2 message-enter shadow-lg backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-lg"></div>
              <span className="drop-shadow-md">Arquivo selecionado: <strong>{selectedFile.filename}</strong></span>
            </div>
          )}
        </div>

        {/* Template Questions Section */}
        {selectedFile && messages.length === 0 && (
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
                    className="p-3 rounded-lg bg-black/30 border border-white/20 text-white text-sm text-left hover:bg-black/40 hover:border-amber-400/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg hover:shadow-amber-500/20 group"
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
                      className="flex-1 p-3 rounded-lg bg-black/30 border border-white/20 text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500/70 transition-all backdrop-blur-sm"
                    />
                    <button
                      onClick={() => removeTemplateQuestion(index)}
                      disabled={editedQuestions.length === 1}
                      className="p-2 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addTemplateQuestion}
                  className="w-full p-2 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-300 hover:bg-amber-500/30 transition-colors text-sm"
                >
                  + Adicionar pergunta
                </button>
              </div>
            )}
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 mb-4 min-h-0 rounded-xl bg-black/40 backdrop-blur-md overflow-hidden border border-white/20 shadow-2xl">
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
                    className={`max-w-[75%] p-4 rounded-2xl shadow-2xl transition-all duration-300 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-br-sm'
                        : 'bg-white/95 text-gray-900 rounded-bl-sm border border-white/30 backdrop-blur-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-white/90' : 'text-gray-600'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start message-enter">
                <div className="bg-white/95 text-gray-900 backdrop-blur-sm p-4 rounded-2xl rounded-bl-sm border border-white/30 shadow-xl">
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
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedFile ? "Digite sua pergunta sobre o arquivo..." : "Selecione um arquivo primeiro"}
              disabled={!selectedFile || isLoading}
              className="w-full p-4 pr-12 rounded-xl bg-black/40 border border-white/30 text-white placeholder-white/70 backdrop-blur-md resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500/70 transition-all duration-300 custom-scrollbar disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
              rows={3}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !selectedFile || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 shadow-2xl hover:shadow-amber-500/50 flex items-center space-x-2 group"
          >
            <span className="font-medium">Enviar</span>
            <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
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