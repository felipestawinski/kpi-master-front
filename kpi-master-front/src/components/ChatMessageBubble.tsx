'use client';

import React, { useState, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import MessageReveal from '@/components/MessageReveal';
import { Search, Download, ImagePlus, Code, Copy, CheckCheck, X } from 'lucide-react';

// ── Python syntax highlighter ────────────────────────────────────────────────
type Token = { type: string; value: string };

const PY_KEYWORDS = new Set([
  'False','None','True','and','as','assert','async','await',
  'break','class','continue','def','del','elif','else','except',
  'finally','for','from','global','if','import','in','is',
  'lambda','nonlocal','not','or','pass','raise','return',
  'try','while','with','yield',
]);

const PY_BUILTINS = new Set([
  'print','len','range','int','float','str','bool','list','dict',
  'set','tuple','type','isinstance','hasattr','getattr','setattr',
  'enumerate','zip','map','filter','sorted','reversed','sum',
  'min','max','abs','round','open','super','object','staticmethod',
  'classmethod','property','input','repr','format','any','all',
  'vars','dir','help','id','hash','callable',
]);

function tokenizePython(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < code.length) {
    // Comment
    if (code[i] === '#') {
      const end = code.indexOf('\n', i);
      const val = end === -1 ? code.slice(i) : code.slice(i, end);
      tokens.push({ type: 'comment', value: val });
      i += val.length;
      continue;
    }
    // Triple-quoted strings
    if (code.startsWith('"""', i) || code.startsWith("'''", i)) {
      const q = code.slice(i, i + 3);
      const end = code.indexOf(q, i + 3);
      const val = end === -1 ? code.slice(i) : code.slice(i, end + 3);
      tokens.push({ type: 'string', value: val });
      i += val.length;
      continue;
    }
    // Single/double quoted strings
    if (code[i] === '"' || code[i] === "'") {
      const q = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== q && code[j] !== '\n') {
        if (code[j] === '\\') j++; // skip escape
        j++;
      }
      const val = code.slice(i, j + 1);
      tokens.push({ type: 'string', value: val });
      i = j + 1;
      continue;
    }
    // Numbers
    if (/[0-9]/.test(code[i]) || (code[i] === '.' && /[0-9]/.test(code[i + 1] ?? ''))) {
      let j = i;
      while (j < code.length && /[0-9._xXbBoOeEjJ]/.test(code[j])) j++;
      tokens.push({ type: 'number', value: code.slice(i, j) });
      i = j;
      continue;
    }
    // Decorator
    if (code[i] === '@') {
      let j = i + 1;
      while (j < code.length && /[\w.]/.test(code[j])) j++;
      tokens.push({ type: 'decorator', value: code.slice(i, j) });
      i = j;
      continue;
    }
    // Identifiers / keywords / builtins
    if (/[a-zA-Z_]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\w]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (PY_KEYWORDS.has(word)) tokens.push({ type: 'keyword', value: word });
      else if (PY_BUILTINS.has(word)) tokens.push({ type: 'builtin', value: word });
      else tokens.push({ type: 'name', value: word });
      i = j;
      continue;
    }
    // Operators / punctuation
    if (/[+\-*/%=<>!&|^~,.:;(){}[\]]/.test(code[i])) {
      tokens.push({ type: 'operator', value: code[i] });
      i++;
      continue;
    }
    // Anything else (whitespace etc.)
    tokens.push({ type: 'plain', value: code[i] });
    i++;
  }
  return tokens;
}

const TOKEN_COLORS: Record<string, string> = {
  keyword:   '#c792ea',   // purple
  builtin:   '#82aaff',   // blue
  string:    '#c3e88d',   // green
  number:    '#f78c6c',   // orange
  comment:   '#546e7a',   // grey
  decorator: '#ffcb6b',   // amber
  operator:  '#89ddff',   // cyan
  name:      '#eeffff',   // near-white
  plain:     '#eeffff',
};

