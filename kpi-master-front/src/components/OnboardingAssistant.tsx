'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AiOutlineClose, AiOutlineRobot } from 'react-icons/ai';
import { MdNavigateNext } from 'react-icons/md';
import { Sparkles, Upload, Search, BarChart3 } from 'lucide-react';

interface OnboardingAssistantProps {
  onDisable: () => void;
}

export default function OnboardingAssistant({ onDisable }: OnboardingAssistantProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const steps = [
    {
      title: "Bem-vindo! 👋",
      content: "Vou guiá-lo pelas principais funcionalidades do sistema em apenas 3 passos.",
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      highlight: null,
      action: null,
      actionText: null,
    },
    {
      title: "Enviar Documentos",
      content: "Clique aqui para fazer upload dos seus arquivos e adicionar metadados.",
      icon: <Upload className="w-5 h-5 text-amber-400" />,
      highlight: 'upload',
      action: () => router.push('/upload'),
      actionText: "Ir para Upload",
    },
    {
      title: "Pesquisar Arquivos",
      content: "Use filtros avançados: busque por nome, autor, instituição ou data.",
      icon: <Search className="w-5 h-5 text-amber-400" />,
      highlight: 'search',
      action: () => router.push('/search'),
      actionText: "Ir para Pesquisa",
    },
    {
      title: "Visualizar Estatísticas",
      content: "Acesse gráficos, métricas e relatórios dos seus documentos.",
      icon: <BarChart3 className="w-5 h-5 text-amber-400" />,
      highlight: 'statistics',
      action: () => router.push('/statistics'),
      actionText: "Ir para Estatísticas",
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleAction = () => {
    if (currentStep.action) {
      currentStep.action();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    onDisable();
  };

  if (!isVisible) return null;

  // Get position based on highlighted element
  const getPosition = () => {
    const highlight = currentStep.highlight;
    if (!highlight) return 'bottom-6 right-6';
    
    switch (highlight) {
      case 'upload':
        return 'bottom-6 left-80'; // Next to sidebar upload button
      case 'search':
        return 'bottom-6 left-80'; // Next to sidebar search button
      case 'statistics':
        return 'bottom-6 left-80'; // Next to sidebar statistics button
      default:
        return 'bottom-6 right-6';
    }
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
      {currentStep.highlight && (
        <>
          {/* Dimmed background */}
          <div className="fixed inset-0 bg-black/60 z-40 pointer-events-none transition-opacity duration-300" />
          
          {/* Arrow pointing to the element */}
          <div 
            className={`fixed z-50 pointer-events-none transition-all duration-500 ${
              currentStep.highlight === 'upload' ? 'top-[180px] left-[240px]' :
              currentStep.highlight === 'search' ? 'top-[128px] left-[240px]' :
              currentStep.highlight === 'statistics' ? 'top-[288px] left-[240px]' :
              'top-1/2 left-1/2'
            }`}
          >
            <div className="relative bounce-arrow">
              <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-2xl">
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
            className={`fixed z-40 pointer-events-none transition-all duration-500 pulse-highlight ${
              currentStep.highlight === 'upload' ? 'top-[165px] left-[16px] w-[232px] h-[48px]' :
              currentStep.highlight === 'search' ? 'top-[113px] left-[16px] w-[232px] h-[48px]' :
              currentStep.highlight === 'statistics' ? 'top-[273px] left-[16px] w-[232px] h-[48px]' :
              ''
            } rounded-xl border-4 border-amber-400`}
          />
        </>
      )}

      {/* Compact Assistant Card */}
      <div 
        className={`fixed ${getPosition()} z-50 transition-all duration-500 transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ maxWidth: '360px' }}
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
            {currentStep.action ? (
              <>
                <button
                  onClick={handleAction}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-amber-500/50 flex items-center justify-center space-x-1.5 group"
                >
                  <span>{currentStep.actionText}</span>
                  <MdNavigateNext size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all border border-white/20"
                >
                  Pular
                </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                className={`w-full ${
                  step === 0
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-amber-500/50'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-green-500/50'
                } text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-300`}
              >
                {step === 0 ? 'Começar Tour' : 'Concluir'}
              </button>
            )}
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
