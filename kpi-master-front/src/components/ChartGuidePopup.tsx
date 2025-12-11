'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp, BarChart3, Target, Network, Radar, PieChart, ScatterChart, TrendingUp, BoxSelect, HelpCircle } from 'lucide-react';

type ChartInfo = {
    id: string;
    title: string;
    icon: React.ReactNode;
    description: string;
    whenToUse: string[];
    examples: string[];
    color: string;
};

const chartData: ChartInfo[] = [
    {
        id: 'shot-maps',
        title: 'Shot Maps (Mapas de Chutes)',
        icon: <Target className="w-6 h-6" />,
        description: 'Visualizam a localização e resultado de finalizações em campo. Cada ponto representa um chute, com cores/tamanhos indicando gol, defesa ou erro.',
        whenToUse: [
            'Analisar padrões de finalização de jogadores ou times',
            'Identificar zonas de maior eficiência ofensiva',
            'Comparar desempenho de atacantes',
            'Avaliar posicionamento defensivo do goleiro'
        ],
        examples: [
            'Mapa de chutes de um atacante na temporada',
            'Zonas de gol de um time em partidas em casa',
            'Comparação de finalizações em diferentes competições'
        ],
        color: 'from-red-500 to-orange-500'
    },
    {
        id: 'heat-maps',
        title: 'Heat Maps (Mapas de Calor)',
        icon: <BarChart3 className="w-6 h-6" />,
        description: 'Mostram a intensidade de atividade em diferentes áreas do campo usando gradientes de cor. Áreas mais quentes indicam maior frequência de ações.',
        whenToUse: [
            'Entender o posicionamento médio de jogadores',
            'Analisar coberturas táticas do time',
            'Identificar zonas de influência de um jogador',
            'Comparar movimentação entre partidas'
        ],
        examples: [
            'Área de atuação de um meia durante a partida',
            'Zonas de recuperação de bola do time',
            'Movimentação de laterais em jogos ofensivos vs defensivos'
        ],
        color: 'from-yellow-500 to-red-500'
    },
    {
        id: 'pass-networks',
        title: 'Pass Networks (Redes de Passe)',
        icon: <Network className="w-6 h-6" />,
        description: 'Ilustram as conexões de passe entre jogadores. Linhas mais grossas indicam maior volume de passes; posição dos nós mostra o posicionamento médio.',
        whenToUse: [
            'Visualizar a estrutura tática do time',
            'Identificar jogadores-chave na construção',
            'Analisar fluidez e padrões de distribuição',
            'Comparar táticas entre jogos ou adversários'
        ],
        examples: [
            'Rede de passes do primeiro tempo',
            'Conexão entre zagueiros e volantes',
            'Evolução tática ao longo da temporada'
        ],
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'radar-charts',
        title: 'Radar Charts (Gráficos Aranha)',
        icon: <Radar className="w-6 h-6" />,
        description: 'Comparam múltiplas estatísticas de um jogador em uma única visualização. Cada eixo representa uma métrica diferente, formando um polígono.',
        whenToUse: [
            'Comparar perfis completos de jogadores',
            'Avaliar pontos fortes e fracos',
            'Scouting e recrutamento',
            'Monitorar evolução de desempenho'
        ],
        examples: [
            'Perfil ofensivo vs defensivo de um volante',
            'Comparação entre contratações potenciais',
            'Evolução do jogador em diferentes temporadas'
        ],
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: 'pizza-charts',
        title: 'Percentile Pizza Charts',
        icon: <PieChart className="w-6 h-6" />,
        description: 'Mostram estatísticas de jogadores em percentis comparados a jogadores similares. Cada fatia representa uma métrica com preenchimento proporcional ao ranking.',
        whenToUse: [
            'Contextualizar estatísticas em relação a pares',
            'Identificar jogadores elite em métricas específicas',
            'Comunicar desempenho de forma visual e intuitiva',
            'Comparar jogadores de ligas diferentes'
        ],
        examples: [
            'Percentis de passes de meio-campistas da liga',
            'Ranking de duelos aéreos entre zagueiros',
            'Comparação de envolvimento ofensivo de pontas'
        ],
        color: 'from-amber-500 to-yellow-500'
    },
    {
        id: 'scatter-plots',
        title: 'Scatter Plots (Gráficos de Dispersão)',
        icon: <ScatterChart className="w-6 h-6" />,
        description: 'Plotam duas variáveis em eixos X e Y para revelar correlações e outliers. Cada ponto representa um jogador, time ou partida.',
        whenToUse: [
            'Descobrir relações entre métricas',
            'Identificar jogadores fora da curva',
            'Analisar eficiência (ex: gols vs xG)',
            'Comparar custo-benefício de jogadores'
        ],
        examples: [
            'xG vs gols marcados por atacantes',
            'Passes progressivos vs passes totais',
            'Valor de mercado vs contribuição em gols'
        ],
        color: 'from-green-500 to-emerald-500'
    },
    {
        id: 'rolling-averages',
        title: 'Rolling Average Line Charts',
        icon: <TrendingUp className="w-6 h-6" />,
        description: 'Mostram tendências ao longo do tempo usando médias móveis. Suavizam variações de jogo a jogo para revelar padrões de longo prazo.',
        whenToUse: [
            'Acompanhar forma e evolução de jogadores',
            'Identificar quedas ou melhorias de desempenho',
            'Analisar impacto de mudanças táticas',
            'Monitorar recuperação pós-lesão'
        ],
        examples: [
            'xG por jogo dos últimos 10 jogos',
            'Distância percorrida ao longo da temporada',
            'Taxa de passes certos em sequência de jogos'
        ],
        color: 'from-indigo-500 to-blue-500'
    },
    {
        id: 'box-plots',
        title: 'Box Plots (Box-and-Whisker)',
        icon: <BoxSelect className="w-6 h-6" />,
        description: 'Resumem a distribuição de dados mostrando mediana, quartis e outliers. Ideais para comparar grupos e identificar variabilidade.',
        whenToUse: [
            'Comparar distribuições entre times ou ligas',
            'Identificar consistência de jogadores',
            'Detectar outliers estatísticos',
            'Analisar variação de desempenho'
        ],
        examples: [
            'Distribuição de gols por time no campeonato',
            'Variação de notas de jogadores por posição',
            'Comparação de xG entre diferentes técnicos'
        ],
        color: 'from-teal-500 to-cyan-500'
    }
];

type ChartGuidePopupProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function ChartGuidePopup({ isOpen, onClose }: ChartGuidePopupProps) {
    const [expandedChart, setExpandedChart] = useState<string | null>(null);

    if (!isOpen) return null;

    const toggleChart = (chartId: string) => {
        setExpandedChart(expandedChart === chartId ? null : chartId);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-fade-in-scale">
                {/* Header */}
                <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-amber-600/90 to-orange-600/90 backdrop-blur-md border-b border-white/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-white/20">
                                <HelpCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Guia de Visualizações</h2>
                                <p className="text-sm text-white/80">Entenda qual gráfico usar para cada análise</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 space-y-4 custom-scrollbar">
                    {/* Intro */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                        <p className="text-white/90 text-sm leading-relaxed">
                            Escolher o gráfico certo é fundamental para comunicar insights de forma eficaz.
                            Cada tipo de visualização tem pontos fortes específicos. Use este guia para
                            identificar qual ferramenta visual melhor se adapta à sua análise.
                        </p>
                    </div>

                    {/* Chart Cards */}
                    {chartData.map((chart) => (
                        <div
                            key={chart.id}
                            className="rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/8 transition-all duration-300"
                        >
                            {/* Card Header */}
                            <button
                                onClick={() => toggleChart(chart.id)}
                                className="w-full p-4 flex items-center justify-between group"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${chart.color} shadow-lg`}>
                                        {chart.icon}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold text-white group-hover:text-amber-300 transition-colors">
                                            {chart.title}
                                        </h3>
                                        <p className="text-sm text-white/60 line-clamp-1 max-w-lg">
                                            {chart.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 ml-4">
                                    {expandedChart === chart.id ? (
                                        <ChevronUp className="w-5 h-5 text-amber-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                                    )}
                                </div>
                            </button>

                            {/* Expanded Content */}
                            {expandedChart === chart.id && (
                                <div className="px-4 pb-4 space-y-4 animate-fade-in">
                                    {/* Description */}
                                    <div className="pl-16">
                                        <p className="text-white/80 text-sm leading-relaxed">
                                            {chart.description}
                                        </p>
                                    </div>

                                    {/* When to Use */}
                                    <div className="pl-16">
                                        <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
                                            Quando usar
                                        </h4>
                                        <ul className="space-y-1.5">
                                            {chart.whenToUse.map((use, index) => (
                                                <li key={index} className="text-sm text-white/70 flex items-start">
                                                    <span className="text-amber-400 mr-2">•</span>
                                                    {use}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Examples */}
                                    <div className="pl-16">
                                        <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                                            Exemplos de uso
                                        </h4>
                                        <ul className="space-y-1.5">
                                            {chart.examples.map((example, index) => (
                                                <li key={index} className="text-sm text-white/70 flex items-start">
                                                    <span className="text-emerald-400 mr-2">•</span>
                                                    {example}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Footer Tip */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 mt-6">
                        <div className="flex items-start space-x-3">
                            <div className="p-2 rounded-lg bg-amber-500/20 flex-shrink-0">
                                <HelpCircle className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-amber-300 mb-1">Dica</h4>
                                <p className="text-xs text-white/70 leading-relaxed">
                                    Ao solicitar uma visualização no chat, seja específico sobre o que deseja analisar.
                                    Por exemplo: "Gere um scatter plot comparando xG e gols dos atacantes" ou
                                    "Mostre o heat map de posicionamento do jogador X".
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
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
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.7);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-fade-in-scale {
          animation: fadeInScale 0.3s ease-out forwards;
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
        </div>
    );
}