function PythonCode({ code }: { code: string }) {
  const tokens = useMemo(() => tokenizePython(code), [code]);
  return (
    <>
      {tokens.map((tok, idx) => (
        <span key={idx} style={{ color: TOKEN_COLORS[tok.type] ?? TOKEN_COLORS.plain }}>
          {tok.value}
        </span>
      ))}
    </>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────
export type ChatMessage = {
  id: string;
  _id?: string; // MongoDB ObjectId for lazy image loading
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string; // Base64 encoded image or URL
  hasImage?: boolean; // Flag from API indicating image exists
  imageLoading?: boolean; // True while loading image lazily
  chartCode?: string; // Python code used to generate the chart
};

type ChatMessageBubbleProps = {
  message: ChatMessage;
  isLastMessage: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onAmplifyImage: (image: string) => void;
  onDownloadImage: (image: string) => void;
  onSaveToGallery: (image: string) => void;
};

// ── Memoized message bubble ─────────────────────────────────────────────────
// Each message manages its own code-expansion and copy state locally,
// so parent re-renders (e.g. from scroll or input typing) never cascade here.
const ChatMessageBubble = React.memo(function ChatMessageBubble({
  message,
  isLastMessage,
  scrollContainerRef,
  onAmplifyImage,
  onDownloadImage,
  onSaveToGallery,
}: ChatMessageBubbleProps) {
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Memoize the expensive ReactMarkdown parsing so it only re-runs
  // when the message content actually changes.
  const renderedContent = useMemo(() => {
    if (!message.content) return null;
    return <ReactMarkdown>{message.content}</ReactMarkdown>;
  }, [message.content]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(message.chartCode!);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [message.chartCode]);

  return (
    <MessageReveal
      scrollContainerRef={scrollContainerRef}
      className={`flex ${message.type === 'user' ? 'justify-end w-full' : 'justify-start w-full'}`}
      animate={isLastMessage}
    >
      <div
        className={`p-4 rounded-2xl ${message.type === 'user'
          ? 'max-w-[75%] w-auto bg-white/10 text-white rounded-br-sm backdrop-blur-sm'
          : 'w-full text-white'
          }`}
        style={{ width: message.type === 'assistant' ? '100%' : undefined }}
      >
        {message.content && (
          <div className={`prose prose-sm max-w-none prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 ${message.type === 'user' ? 'whitespace-pre-wrap' : ''} ${message.type === 'assistant' ? 'prose-p:text-white/90 prose-headings:text-white prose-strong:text-white prose-li:text-white/90 leading-normal' : 'leading-relaxed'}`}>
            {renderedContent}
          </div>
        )}
        {message.imageLoading && (
          <div className="mt-3 flex items-center space-x-2 text-white/60 text-sm">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Carregando imagem...</span>
          </div>
        )}
        {message.image && !message.imageLoading && (
          <div className={`${message.content ? 'mt-3' : ''}`}>
            {/* See Code Button & Panel */}
            {message.chartCode && (
              <div className="mb-2">
                <button
                  onClick={() => setIsCodeExpanded(prev => !prev)}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-transparent hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <Code className="w-4.5 h-4.5" />
                  <span className='text-sm'>{isCodeExpanded ? 'Ocultar código' : 'Mostrar código'}</span>
                </button>

                {isCodeExpanded && (
                  <div className="mt-2 rounded-lg bg-zinc-900/90 backdrop-blur-md overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                    {/* Code Header */}
                    <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/10">
                      <span className="text-xs text-white/50 font-medium">Python</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={handleCopyCode}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-200"
                          title="Copiar código"
                        >
                          {isCopied ? (
                            <><CheckCheck className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copiado!</span></>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                        <button
                          onClick={() => setIsCodeExpanded(false)}
                          className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10"
                          title="Fechar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Code Content */}
                    <pre className="code-scrollbar px-4 py-3 text-sm leading-relaxed font-mono">
                      <code><PythonCode code={message.chartCode!} /></code>
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Chart Image */}
            <div className="relative group inline-block cursor-pointer overflow-hidden rounded-2xl" onClick={() => onAmplifyImage(message.image!)}>
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
                  onClick={(e) => { e.stopPropagation(); onDownloadImage(message.image!); }}
                  className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md shadow-lg transition-colors hover:-translate-y-0.5"
                  title="Baixar imagem"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSaveToGallery(message.image!); }}
                  className="p-2 bg-amber-500/80 hover:bg-amber-600 text-white rounded-lg backdrop-blur-md shadow-lg transition-colors flex items-center space-x-2 hover:scale-105"
                  title="Enviar para galeria"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span className="text-xs font-medium">Salvar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MessageReveal>
  );
});

export default ChatMessageBubble;
