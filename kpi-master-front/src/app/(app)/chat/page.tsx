'use client';

import AuthGuard from '@/components/AuthGuard';
import { useEffect, useState } from 'react';

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
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8080/analysis-gen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `${token}` } : {}),
        },
        body: JSON.stringify({
          fileId: selectedFile.id,
          prompt: inputMessage,
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
    <div className="p-6 h-screen flex flex-col">
      <div className="mx-auto max-w-4xl flex-1 flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Chat com seus arquivos</h1>
          <p className="text-sm text-white/70">
            Selecione um arquivo e faça perguntas sobre ele
          </p>
        </div>

        {/* File Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Selecione um arquivo:
          </label>
          <select
            value={selectedFile?.id || ''}
            onChange={(e) => {
              const fileId = parseInt(e.target.value);
              const file = files.find(f => f.id === fileId);
              setSelectedFile(file || null);
              setMessages([]); // Clear messages when changing file
            }}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white backdrop-blur-sm"
          >
            <option value="">Escolha um arquivo...</option>
            {files.map(file => (
              <option key={file.id} value={file.id} className="text-black">
                {file.filename} - {file.institution}
              </option>
            ))}
          </select>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 mb-4 overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm">
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-white/50 py-8">
                {selectedFile 
                  ? `Arquivo selecionado: ${selectedFile.filename}. Faça uma pergunta sobre ele!`
                  : 'Selecione um arquivo para começar a conversar'
                }
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/20 text-white backdrop-blur-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/20 text-white backdrop-blur-sm p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analisando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message Input */}
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedFile ? "Digite sua pergunta sobre o arquivo..." : "Selecione um arquivo primeiro"}
            disabled={!selectedFile || isLoading}
            className="flex-1 p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 backdrop-blur-sm resize-none"
            rows={3}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !selectedFile || isLoading}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Enviar
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