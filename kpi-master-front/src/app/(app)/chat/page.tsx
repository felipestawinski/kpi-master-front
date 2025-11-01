'use client';

import AuthGuard from '@/components/AuthGuard';
import { useEffect, useState, useRef } from 'react';
import { FileText, Send, ChevronDown } from 'lucide-react';

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

export function ChatPage() {
  const [files, setFiles] = useState<ApiFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ApiFile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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

    setMessages(prev => [...prev, userMessage]);
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
        setMessages(prev => [...prev, assistantMessage]);
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

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua pergunta.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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
      `}</style>

      <div className="mx-auto max-w-4xl flex-1 flex flex-col min-h-0">
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-white">Chat</h1>
          <p className="text-sm text-white/70">
            Selecione um arquivo e faça perguntas sobre ele
          </p>
        </div>

        {/* Custom File Selection Dropdown */}
        <div className="mb-6 flex-shrink-0" ref={dropdownRef}>
          <label className="block text-sm font-medium text-white mb-2">
            Selecione um arquivo:
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white backdrop-blur-sm hover:bg-white/15 transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-left">
                  {selectedFile ? (
                    <>
                      <div className="font-medium">{selectedFile.filename}</div>
                      <div className="text-sm text-white/60">{selectedFile.institution}</div>
                    </>
                  ) : (
                    <div className="text-white/60">Escolha um arquivo...</div>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-white/60 transition-transform duration-300 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-2 rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl border border-white/20 overflow-hidden dropdown-enter">
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {files.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhum arquivo disponível
                    </div>
                  ) : (
                    files.map((file, index) => (
                      <button
                        key={file.id}
                        onClick={() => {
                          setSelectedFile(file);
                          setMessages([]);
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
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm flex items-center space-x-2 message-enter">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span>Arquivo selecionado: <strong>{selectedFile.filename}</strong></span>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 mb-4 min-h-0 rounded-xl bg-white/10 backdrop-blur-sm overflow-hidden border border-white/10">
          <div className="h-full overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="text-center text-white/50 py-12">
                <div className="mb-4 inline-block p-4 rounded-full bg-white/5">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
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
                    className={`max-w-[70%] p-4 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-br-sm'
                        : 'bg-white/20 text-white backdrop-blur-sm rounded-bl-sm border border-white/10'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-white/80' : 'text-white/60'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start message-enter">
                <div className="bg-white/20 text-white backdrop-blur-sm p-4 rounded-2xl rounded-bl-sm border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span>Analisando...</span>
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
              className="w-full p-4 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 backdrop-blur-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 custom-scrollbar disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !selectedFile || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 flex items-center space-x-2 group"
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