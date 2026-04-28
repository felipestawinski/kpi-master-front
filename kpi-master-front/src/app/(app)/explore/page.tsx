'use client';

import AuthGuard from '@/components/AuthGuard';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Trophy,
  User,
  Search,
  X,
  ChevronRight,
  Globe,
  Calendar,
  MapPin,
  Star,
  Shield,
  ArrowLeft,
  Users,
  Activity,
  Target,
  Flag,
  Clock,
  TrendingUp,
  BarChart3,
  Table,
  ChevronDown,
  Download,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

// TheSportsDB types
type SportsTeam = {
  idTeam: string; strTeam: string; strCountry: string; strTeamBadge?: string;
  intFormedYear?: string; strDescriptionPT?: string; strDescriptionEN?: string;
  strStadium?: string; strWebsite?: string; strLeague?: string; strCity?: string;
};
type SportsPlayer = {
  idPlayer: string; strPlayer: string; strPosition?: string; strCutout?: string;
  strThumb?: string; strTeam?: string; strNationality?: string; dateBorn?: string;
  strDescriptionPT?: string; strDescriptionEN?: string; strHeight?: string;
  strWeight?: string; strNumber?: string;
};

// ESPN types
type EspnTeamStat = { name: string; abbreviation: string; displayValue: string };
type EspnTeamInfo = {
  id: string; displayName: string; shortDisplayName: string;
  abbreviation: string; logo: string; color?: string;
};
type EspnCompetitor = {
  id: string; homeAway: 'home' | 'away'; score: string; winner?: boolean;
  team: EspnTeamInfo; statistics?: EspnTeamStat[]; form?: string;
};
type EspnDetail = {
  type: { id: string; text: string };
  clock: { displayValue: string };
  team?: { id: string }; scoringPlay?: boolean; redCard?: boolean;
  yellowCard?: boolean; penaltyKick?: boolean; ownGoal?: boolean;
  athletesInvolved?: { displayName: string; shortName: string; jersey?: string; headshot?: string }[];
};
type EspnStatus = {
  displayClock: string; period: number;
  type: { state: string; completed: boolean; detail: string; shortDetail: string; description: string };
};
type EspnCompetition = {
  id: string; date: string; status: EspnStatus;
  venue?: { displayName?: string; fullName?: string; address?: { city?: string } };
  competitors: EspnCompetitor[]; details?: EspnDetail[];
  headlines?: { description: string }[]; attendance?: number;
};
type EspnEvent = {
  id: string; name: string; date: string;
  competitions: EspnCompetition[]; status: EspnStatus;
};
type EspnStandingEntry = {
  team: {
    id: string; displayName: string; shortDisplayName: string;
    abbreviation: string; logos: { href: string }[];
  };
  note?: { color: string; description: string; rank: number };
  stats: { name: string; value: number; displayValue: string }[];
};

type Tab = 'matches' | 'standings' | 'stats' | 'teams' | 'players';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SPORTSDB_API = 'https://www.thesportsdb.com/api/v1/json/3';
const ESPN_API     = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const ESPN_API_V2  = 'https://site.api.espn.com/apis/v2/sports/soccer';

