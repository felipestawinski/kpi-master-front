'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AiOutlineClose } from 'react-icons/ai';
import { MdNavigateNext } from 'react-icons/md';
import { Sparkles, Upload, Search, Users, MessageSquare } from 'lucide-react';

interface OnboardingAssistantProps {
  onDisable: () => void;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function OnboardingAssistant({ onDisable }: OnboardingAssistantProps) {
  const pathname = usePathname();
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const steps = [
    {
      title: "Bem-vindo! 👋",
      content: "Vou guiá-lo pelas principais funcionalidades do sistema em apenas 4 passos.",
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      highlight: null,
    },
    {
      title: "Pesquisar Arquivos",
      content: "Use filtros avançados: busque por nome, autor, instituição ou data.",
      icon: <Search className="w-5 h-5 text-amber-400" />,
      highlight: 'search',
    },
    {
      title: "Enviar Documentos",
      content: "Faça upload dos seus arquivos e adicione metadados como nome e instituição.",
      icon: <Upload className="w-5 h-5 text-amber-400" />,
      highlight: 'upload',
    },
    {
      title: "Gerenciar Usuários",
      content: "Visualize e gerencie os usuários cadastrados no sistema.",
      icon: <Users className="w-5 h-5 text-amber-400" />,
      highlight: 'users',
    },
    {
      title: "Chat",
      content: "Converse com a IA para analisar seus dados e gerar insights visuais.",
      icon: <MessageSquare className="w-5 h-5 text-amber-400" />,
      highlight: 'chat',
    },
  ];

  const currentStep = steps[step];

  // Dynamically measure the sidebar button position
  const measureHighlight = useCallback(() => {
    const id = steps[step]?.highlight;
    if (!id) {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(`[data-onboarding-id="${id}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setHighlightRect(null);
    }
  }, [step]);

  // Re-measure when step or pathname changes, or on resize
  useEffect(() => {
    // Small delay to let navigation/layout settle
    const timeout = setTimeout(measureHighlight, 100);
    window.addEventListener('resize', measureHighlight);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', measureHighlight);
    };
  }, [measureHighlight, pathname]);

  // Auto-advance is no longer needed since we removed navigation actions

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    onDisable();
  };

  if (!isVisible) return null;

  // Position the assistant card near the highlighted element or at bottom-right
  const getCardStyle = (): React.CSSProperties => {
    if (highlightRect) {
      return {
        position: 'fixed',
        top: highlightRect.top,
        left: highlightRect.left + highlightRect.width + 24,
        zIndex: 50,
        maxWidth: '360px',
      };
    }
    return {
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 50,
      maxWidth: '360px',
    };
  };

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(251, 191, 36, 0);
          }
        }

        @keyframes bounce-arrow {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-8px);
          }
        }

        .pulse-highlight {
          animation: pulse-glow 2s infinite;
        }

        .bounce-arrow {
          animation: bounce-arrow 1s ease-in-out infinite;
        }
      `}</style>

      {/* Highlight overlay for sidebar buttons */}
      {currentStep.highlight && highlightRect && (
        <>
          {/* Dimmed background */}
          <div className="fixed inset-0 bg-black/60 z-40 pointer-events-none transition-opacity duration-300" />
          
          {/* Arrow pointing to the element */}
          <div 
            className="fixed z-50 pointer-events-none transition-all duration-500"
            style={{
              top: highlightRect.top + highlightRect.height / 2 - 30,
              left: highlightRect.left + highlightRect.width + 4,
            }}
          >
            <div className="relative bounce-arrow">
              <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-2xl" style={{ transform: 'scaleX(-1)' }}>
                <path 
                  d="M10 30 L40 30 L35 25 M40 30 L35 35" 
                  stroke="#fbbf24" 
                  strokeWidth="3" 
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Highlight ring around sidebar button */}
          <div 
            className="fixed z-40 pointer-events-none transition-all duration-500 pulse-highlight rounded-xl border-4 border-amber-400"
            style={{
              top: highlightRect.top - 4,
              left: highlightRect.left - 4,
              width: highlightRect.width + 8,
              height: highlightRect.height + 8,
            }}
          />
        </>
      )}

      {/* Compact Assistant Card */}
      <div 
        className={`transition-all duration-500 transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={getCardStyle()}
      >
        <div className="backdrop-blur-xl bg-gradient-to-br from-black/80 to-black/60 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-500/30 backdrop-blur-sm">
                  {currentStep.icon}
                </div>
                <h3 className="text-sm font-bold text-white drop-shadow-lg">{currentStep.title}</h3>
              </div>
              <button
                onClick={onDisable}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/70 hover:text-white"
                title="Fechar"
              >
                <AiOutlineClose size={16} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-4 pt-3">
            <div className="flex space-x-1.5">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    index <= step ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            <p className="text-sm text-white/90 leading-relaxed drop-shadow-md">
              {currentStep.content}
            </p>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={handleNext}
              className={`w-full ${
                step === 0
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-amber-500/50'
                  : step === steps.length - 1
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-green-500/50'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-amber-500/50'
              } text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1.5 group`}
            >
              <span>{step === 0 ? 'Começar Tour' : step === steps.length - 1 ? 'Concluir' : 'Próximo'}</span>
              {step < steps.length - 1 && (
                <MdNavigateNext size={18} className="group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 border-t border-white/10 pt-2">
            <button
              onClick={handleComplete}
              className="w-full text-xs text-white/60 hover:text-white/90 transition-colors"
            >
              Não mostrar novamente
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