const ESPN_LEAGUES = [
  { slug: 'eng.1',              name: 'Premier League',   country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { slug: 'esp.1',              name: 'La Liga',          country: 'Espanha',    flag: '🇪🇸' },
  { slug: 'ger.1',              name: 'Bundesliga',       country: 'Alemanha',   flag: '🇩🇪' },
  { slug: 'ita.1',              name: 'Serie A',          country: 'Itália',     flag: '🇮🇹' },
  { slug: 'fra.1',              name: 'Ligue 1',          country: 'França',     flag: '🇫🇷' },
  { slug: 'por.1',              name: 'Liga Portugal',    country: 'Portugal',   flag: '🇵🇹' },
  { slug: 'bra.1',              name: 'Brasileirão',      country: 'Brasil',     flag: '🇧🇷' },
  { slug: 'usa.1',              name: 'MLS',              country: 'EUA',        flag: '🇺🇸' },
  { slug: 'uefa.champions',     name: 'Champions League', country: 'Europa',     flag: '🏆' },
  { slug: 'uefa.europa',        name: 'Europa League',    country: 'Europa',     flag: '🏆' },
  { slug: 'conmebol.libertadores', name: 'Libertadores',  country: 'América do Sul', flag: '🏆' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CSV EXPORT UTILITY
// ═══════════════════════════════════════════════════════════════════════════════

function downloadCsv(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function ExplorePage() {
  const [activeTab, setActiveTab] = useState<Tab>('matches');
  const [isVisible, setIsVisible] = useState(false);
  const [scrollThumb, setScrollThumb] = useState({ top: 0, height: 0, visible: false });
  const contentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setTimeout(() => setIsVisible(true), 80); return () => clearTimeout(t); }, []);

  // Scroll tracking for the fixed right-edge scrollbar
  useEffect(() => {
    const el = contentScrollRef.current;
    if (!el) return;
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight <= clientHeight) { setScrollThumb({ top: 0, height: 0, visible: false }); return; }
      const tRatio = clientHeight / scrollHeight;
      const tH = Math.max(tRatio * 100, 6);
      const sRatio = scrollTop / (scrollHeight - clientHeight);
      setScrollThumb({ top: sRatio * (100 - tH), height: tH, visible: true });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, [activeTab]);

  const handleScrollbarDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = contentScrollRef.current;
    if (!el) return;
    const sY = e.clientY, sT = el.scrollTop;
    const { scrollHeight: sH, clientHeight: cH } = el;
    const max = sH - cH;
    const onMove = (ev: MouseEvent) => {
      el.scrollTop = Math.min(Math.max(sT + ((ev.clientY - sY) / window.innerHeight) * sH, 0), max);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = ''; document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'grabbing'; document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
  }, []);

  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = contentScrollRef.current;
    if (!el || (e.target as HTMLElement).classList.contains('explore-scroll-thumb')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    el.scrollTop = ((e.clientY - rect.top) / rect.height) * (el.scrollHeight - el.clientHeight);
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'matches',   label: 'Partidas',       icon: Activity   },
    { key: 'standings', label: 'Classificação',   icon: Table      },
    { key: 'stats',     label: 'Estatísticas',    icon: BarChart3  },
    { key: 'teams',     label: 'Times',           icon: Shield     },
    { key: 'players',   label: 'Jogadores',       icon: User       },
  ];

  return (
    <div className={`relative flex h-full flex-col overflow-hidden transition-all duration-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <style jsx global>{`
        .explore-hidden-scroll { overflow-y:auto; scrollbar-width:none; -ms-overflow-style:none; }
        .explore-hidden-scroll::-webkit-scrollbar { display:none; }
        .explore-scroll-track { position:absolute; right:0; top:0; bottom:0; width:8px; z-index:200; pointer-events:auto; cursor:pointer; }
        .explore-scroll-thumb { position:absolute; right:0; width:8px; border-radius:4px; background:rgba(255,255,255,0.18); transition:background .2s,opacity .3s; opacity:.6; cursor:grab; pointer-events:auto; }
        .explore-scroll-thumb:hover,.explore-scroll-thumb:active { background:rgba(255,255,255,0.35); opacity:1; }
        .explore-scroll-thumb:active { cursor:grabbing; }
        @keyframes exploreFadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .explore-fade-up { animation:exploreFadeUp .45s ease-out both; }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .skeleton { background:linear-gradient(90deg,rgba(255,255,255,.05)25%,rgba(255,255,255,.1)50%,rgba(255,255,255,.05)75%); background-size:200% auto; animation:shimmer 1.4s linear infinite; border-radius:.5rem; }
        .stat-bar-fill { transition:width .8s cubic-bezier(.4,0,.2,1); }
      `}</style>

      {/* Header */}
      <div className="bg-zinc-800/90 px-8 py-8 shrink-0">
        <div className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-2xl">Explorar</h1>
          </div>
          <p className="text-white/60 text-sm ml-1">Partidas, classificação, estatísticas, times e jogadores</p>
        </div>

        {/* Tabs */}
        <div className={`flex flex-wrap gap-2 mt-6 transition-all duration-700 delay-100 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === key
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-white/8 text-white/70 hover:bg-white/14 hover:text-white border border-white/10'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content + scrollbar scoped to the area below the header */}
      <div className="relative flex-1 overflow-hidden">
        <div ref={contentScrollRef} className="h-full p-6 explore-hidden-scroll">
          {activeTab === 'matches'   && <MatchesTab />}
          {activeTab === 'standings' && <StandingsTab />}
          {activeTab === 'stats'     && <StatsTab />}
          {activeTab === 'teams'     && <TeamsTab />}
          {activeTab === 'players'   && <PlayersTab />}
        </div>

        {/* Scrollbar — absolute within the content zone only */}
        {scrollThumb.visible && (
          <div className="explore-scroll-track" onClick={handleTrackClick}>
            <div className="explore-scroll-thumb" style={{ top: `${scrollThumb.top}%`, height: `${scrollThumb.height}%` }}
              onMouseDown={handleScrollbarDrag} />
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEAGUE SELECTOR (shared between tabs)
// ═══════════════════════════════════════════════════════════════════════════════

function LeagueSelector({ selected, onSelect }: { selected: typeof ESPN_LEAGUES[0]; onSelect: (l: typeof ESPN_LEAGUES[0]) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {ESPN_LEAGUES.map(l => (
        <button key={l.slug} onClick={() => onSelect(l)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-250 ${
            selected.slug === l.slug
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-white/8 text-white/70 hover:bg-white/14 hover:text-white border border-white/10'
          }`}>
          <span>{l.flag}</span><span>{l.name}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATCHES TAB
// ═══════════════════════════════════════════════════════════════════════════════

function MatchesTab() {
  const [league,       setLeague]       = useState(ESPN_LEAGUES[0]);
  const [events,       setEvents]       = useState<EspnEvent[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [selectedEvt,  setSelectedEvt]  = useState<EspnEvent | null>(null);

  const fetch_ = useCallback(async (slug: string) => {
    setLoading(true); setError(null); setSelectedEvt(null); setEvents([]);
    try {
      const r = await fetch(`${ESPN_API}/${slug}/scoreboard`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setEvents(d?.events ?? []);
    } catch { setError('Não foi possível carregar as partidas.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(league.slug); }, [league, fetch_]);

  if (selectedEvt) return <MatchDetailPanel event={selectedEvt} onBack={() => setSelectedEvt(null)} />;

  const exportMatchesCsv = useCallback(() => {
    const rows = events.map(ev => {
      const c = ev.competitions[0]; if (!c) return null;
      const h = c.competitors.find(x => x.homeAway === 'home');
      const a = c.competitors.find(x => x.homeAway === 'away');
      if (!h || !a) return null;
      const gS = (t: EspnCompetitor, n: string) => t.statistics?.find(s => s.name === n)?.displayValue ?? '';
      const det = c.details ?? [];
      return {
        Data: new Date(c.date).toLocaleDateString('pt-BR'),
        'Time Casa': h.team.displayName, 'Gols Casa': h.score,
        'Time Fora': a.team.displayName, 'Gols Fora': a.score,
        Status: c.status.type.description,
        'Chutes Casa': gS(h, 'totalShots'), 'Chutes Fora': gS(a, 'totalShots'),
        'No Gol Casa': gS(h, 'shotsOnTarget'), 'No Gol Fora': gS(a, 'shotsOnTarget'),
        'Posse Casa %': gS(h, 'possessionPct'), 'Posse Fora %': gS(a, 'possessionPct'),
        'Faltas Casa': gS(h, 'foulsCommitted'), 'Faltas Fora': gS(a, 'foulsCommitted'),
        'Escanteios Casa': gS(h, 'wonCorners'), 'Escanteios Fora': gS(a, 'wonCorners'),
        'Amarelos Casa': det.filter(d => d.yellowCard && !d.redCard && d.team?.id === h.id).length,
        'Amarelos Fora': det.filter(d => d.yellowCard && !d.redCard && d.team?.id === a.id).length,
        'Vermelhos Casa': det.filter(d => d.redCard && d.team?.id === h.id).length,
        'Vermelhos Fora': det.filter(d => d.redCard && d.team?.id === a.id).length,
        Local: c.venue?.displayName ?? '',
      };
    }).filter(Boolean) as Record<string, string | number>[];
    downloadCsv(rows, `partidas_${league.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
  }, [events, league]);

  return (
    <div className="explore-fade-up space-y-5">
      <LeagueSelector selected={league} onSelect={setLeague} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{league.flag}</span>
          <div>
            <h2 className="text-lg font-bold text-white">{league.name}</h2>
            <p className="text-white/50 text-xs">{league.country} · Partidas do dia</p>
          </div>
        </div>
        {events.length > 0 && (
          <ExportButton onClick={exportMatchesCsv} />
        )}
      </div>
      {loading && <SkeletonRows count={5} h="h-24" />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && events.length === 0 && <EmptyState message="Nenhuma partida encontrada para esta liga no momento." />}
      {!loading && events.length > 0 && (
        <div className="space-y-3">
          <p className="text-white/40 text-xs">{events.length} partida{events.length !== 1 ? 's' : ''}</p>
          {events.map((ev, i) => <MatchCard key={ev.id} event={ev} delay={i * 30} onClick={() => setSelectedEvt(ev)} />)}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STANDINGS TAB (NEW)
// ═══════════════════════════════════════════════════════════════════════════════

function StandingsTab() {
  const [league,   setLeague]   = useState(ESPN_LEAGUES[0]);
  const [entries,  setEntries]  = useState<EspnStandingEntry[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [season,   setSeason]   = useState('');

  const fetchStandings = useCallback(async (slug: string) => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${ESPN_API_V2}/${slug}/standings`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      const child = d?.children?.[0];
      setEntries(child?.standings?.entries ?? []);
      setSeason(child?.standings?.seasonDisplayName ?? d?.season?.displayName ?? '');
    } catch { setError('Não foi possível carregar a classificação.'); setEntries([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStandings(league.slug); }, [league, fetchStandings]);

  const getStat = (entry: EspnStandingEntry, name: string) =>
    entry.stats.find(s => s.name === name)?.displayValue ?? '—';
  const getStatNum = (entry: EspnStandingEntry, name: string) =>
    entry.stats.find(s => s.name === name)?.value ?? 0;

  const exportStandingsCsv = useCallback(() => {
    const rows = entries.map(entry => ({
      Posição: getStatNum(entry, 'rank'),
      Time: entry.team.displayName,
      Jogos: getStat(entry, 'gamesPlayed'),
      Vitórias: getStat(entry, 'wins'),
      Empates: getStat(entry, 'ties'),
      Derrotas: getStat(entry, 'losses'),
      'Gols Pró': getStat(entry, 'pointsFor'),
      'Gols Contra': getStat(entry, 'pointsAgainst'),
      'Saldo de Gols': getStat(entry, 'pointDifferential'),
      Pontos: getStat(entry, 'points'),
      Zona: entry.note?.description ?? '',
    }));
    downloadCsv(rows, `classificacao_${league.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
  }, [entries, league]);

  return (
    <div className="explore-fade-up space-y-5">
      <LeagueSelector selected={league} onSelect={setLeague} />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{league.flag}</span>
          <div>
            <h2 className="text-lg font-bold text-white">Classificação — {league.name}</h2>
            {season && <p className="text-white/50 text-xs">{season}</p>}
          </div>
        </div>
        {entries.length > 0 && (
          <ExportButton onClick={exportStandingsCsv} />
        )}
      </div>

      {loading && <SkeletonRows count={10} h="h-10" />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && entries.length > 0 && (
        <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          {/* Header */}
          <div className="grid grid-cols-[40px_1fr_40px_40px_40px_40px_40px_40px_50px_50px] gap-1 px-4 py-3 text-xs font-semibold text-white/50 border-b border-white/10 bg-white/5">
            <span className="text-center">#</span>
            <span>Time</span>
            <span className="text-center">J</span>
            <span className="text-center">V</span>
            <span className="text-center">E</span>
            <span className="text-center">D</span>
            <span className="text-center">GP</span>
            <span className="text-center">GC</span>
            <span className="text-center">SG</span>
            <span className="text-center font-bold text-amber-400">Pts</span>
          </div>

          {/* Rows */}
          {entries.map((entry, i) => {
            const noteColor = entry.note?.color;
            const isChampionsLeague = entry.note?.description?.includes('Champions');
            const isEuropaLeague = entry.note?.description?.includes('Europa');
            const isConference = entry.note?.description?.includes('Conference');
            const isRelegation = entry.note?.description?.includes('Relegation');

            let borderLeftColor = 'border-l-transparent';
            if (isChampionsLeague) borderLeftColor = 'border-l-green-500';
            else if (isEuropaLeague) borderLeftColor = 'border-l-blue-400';
            else if (isConference) borderLeftColor = 'border-l-sky-300';
            else if (isRelegation) borderLeftColor = 'border-l-red-500';
            else if (noteColor) borderLeftColor = 'border-l-white/20';

            return (
              <div key={entry.team.id}
                className={`grid grid-cols-[40px_1fr_40px_40px_40px_40px_40px_40px_50px_50px] gap-1 px-4 py-2.5 text-sm border-l-3 ${borderLeftColor} items-center ${
                  i !== entries.length - 1 ? 'border-b border-white/5' : ''
                } hover:bg-white/5 transition-colors explore-fade-up`}
                style={{ animationDelay: `${i * 20}ms`, borderLeftWidth: '3px' }}>
                <span className="text-center text-white/50 text-xs font-semibold">{getStatNum(entry, 'rank')}</span>
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={entry.team.logos?.[0]?.href} alt="" className="w-5 h-5 object-contain shrink-0" />
                  <span className="text-white font-medium text-sm truncate">{entry.team.shortDisplayName}</span>
                </div>
                <span className="text-center text-white/70">{getStat(entry, 'gamesPlayed')}</span>
                <span className="text-center text-green-400/80">{getStat(entry, 'wins')}</span>
                <span className="text-center text-white/50">{getStat(entry, 'ties')}</span>
                <span className="text-center text-red-400/80">{getStat(entry, 'losses')}</span>
                <span className="text-center text-white/60">{getStat(entry, 'pointsFor')}</span>
                <span className="text-center text-white/60">{getStat(entry, 'pointsAgainst')}</span>
                <span className={`text-center font-medium ${getStatNum(entry, 'pointDifferential') > 0 ? 'text-green-400' : getStatNum(entry, 'pointDifferential') < 0 ? 'text-red-400' : 'text-white/50'}`}>
                  {getStat(entry, 'pointDifferential')}
                </span>
                <span className="text-center font-bold text-amber-400">{getStat(entry, 'points')}</span>
              </div>
            );
          })}

          {/* Legend */}
          <div className="px-4 py-3 border-t border-white/10 bg-white/3 flex flex-wrap gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> Champions League</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> Europa League</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sky-300" /> Conference League</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Rebaixamento</span>
          </div>
        </div>
      )}

      {!loading && !error && entries.length === 0 && <EmptyState message="Classificação não disponível para esta liga." />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS TAB (NEW)
// ═══════════════════════════════════════════════════════════════════════════════

type MatchdayStats = {
  matchCount: number;
  totalGoals: number;
  goalsPerMatch: number;
  penaltyGoals: number;
  headerGoals: number;
  volleyGoals: number;
  ownGoals: number;
  regularGoals: number;
  yellowCards: number;
  redCards: number;
  yellowPerMatch: number;
  redPerMatch: number;
  avgShots: number;
  avgShotsOnTarget: number;
  avgPossession: number;
  avgFouls: number;
  avgCorners: number;
  homeWins: number;
  awayWins: number;
  draws: number;
};

function StatsTab() {
  const [league,  setLeague]  = useState(ESPN_LEAGUES[0]);
  const [events,  setEvents]  = useState<EspnEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchMatches = useCallback(async (slug: string) => {
    setLoading(true); setError(null); setEvents([]);
    try {
      const r = await fetch(`${ESPN_API}/${slug}/scoreboard`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setEvents(d?.events ?? []);
    } catch { setError('Não foi possível carregar os dados.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMatches(league.slug); }, [league, fetchMatches]);

  // Compute aggregate stats
  const stats: MatchdayStats | null = useMemo(() => {
    const finished = events.filter(e => e.status.type.completed);
    if (finished.length === 0) return null;
    const n = finished.length;

    let totalGoals = 0, penaltyGoals = 0, headerGoals = 0, volleyGoals = 0, ownGoals = 0;
    let yellowCards = 0, redCards = 0;
    let totalShots = 0, totalShotsOnTarget = 0, totalPossession = 0, totalFouls = 0, totalCorners = 0;
    let teamCount = 0, homeWins = 0, awayWins = 0, draws = 0;

    for (const event of finished) {
      const comp = event.competitions[0];
      if (!comp) continue;

      const details = comp.details ?? [];
      for (const d of details) {
        if (d.scoringPlay) {
          totalGoals++;
          const txt = d.type.text.toLowerCase();
          if (d.penaltyKick) penaltyGoals++;
          else if (d.ownGoal) ownGoals++;
          else if (txt.includes('header')) headerGoals++;
          else if (txt.includes('volley')) volleyGoals++;
        }
        if (d.yellowCard && !d.redCard) yellowCards++;
        if (d.redCard) redCards++;
      }

      // Result
      const home = comp.competitors.find(c => c.homeAway === 'home');
      const away = comp.competitors.find(c => c.homeAway === 'away');
      if (home && away) {
        if (home.winner) homeWins++;
        else if (away.winner) awayWins++;
        else draws++;
      }

      // Team stats
      for (const c of comp.competitors) {
        if (c.statistics) {
          teamCount++;
          const gS = (name: string) => parseFloat(c.statistics?.find(s => s.name === name)?.displayValue ?? '0');
          totalShots += gS('totalShots');
          totalShotsOnTarget += gS('shotsOnTarget');
          totalPossession += gS('possessionPct');
          totalFouls += gS('foulsCommitted');
          totalCorners += gS('wonCorners');
        }
      }
    }

    const regularGoals = totalGoals - penaltyGoals - headerGoals - volleyGoals - ownGoals;
    return {
      matchCount: n,
      totalGoals, goalsPerMatch: +(totalGoals / n).toFixed(2),
      penaltyGoals, headerGoals, volleyGoals, ownGoals, regularGoals,
      yellowCards, redCards,
      yellowPerMatch: +(yellowCards / n).toFixed(1),
      redPerMatch: +(redCards / n).toFixed(2),
      avgShots: teamCount ? +(totalShots / teamCount).toFixed(1) : 0,
      avgShotsOnTarget: teamCount ? +(totalShotsOnTarget / teamCount).toFixed(1) : 0,
      avgPossession: teamCount ? +(totalPossession / teamCount).toFixed(1) : 0,
      avgFouls: teamCount ? +(totalFouls / teamCount).toFixed(1) : 0,
      avgCorners: teamCount ? +(totalCorners / teamCount).toFixed(1) : 0,
      homeWins, awayWins, draws,
    };
  }, [events]);

  const exportStatsCsv = useCallback(() => {
    if (!stats) return;
    const rows = [{
      Liga: league.name,
      Data: new Date().toLocaleDateString('pt-BR'),
      'Partidas Encerradas': stats.matchCount,
      'Gols Totais': stats.totalGoals,
      'Gols/Partida': stats.goalsPerMatch,
      'Gols Jogada Regular': stats.regularGoals,
      'Gols de Pênalti': stats.penaltyGoals,
      'Gols de Cabeça': stats.headerGoals,
      'Gols de Voleio': stats.volleyGoals,
      'Gols Contra': stats.ownGoals,
      'Cartões Amarelos': stats.yellowCards,
      'Cartões Vermelhos': stats.redCards,
      'Amarelos/Partida': stats.yellowPerMatch,
      'Vermelhos/Partida': stats.redPerMatch,
      'Média Chutes/Time': stats.avgShots,
      'Média Chutes no Gol/Time': stats.avgShotsOnTarget,
      'Média Posse %': stats.avgPossession,
      'Média Faltas/Time': stats.avgFouls,
      'Média Escanteios/Time': stats.avgCorners,
      'Vitórias Casa': stats.homeWins,
      Empates: stats.draws,
      'Vitórias Fora': stats.awayWins,
    }];
    downloadCsv(rows, `estatisticas_${league.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
  }, [stats, league]);

  return (
    <div className="explore-fade-up space-y-5">
      <LeagueSelector selected={league} onSelect={setLeague} />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{league.flag}</span>
          <div>
            <h2 className="text-lg font-bold text-white">Estatísticas — {league.name}</h2>
            <p className="text-white/50 text-xs">Dados agregados das partidas do dia</p>
          </div>
        </div>
        {stats && (
          <ExportButton onClick={exportStatsCsv} />
        )}
      </div>

      {loading && <SkeletonRows count={6} h="h-20" />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && !stats && (
        <EmptyState message="Nenhuma partida encerrada disponível para calcular estatísticas." />
      )}

      {!loading && stats && (
        <div className="space-y-5">
          {/* Overview KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KPICard icon={Activity} label="Partidas" value={stats.matchCount} />
            <KPICard icon={Target} label="Gols Totais" value={stats.totalGoals} accent />
            <KPICard icon={TrendingUp} label="Gols / Partida" value={stats.goalsPerMatch} accent />
            <KPICard icon={Flag} label="Cartões / Partida" value={`${stats.yellowPerMatch}🟨 ${stats.redPerMatch}🟥`} />
          </div>

          {/* Goal Types Breakdown */}
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-5 shadow-xl">
            <SectionTitle icon={Target} title="Tipos de Gol" />
            <div className="mt-4 space-y-3">
              <GoalTypeBar label="Jogada Regular" count={stats.regularGoals} total={stats.totalGoals} color="from-blue-500 to-blue-600" emoji="⚽" />
              <GoalTypeBar label="Pênalti"        count={stats.penaltyGoals} total={stats.totalGoals} color="from-amber-500 to-amber-600" emoji="🎯" />
              <GoalTypeBar label="Cabeceio"       count={stats.headerGoals}  total={stats.totalGoals} color="from-purple-500 to-purple-600" emoji="🗣️" />
              <GoalTypeBar label="Voleio"         count={stats.volleyGoals}  total={stats.totalGoals} color="from-emerald-500 to-emerald-600" emoji="🦶" />
              <GoalTypeBar label="Gol Contra"     count={stats.ownGoals}     total={stats.totalGoals} color="from-red-500 to-red-600" emoji="🔴" />
            </div>
          </div>

          {/* Cards */}
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-5 shadow-xl">
            <SectionTitle icon={Flag} title="Cartões" />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <span className="inline-block w-5 h-7 rounded-sm bg-yellow-400 shadow-lg" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.yellowCards}</p>
                  <p className="text-xs text-white/50">Cartões Amarelos</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="inline-block w-5 h-7 rounded-sm bg-red-500 shadow-lg" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.redCards}</p>
                  <p className="text-xs text-white/50">Cartões Vermelhos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Per-Team Averages */}
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-5 shadow-xl">
            <SectionTitle icon={BarChart3} title="Médias por Time (por partida)" />
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <AvgStatCard label="Chutes" value={stats.avgShots} icon="🥅" />
              <AvgStatCard label="No Gol" value={stats.avgShotsOnTarget} icon="🎯" />
              <AvgStatCard label="Posse %" value={stats.avgPossession} icon="⏱️" />
              <AvgStatCard label="Faltas" value={stats.avgFouls} icon="🚫" />
              <AvgStatCard label="Escanteios" value={stats.avgCorners} icon="🏳️" />
            </div>
          </div>

          {/* Match Results Distribution */}
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-5 shadow-xl">
            <SectionTitle icon={Activity} title="Distribuição de Resultados" />
            <div className="mt-4 flex items-end gap-2 h-28">
              <ResultBar label="Casa" count={stats.homeWins} total={stats.matchCount} color="bg-green-500" />
              <ResultBar label="Empate" count={stats.draws} total={stats.matchCount} color="bg-white/40" />
              <ResultBar label="Fora" count={stats.awayWins} total={stats.matchCount} color="bg-blue-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stats Helpers ────────────────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-4 text-center hover:border-amber-500/30 transition-all">
      <Icon className={`w-5 h-5 mx-auto mb-2 ${accent ? 'text-amber-400' : 'text-white/50'}`} />
      <p className={`text-2xl font-bold ${accent ? 'text-amber-400' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-white/50 mt-1">{label}</p>
    </div>
  );
}

function GoalTypeBar({ label, count, total, color, emoji }: { label: string; count: number; total: number; color: string; emoji: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white/80">{label}</span>
          <span className="text-sm font-semibold text-white">{count} <span className="text-white/40">({pct.toFixed(0)}%)</span></span>
        </div>
        <div className="h-2 rounded-full bg-white/8 overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${color} stat-bar-fill`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function AvgStatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="text-center p-3 rounded-xl bg-white/5 border border-white/8 hover:border-amber-500/25 transition-all">
      <span className="text-lg">{icon}</span>
      <p className="text-lg font-bold text-white mt-1">{value}</p>
      <p className="text-xs text-white/50">{label}</p>
    </div>
  );
}

function ResultBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <span className="text-sm font-bold text-white">{count}</span>
      <div className="w-full rounded-t-lg overflow-hidden bg-white/8" style={{ height: '80px' }}>
        <div className={`w-full ${color} rounded-t-lg stat-bar-fill`} style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
      </div>
      <span className="text-xs text-white/50">{label}</span>
      <span className="text-xs text-white/40">{pct.toFixed(0)}%</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATCH CARD + DETAIL PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function MatchCard({ event, delay, onClick }: { event: EspnEvent; delay: number; onClick: () => void }) {
  const comp = event.competitions[0];
  if (!comp) return null;
  const home = comp.competitors.find(c => c.homeAway === 'home');
  const away = comp.competitors.find(c => c.homeAway === 'away');
  if (!home || !away) return null;
  const status = comp.status;
  const isLive = status.type.state === 'in';
  const isDone = status.type.completed;
  const details = comp.details ?? [];
  const homeYellow = details.filter(d => d.yellowCard && !d.redCard && d.team?.id === home.id).length;
  const awayYellow = details.filter(d => d.yellowCard && !d.redCard && d.team?.id === away.id).length;
  const homeRed = details.filter(d => d.redCard && d.team?.id === home.id).length;
  const awayRed = details.filter(d => d.redCard && d.team?.id === away.id).length;
  const totalCards = homeYellow + awayYellow + homeRed + awayRed;
  const gS = (t: EspnCompetitor, n: string) => t.statistics?.find(s => s.name === n)?.displayValue ?? '—';
  const mDate = new Date(comp.date);
  const dateStr = mDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const timeStr = mDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <button onClick={onClick}
      className="w-full group backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 hover:border-amber-500/40 hover:bg-black/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/8 p-5 text-left explore-fade-up"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-3 justify-end">
          <div className="text-right">
            <p className="text-sm font-semibold text-white group-hover:text-amber-100 transition-colors leading-tight">{home.team.shortDisplayName}</p>
            {isDone && home.winner && <span className="text-xs text-amber-400 font-medium">Vencedor</span>}
          </div>
          <img src={home.team.logo} alt="" className="w-9 h-9 object-contain" />
        </div>
        <div className="shrink-0 text-center min-w-[90px]">
          {isDone || isLive ? (
            <div className="flex items-center justify-center gap-2">
              <span className={`text-2xl font-bold ${home.winner ? 'text-white' : 'text-white/60'}`}>{home.score}</span>
              <span className="text-white/40 text-lg">–</span>
              <span className={`text-2xl font-bold ${away.winner ? 'text-white' : 'text-white/60'}`}>{away.score}</span>
            </div>
          ) : (
            <div><p className="text-sm text-white/80 font-medium">{timeStr}</p><p className="text-xs text-white/40">{dateStr}</p></div>
          )}
          <div className="mt-1.5 flex justify-center">
            {isLive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />{status.displayClock}</span>
            ) : isDone ? <span className="text-xs text-white/40 font-medium">{status.type.shortDetail}</span>
            : <span className="text-xs text-white/40">{dateStr}</span>}
          </div>
        </div>
        <div className="flex-1 flex items-center gap-3">
          <img src={away.team.logo} alt="" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-amber-100 transition-colors leading-tight">{away.team.shortDisplayName}</p>
            {isDone && away.winner && <span className="text-xs text-amber-400 font-medium">Vencedor</span>}
          </div>
        </div>
        {isDone && (
          <div className="hidden md:flex items-center gap-4 text-xs text-white/50 ml-2 shrink-0">
            {totalCards > 0 && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-3.5 bg-yellow-400 rounded-sm" />{homeYellow + awayYellow}
                {(homeRed + awayRed) > 0 && <><span className="inline-block w-2.5 h-3.5 bg-red-500 rounded-sm ml-1" />{homeRed + awayRed}</>}
              </span>
            )}
            {gS(home, 'totalShots') !== '—' && <span className="flex items-center gap-1"><Target className="w-3 h-3" />{gS(home, 'totalShots')} – {gS(away, 'totalShots')}</span>}
          </div>
        )}
        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-amber-400 shrink-0 transition-colors" />
      </div>
      {comp.venue?.displayName && <p className="mt-2.5 text-xs text-white/35 flex items-center gap-1 ml-1"><MapPin className="w-3 h-3" />{comp.venue.displayName}</p>}
    </button>
  );
}

function MatchDetailPanel({ event, onBack }: { event: EspnEvent; onBack: () => void }) {
  const comp = event.competitions[0];
  const home = comp.competitors.find(c => c.homeAway === 'home')!;
  const away = comp.competitors.find(c => c.homeAway === 'away')!;
  const details = comp.details ?? [];
  const headline = comp.headlines?.[0]?.description ?? '';
  const gS = (t: EspnCompetitor, n: string) => t.statistics?.find(s => s.name === n)?.displayValue ?? null;
  const status = comp.status;
  const isLive = status.type.state === 'in';
  const isDone = status.type.completed;
  const goals = details.filter(d => d.scoringPlay);
  const allCards = details.filter(d => d.yellowCard || d.redCard).sort((a, b) => parseMinute(a.clock.displayValue) - parseMinute(b.clock.displayValue));

  const statRows: { label: string; statName: string }[] = [
    { label: 'Chutes',          statName: 'totalShots'     },
    { label: 'Chutes no gol',   statName: 'shotsOnTarget'  },
    { label: 'Faltas',          statName: 'foulsCommitted' },
    { label: 'Escanteios',      statName: 'wonCorners'     },
    { label: 'Posse de bola %', statName: 'possessionPct'  },
  ];

  return (
    <div className="explore-fade-up space-y-5 max-w-3xl">
      <button onClick={onBack} className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />Voltar às partidas</button>

      {/* Score header */}
      <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-6 shadow-2xl">
        <div className="flex justify-center mb-4">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/35 text-red-400 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />AO VIVO — {status.displayClock}</span>
          ) : isDone ? <span className="text-white/50 text-sm font-medium">Encerrado · {status.type.detail}</span>
          : <span className="text-white/50 text-sm">{new Date(comp.date).toLocaleString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <img src={home.team.logo} alt="" className="w-14 h-14 object-contain drop-shadow-xl" />
            <p className="text-sm font-semibold text-white leading-snug">{home.team.displayName}</p>
            {home.form && <FormBadges form={home.form} />}
          </div>
          <div className="text-center">
            {(isDone || isLive) ? (
              <div className="flex items-center justify-center gap-3">
                <span className={`text-5xl font-bold ${home.winner ? 'text-white' : 'text-white/50'}`}>{home.score}</span>
                <span className="text-white/30 text-3xl">–</span>
                <span className={`text-5xl font-bold ${away.winner ? 'text-white' : 'text-white/50'}`}>{away.score}</span>
              </div>
            ) : <p className="text-3xl font-bold text-white/60">vs</p>}
            {goals.length > 0 && (
              <div className="mt-3 space-y-1 text-xs text-white/60">
                {goals.map((g, i) => {
                  const player = g.athletesInvolved?.[0];
                  const isHome = g.team?.id === home.id;
                  return (
                    <div key={i} className={`flex items-center gap-1.5 ${isHome ? 'justify-start' : 'justify-end'}`}>
                      {isHome && <span className="text-green-400">⚽</span>}
                      <span>{player?.shortName ?? '?'} {g.clock.displayValue}</span>
                      {g.penaltyKick && <span className="text-white/40">(pen)</span>}
                      {g.ownGoal && <span className="text-red-400">(og)</span>}
                      {!isHome && <span className="text-green-400">⚽</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <img src={away.team.logo} alt="" className="w-14 h-14 object-contain drop-shadow-xl" />
            <p className="text-sm font-semibold text-white leading-snug">{away.team.displayName}</p>
            {away.form && <FormBadges form={away.form} />}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-white/40">
          {comp.venue?.displayName && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{comp.venue.displayName}</span>}
          {comp.attendance != null && comp.attendance > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{comp.attendance.toLocaleString('pt-BR')} espectadores</span>}
        </div>
        {headline && <p className="mt-4 text-xs text-white/50 italic text-center border-t border-white/8 pt-4">{headline}</p>}
      </div>

      {/* Stats */}
      {home.statistics && home.statistics.length > 0 && (
        <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-6 shadow-xl">
          <SectionTitle icon={Activity} title="Estatísticas da Partida" />
          <div className="mt-5 space-y-4">
            {statRows.map(({ label, statName }) => {
              const hV = gS(home, statName), aV = gS(away, statName);
              if (!hV || !aV) return null;
              const hN = parseFloat(hV.replace(',', '.')), aN = parseFloat(aV.replace(',', '.'));
              const t = hN + aN;
              const hP = t > 0 ? (hN / t) * 100 : 50;
              return (
                <div key={statName}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-white/90 w-10 text-left">{hV}</span>
                    <span className="text-white/50 text-center flex-1">{label}</span>
                    <span className="font-semibold text-white/90 w-10 text-right">{aV}</span>
                  </div>
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/8">
                    <div className="stat-bar-fill h-full rounded-full" style={{ width: `${hP}%`, background: home.team.color && home.team.color !== '000000' && home.team.color !== 'ffffff' ? `#${home.team.color}` : '#f59e0b' }} />
                    <div className="stat-bar-fill h-full rounded-full" style={{ width: `${100 - hP}%`, background: away.team.color && away.team.color !== '000000' && away.team.color !== 'ffffff' ? `#${away.team.color}` : '#6366f1' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cards */}
      {allCards.length > 0 && (
        <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-6 shadow-xl">
          <SectionTitle icon={Flag} title="Cartões" />
          <div className="mt-4 space-y-2">
            {allCards.map((card, i) => {
              const player = card.athletesInvolved?.[0];
              const isHome = card.team?.id === home.id;
              const isRed = card.redCard;
              return (
                <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 ${isHome ? '' : 'flex-row-reverse'}`}>
                  <span className={`shrink-0 inline-block w-3 h-4 rounded-sm ${isRed ? 'bg-red-500' : 'bg-yellow-400'}`} />
                  <img src={isHome ? home.team.logo : away.team.logo} alt="" className="w-5 h-5 object-contain shrink-0" />
                  <span className="flex-1 text-sm text-white/80">
                    {player?.displayName ?? (isHome ? home.team.shortDisplayName : away.team.shortDisplayName)}
                    {player?.jersey && <span className="text-white/40 ml-1">#{player.jersey}</span>}
                  </span>
                  <span className="text-xs text-white/50 flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" />{card.clock.displayValue}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FormBadges({ form }: { form: string }) {
  return (
    <div className="flex gap-0.5">
      {form.split('').map((f, i) => (
        <span key={i} className={`w-4 h-4 rounded-sm text-[9px] font-bold flex items-center justify-center ${
          f === 'W' ? 'bg-green-500 text-white' : f === 'L' ? 'bg-red-500 text-white' : 'bg-white/20 text-white/70'
        }`}>{f}</span>
      ))}
    </div>
  );
}

function parseMinute(str: string): number { return parseInt(str.replace(/[^0-9]/g, ''), 10) || 0; }

// ═══════════════════════════════════════════════════════════════════════════════
// TEAMS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function TeamsTab() {
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState<SportsTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<SportsTeam | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setError(null); setSearched(true); setSelectedTeam(null);
    try {
      const r = await fetch(`${SPORTSDB_API}/searchteams.php?t=${encodeURIComponent(q)}`);
      const d = await r.json();
      setTeams(d?.teams ?? []);
    } catch { setError('Erro ao buscar times.'); }
    finally { setLoading(false); }
  }, []);

  if (selectedTeam) return <TeamDetailPanel team={selectedTeam} onBack={() => setSelectedTeam(null)} />;

  return (
    <div className="explore-fade-up space-y-6">
      <SearchBox label="Buscar time" placeholder="Ex: Arsenal, Flamengo, Barcelona..." query={query} setQuery={setQuery}
        onSearch={() => search(query)} loading={loading} onClear={() => { setQuery(''); setTeams([]); setSearched(false); }} />
      {error && <ErrorCard message={error} />}
      {loading && <LoadingGrid />}
      {!loading && searched && teams.length === 0 && !error && <EmptyState message={`Nenhum time para "${query}".`} />}
      {!loading && !searched && <PlaceholderState icon={Shield} text="Digite o nome de um time para começar" />}
      {!loading && teams.length > 0 && (
        <div>
          <p className="text-white/50 text-sm mb-4">{teams.length} time{teams.length !== 1 ? 's' : ''} encontrado{teams.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {teams.map((t, i) => <TeamCard key={t.idTeam} team={t} delay={i * 30} onClick={() => setSelectedTeam(t)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYERS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function PlayersTab() {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<SportsPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<SportsPlayer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setError(null); setSearched(true); setSelectedPlayer(null);
    try {
      const r = await fetch(`${SPORTSDB_API}/searchplayers.php?p=${encodeURIComponent(q)}`);
      const d = await r.json();
      setPlayers(d?.player ?? []);
    } catch { setError('Erro ao buscar jogadores.'); }
    finally { setLoading(false); }
  }, []);

  if (selectedPlayer) return <PlayerDetailPanel player={selectedPlayer} onBack={() => setSelectedPlayer(null)} />;

  return (
    <div className="explore-fade-up space-y-6">
      <SearchBox label="Buscar jogador" placeholder="Ex: Neymar, Messi, Vinicius Jr..." query={query} setQuery={setQuery}
        onSearch={() => search(query)} loading={loading} onClear={() => { setQuery(''); setPlayers([]); setSearched(false); }} />
      {error && <ErrorCard message={error} />}
      {loading && <LoadingGrid />}
      {!loading && searched && players.length === 0 && !error && <EmptyState message={`Nenhum jogador para "${query}".`} />}
      {!loading && !searched && <PlaceholderState icon={User} text="Digite o nome de um jogador para começar" />}
      {!loading && players.length > 0 && (
        <div>
          <p className="text-white/50 text-sm mb-4">{players.length} jogador{players.length !== 1 ? 'es' : ''}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {players.map((p, i) => <PlayerCard key={p.idPlayer} player={p} delay={i * 30} onClick={() => setSelectedPlayer(p)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM/PLAYER DETAIL PANELS
// ═══════════════════════════════════════════════════════════════════════════════

function TeamDetailPanel({ team, onBack }: { team: SportsTeam; onBack: () => void }) {
  const [players, setPlayers] = useState<SportsPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<SportsPlayer | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const r = await fetch(`${SPORTSDB_API}/lookup_all_players.php?id=${team.idTeam}`); const d = await r.json(); setPlayers(d?.player ?? []); }
      catch { setPlayers([]); }
      finally { setLoading(false); }
    })();
  }, [team.idTeam]);

  if (selectedPlayer) return <PlayerDetailPanel player={selectedPlayer} onBack={() => setSelectedPlayer(null)} />;

  const desc = team.strDescriptionPT || team.strDescriptionEN || '';
  return (
    <div className="explore-fade-up space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium"><ArrowLeft className="w-4 h-4" />Voltar</button>
      <div className="backdrop-blur-xl bg-black/40 rounded-2xl p-6 shadow-2xl border border-white/10">
        <div className="flex items-start gap-5">
          {team.strTeamBadge ? <img src={team.strTeamBadge} alt="" className="w-20 h-20 object-contain shrink-0 drop-shadow-2xl" />
           : <div className="w-20 h-20 rounded-xl bg-white/8 flex items-center justify-center"><Shield className="w-10 h-10 text-white/30" /></div>}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white mb-1">{team.strTeam}</h2>
            <div className="flex flex-wrap gap-3 text-sm text-white/60">
              {team.strCountry && <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />{team.strCountry}</span>}
              {team.strCity && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{team.strCity}</span>}
              {team.intFormedYear && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Fundado em {team.intFormedYear}</span>}
              {team.strStadium && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{team.strStadium}</span>}
            </div>
            {team.strLeague && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium border border-amber-500/25">
                  <Trophy className="w-3 h-3" />{team.strLeague}</span>
              </div>
            )}
          </div>
        </div>
        {desc && <p className="mt-5 text-sm text-white/60 leading-relaxed line-clamp-5">{desc}</p>}
        {team.strWebsite && (
          <a href={team.strWebsite.startsWith('http') ? team.strWebsite : `https://${team.strWebsite}`}
            target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-4 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors">
            <Globe className="w-3.5 h-3.5" />{team.strWebsite}<ChevronRight className="w-3.5 h-3.5" /></a>
        )}
      </div>
      <div>
        <SectionTitle icon={Users} title={`Elenco (${players.length})`} />
        {loading && <LoadingGrid />}
        {!loading && players.length === 0 && <EmptyState message="Nenhum jogador encontrado." />}
        {!loading && players.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
            {players.map((p, i) => <PlayerCard key={p.idPlayer} player={p} delay={i * 20} onClick={() => setSelectedPlayer(p)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerDetailPanel({ player, onBack }: { player: SportsPlayer; onBack: () => void }) {
  const [detail, setDetail] = useState<SportsPlayer>(player);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const r = await fetch(`${SPORTSDB_API}/lookupplayer.php?id=${player.idPlayer}`); const d = await r.json(); if (d?.players?.[0]) setDetail(d.players[0]); }
      catch { /* keep existing */ }
      finally { setLoading(false); }
    })();
  }, [player.idPlayer]);

  const photo = detail.strCutout || detail.strThumb;
  const desc = detail.strDescriptionPT || detail.strDescriptionEN || '';
  return (
    <div className="explore-fade-up space-y-6 max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium"><ArrowLeft className="w-4 h-4" />Voltar</button>
      <div className="backdrop-blur-xl bg-black/40 rounded-2xl p-6 shadow-2xl border border-white/10">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="flex gap-6">
            {photo ? <img src={photo} alt="" className="w-28 h-28 object-cover rounded-xl shrink-0 shadow-2xl border border-white/10" />
             : <div className="w-28 h-28 rounded-xl bg-white/8 flex items-center justify-center shrink-0"><User className="w-12 h-12 text-white/30" /></div>}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white mb-2">{detail.strPlayer}</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {detail.strPosition && <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-semibold border border-amber-500/25">{detail.strPosition}</span>}
                {detail.strNationality && <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-medium border border-white/10">{detail.strNationality}</span>}
              </div>
              <div className="space-y-1.5 text-sm text-white/60">
                {detail.strTeam && <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 shrink-0" /><span>{detail.strTeam}</span></div>}
                {detail.dateBorn && <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>{new Date(detail.dateBorn).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>}
                {detail.strHeight && <div className="flex items-center gap-2"><Star className="w-3.5 h-3.5 shrink-0" /><span>Altura: {detail.strHeight} · Peso: {detail.strWeight ?? '—'}</span></div>}
                {detail.strNumber && <div className="flex items-center gap-2"><span className="w-3.5 text-center text-xs font-bold">#</span><span>Camisa {detail.strNumber}</span></div>}
              </div>
            </div>
          </div>
        )}
        {!loading && desc && <p className="mt-5 text-sm text-white/60 leading-relaxed line-clamp-8 border-t border-white/8 pt-4">{desc}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED CARD COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function TeamCard({ team, delay, onClick }: { team: SportsTeam; delay: number; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="group flex flex-col items-center text-center gap-3 p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 hover:border-amber-500/40 hover:bg-black/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 explore-fade-up"
      style={{ animationDelay: `${delay}ms` }}>
      {team.strTeamBadge ? <img src={team.strTeamBadge} alt="" className="w-12 h-12 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md" />
       : <div className="w-12 h-12 rounded-xl bg-white/8 flex items-center justify-center"><Shield className="w-6 h-6 text-white/30" /></div>}
      <div>
        <p className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors leading-snug">{team.strTeam}</p>
        {team.strCountry && <p className="text-xs text-white/45 mt-0.5">{team.strCountry}</p>}
      </div>
    </button>
  );
}

function PlayerCard({ player, delay, onClick }: { player: SportsPlayer; delay: number; onClick: () => void }) {
  const photo = player.strCutout || player.strThumb;
  return (
    <button onClick={onClick}
      className="group flex flex-col items-center text-center gap-3 p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 hover:border-amber-500/40 hover:bg-black/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 explore-fade-up"
      style={{ animationDelay: `${delay}ms` }}>
      {photo ? <img src={photo} alt="" className="w-14 h-14 object-cover rounded-full group-hover:scale-105 transition-transform duration-300 shadow-md border border-white/10" />
       : <div className="w-14 h-14 rounded-full bg-white/8 flex items-center justify-center"><User className="w-7 h-7 text-white/30" /></div>}
      <div>
        <p className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors leading-snug">{player.strPlayer}</p>
        {player.strPosition && <p className="text-xs text-amber-400/80 font-medium mt-0.5">{player.strPosition}</p>}
        {player.strTeam && <p className="text-xs text-white/40 mt-0.5 truncate max-w-[100px]">{player.strTeam}</p>}
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 text-white/70 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 text-xs font-medium transition-all duration-300 hover:shadow-md hover:shadow-amber-500/10 group">
      <Download className="w-3.5 h-3.5 group-hover:animate-bounce" />
      <span>Exportar CSV</span>
    </button>
  );
}

function SearchBox({ label, placeholder, query, setQuery, onSearch, loading, onClear }:
  { label: string; placeholder: string; query: string; setQuery: (v: string) => void; onSearch: () => void; loading: boolean; onClear: () => void }) {
  return (
    <div className="backdrop-blur-xl bg-black/40 rounded-2xl p-5 shadow-2xl border border-white/10">
      <label className="block text-sm font-medium text-white/80 mb-2">{label}</label>
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch()} placeholder={placeholder}
            className="w-full px-4 py-3 pr-10 rounded-xl bg-black/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/60 transition-all backdrop-blur-sm border border-white/10" />
          {query && <button onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"><X className="w-4 h-4" /></button>}
        </div>
        <button onClick={onSearch} disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2">
          <Search className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />{loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 rounded-lg bg-amber-500/20"><Icon className="w-4 h-4 text-amber-400" /></div>
      <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">{title}</h2>
    </div>
  );
}

function SkeletonRows({ count, h }: { count: number; h: string }) {
  return <div className="space-y-2 mt-2">{Array.from({ length: count }).map((_, i) => <div key={i} className={`${h} rounded-2xl skeleton`} />)}</div>;
}

function LoadingGrid() {
  return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 mt-2">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}</div>;
}

function ErrorCard({ message }: { message: string }) {
  return <div className="backdrop-blur-xl bg-red-500/15 rounded-2xl p-5 border border-red-500/25 text-red-300 flex items-center gap-3"><span className="text-xl">⚠️</span><span className="text-sm">{message}</span></div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="backdrop-blur-xl bg-black/30 rounded-2xl p-12 text-center border border-white/8"><Trophy className="w-10 h-10 text-white/20 mx-auto mb-3" /><p className="text-white/50 text-sm">{message}</p></div>;
}

function PlaceholderState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return <div className="flex flex-col items-center justify-center py-16 text-white/30 space-y-3"><Icon className="w-14 h-14 opacity-40" /><p>{text}</p></div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProtectedExplorePage() {
  return <AuthGuard><ExplorePage /></AuthGuard>;
}
