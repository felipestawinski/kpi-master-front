'use client';

import AuthGuard from '@/components/AuthGuard';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Trophy,
  ChevronRight,
  Globe,
  Calendar,
  MapPin,
  Shield,
  ArrowLeft,
  Users,
  User,
  Activity,
  Target,
  Flag,
  Clock,
  TrendingUp,
  BarChart3,
  Download,
  Loader2,
  Upload,
  Check,
  AlertTriangle,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

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

type SelectedTeamInfo = {
  id: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  rank: number;
  points: string;
  gamesPlayed: string;
  wins: string;
  draws: string;
  losses: string;
  goalsFor: string;
  goalsAgainst: string;
};

type LeagueInfo = { slug: string; name: string; country: string; flag: string; icon: string; gradient: string; accent: string };
type Tab = 'leagues' | 'matches';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const ESPN_API    = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const ESPN_API_V2 = 'https://site.api.espn.com/apis/v2/sports/soccer';
const API_FOOTBALL_KEY = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_API_FOOTBALL_KEY : '';
const API_FOOTBALL_URL = 'https://v3.football.api-sports.io';

// Module-level cache for API-Football photos: teamName -> Map<normalizedPlayerName, photoUrl>
const photoCache = new Map<string, Map<string, string>>();

function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

async function fetchPlayerPhotos(teamName: string, leagueSlug: string): Promise<Map<string, string>> {
  const cacheKey = `${teamName}_${leagueSlug}`;
  if (photoCache.has(cacheKey)) return photoCache.get(cacheKey)!;
  if (!API_FOOTBALL_KEY) { photoCache.set(cacheKey, new Map()); return new Map(); }

  const photos = new Map<string, string>();
  try {
    // Map ESPN league slugs to API-Football league IDs
    const leagueMap: Record<string, number> = {
      'eng.1': 39, 'esp.1': 140, 'ger.1': 78, 'ita.1': 135, 'fra.1': 61,
      'por.1': 94, 'bra.1': 71, 'usa.1': 253,
      'uefa.champions': 2, 'uefa.europa': 3, 'conmebol.libertadores': 13,
    };
    const leagueId = leagueMap[leagueSlug];
    if (!leagueId) { photoCache.set(cacheKey, photos); return photos; }

    // Search for team
    const searchRes = await fetch(`${API_FOOTBALL_URL}/teams?search=${encodeURIComponent(teamName)}&league=${leagueId}&season=2025`, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY! }
    });
    if (!searchRes.ok) { photoCache.set(cacheKey, photos); return photos; }
    const searchData = await searchRes.json();
    const apiTeam = searchData?.response?.[0];
    if (!apiTeam?.team?.id) { photoCache.set(cacheKey, photos); return photos; }

    // Fetch squad
    const squadRes = await fetch(`${API_FOOTBALL_URL}/players/squads?team=${apiTeam.team.id}`, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY! }
    });
    if (!squadRes.ok) { photoCache.set(cacheKey, photos); return photos; }
    const squadData = await squadRes.json();
    const players = squadData?.response?.[0]?.players ?? [];
    for (const p of players) {
      if (p.name && p.photo) {
        photos.set(normalizeName(p.name), p.photo);
      }
    }
  } catch { /* API-Football optional */ }
  photoCache.set(cacheKey, photos);
  return photos;
}

const ESPN_LEAGUES: LeagueInfo[] = [
  { slug: 'eng.1',                 name: 'Premier League',   country: 'Inglaterra',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', icon: 'https://a.espncdn.com/i/teamlogos/countries/500/eng.png', gradient: 'from-purple-500/25 to-fuchsia-700/25', accent: 'hover:border-purple-400/50' },
  { slug: 'esp.1',                 name: 'La Liga',          country: 'Espanha',        flag: '🇪🇸', icon: 'https://a.espncdn.com/i/teamlogos/countries/500/esp.png', gradient: 'from-orange-500/25 to-red-700/25',    accent: 'hover:border-orange-400/50' },
  { slug: 'ger.1',                 name: 'Bundesliga',       country: 'Alemanha',       flag: '🇩🇪', icon: 'https://a.espncdn.com/i/teamlogos/countries/500/ger.png', gradient: 'from-red-600/25 to-rose-800/25',      accent: 'hover:border-red-400/50' },
  { slug: 'ita.1',                 name: 'Serie A',          country: 'Itália',         flag: '🇮🇹', icon: 'https://a.espncdn.com/i/teamlogos/countries/500/ita.png', gradient: 'from-blue-600/25 to-indigo-800/25',   accent: 'hover:border-blue-400/50' },
  { slug: 'fra.1',                 name: 'Ligue 1',          country: 'França',         flag: '🇫🇷', icon: 'https://a.espncdn.com/i/teamlogos/countries/500/fra.png', gradient: 'from-sky-600/25 to-blue-800/25',      accent: 'hover:border-sky-400/50' },
  { slug: 'por.1',                 name: 'Liga Portugal',    country: 'Portugal',       flag: '🇵🇹', icon: 'https://a.espncdn.com/i/teamlogos/countries/500/por.png', gradient: 'from-green-600/25 to-emerald-800/25', accent: 'hover:border-green-400/50' },
  { slug: 'bra.1',                 name: 'Brasileirão',      country: 'Brasil',         flag: '🇧🇷', icon: 'https://a.espncdn.com/i/teamlogos/countries/500/bra.png', gradient: 'from-green-500/25 to-yellow-700/25',  accent: 'hover:border-green-400/50' },
  { slug: 'usa.1',                 name: 'MLS',              country: 'EUA',            flag: '🇺🇸', icon: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png', gradient: 'from-red-500/25 to-blue-700/25',      accent: 'hover:border-red-400/50' },
  { slug: 'uefa.champions',        name: 'Champions League', country: 'Europa',         flag: '🏆', icon: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',    gradient: 'from-indigo-600/25 to-blue-900/25',   accent: 'hover:border-indigo-400/50' },
  { slug: 'uefa.europa',           name: 'Europa League',    country: 'Europa',         flag: '🏆', icon: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2310.png', gradient: 'from-orange-500/25 to-amber-800/25',  accent: 'hover:border-orange-400/50' },
  { slug: 'conmebol.libertadores', name: 'Libertadores',     country: 'América do Sul', flag: '🏆', icon: 'https://a.espncdn.com/i/leaguelogos/soccer/500/4.png',    gradient: 'from-yellow-600/25 to-green-800/25',  accent: 'hover:border-yellow-400/50' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CSV EXPORT UTILITY
// ═══════════════════════════════════════════════════════════════════════════════

function buildCsvBlob(rows: Record<string, string | number>[]): Blob | null {
  if (rows.length === 0) return null;
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
  return new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
}

function downloadCsv(rows: Record<string, string | number>[], filename: string) {
  const blob = buildCsvBlob(rows);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

async function uploadCsvToIpfs(rows: Record<string, string | number>[], filename: string): Promise<boolean> {
  const blob = buildCsvBlob(rows);
  if (!blob) return false;
  const file = new File([blob], filename, { type: 'text/csv' });
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', filename.replace('.csv', ''));
  formData.append('institution', '');
  formData.append('mode', 'raw');
  const res = await fetch('http://localhost:8080/upload-confirmed', {
    method: 'POST',
    headers: token ? { Authorization: token } : {},
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text() || 'Upload failed');
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ExplorePage() {
  const [activeTab, setActiveTab] = useState<Tab>('leagues');
  const [isVisible, setIsVisible] = useState(false);
  const [scrollThumb, setScrollThumb] = useState({ top: 0, height: 0, visible: false });
  const contentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setTimeout(() => setIsVisible(true), 80); return () => clearTimeout(t); }, []);

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
    { key: 'leagues', label: 'Ligas',    icon: Trophy   },
    { key: 'matches', label: 'Partidas', icon: Activity },
  ];

  return (
    <div className={`relative flex h-full flex-col overflow-hidden transition-all duration-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <style jsx global>{`
        .explore-hidden-scroll { overflow-y:auto; scrollbar-width:none; -ms-overflow-style:none; -webkit-overflow-scrolling:touch; }
        .explore-hidden-scroll::-webkit-scrollbar { display:none; }
        .explore-scroll-track { position:absolute; right:0; top:0; bottom:0; width:8px; z-index:200; pointer-events:auto; cursor:pointer; }
        .explore-scroll-thumb { position:absolute; right:0; width:8px; border-radius:4px; background:rgba(255,255,255,0.18); transition:background .2s,opacity .3s; opacity:.6; cursor:grab; pointer-events:auto; }
        .explore-scroll-thumb:hover,.explore-scroll-thumb:active { background:rgba(255,255,255,0.35); opacity:1; }
        .explore-scroll-thumb:active { cursor:grabbing; }
        @keyframes exploreFadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .explore-fade-up { animation:exploreFadeUp .3s ease-out both; }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .skeleton { background:linear-gradient(90deg,rgba(255,255,255,.05)25%,rgba(255,255,255,.1)50%,rgba(255,255,255,.05)75%); background-size:200% auto; animation:shimmer 1.4s linear infinite; border-radius:.5rem; }
        .stat-bar-fill { transition:width .8s cubic-bezier(.4,0,.2,1); }
        .explore-card { contain:layout style paint; }
      `}</style>

      {/* Header */}
      <div className="bg-zinc-800/90 px-8 py-8 shrink-0">
        <div className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white drop-shadow-2xl">Explorar</h1>
          </div>
          <p className="text-white/60 text-sm ml-1">Ligas, classificação, times e partidas ao vivo</p>
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

      {/* Content + scrollbar */}
      <div className="relative flex-1 overflow-hidden">
        <div ref={contentScrollRef} className="h-full p-6 explore-hidden-scroll">
          {activeTab === 'leagues' && <LeaguesFlow />}
          {activeTab === 'matches' && <MatchesTab />}
        </div>
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
// LEAGUES FLOW — 3‑level drill‑down
// ═══════════════════════════════════════════════════════════════════════════════

function LeaguesFlow() {
  const [selectedLeague,  setSelectedLeague]  = useState<LeagueInfo | null>(null);
  const [selectedTeam,    setSelectedTeam]    = useState<SelectedTeamInfo | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedPlayer,  setSelectedPlayer]  = useState<any>(null);

  if (selectedPlayer && selectedTeam && selectedLeague)
    return <PlayerDetailView player={selectedPlayer} team={selectedTeam} league={selectedLeague} onBack={() => setSelectedPlayer(null)} />;
  if (selectedTeam && selectedLeague)
    return <TeamDetailView team={selectedTeam} league={selectedLeague} onBack={() => { setSelectedTeam(null); setSelectedPlayer(null); }} onSelectPlayer={setSelectedPlayer} />;
  if (selectedLeague)
    return <LeagueDetailView league={selectedLeague} onBack={() => { setSelectedLeague(null); setSelectedTeam(null); setSelectedPlayer(null); }} onSelectTeam={setSelectedTeam} />;
  return <LeagueGridView onSelect={setSelectedLeague} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEAGUE GRID VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function LeagueGridView({ onSelect }: { onSelect: (l: LeagueInfo) => void }) {
  return (
    <div className="explore-fade-up space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Principais Ligas</h2>
        <p className="text-white/50 text-sm">Selecione uma liga para ver a classificação e acessar dados detalhados dos times</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {ESPN_LEAGUES.map((league, i) => (
          <button key={league.slug} onClick={() => onSelect(league)}
            className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-amber-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] p-6 text-center explore-fade-up"
            style={{ animationDelay: `${i * 50}ms`, background: 'rgba(200, 200, 210, 0.12)' }}>
            <img src={league.icon} alt={league.country} className="w-14 h-14 mx-auto mb-3 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-lg rounded-md" />
            <p className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">{league.name}</p>
            <p className="text-xs text-white/45 mt-1">{league.country}</p>
            <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/0 group-hover:text-white/40 transition-all duration-300 translate-x-0 group-hover:translate-x-1" />
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/60 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEAGUE DETAIL VIEW — Standings with clickable teams
// ═══════════════════════════════════════════════════════════════════════════════

function LeagueDetailView({ league, onBack, onSelectTeam }: {
  league: LeagueInfo; onBack: () => void; onSelectTeam: (t: SelectedTeamInfo) => void;
}) {
  const [entries, setEntries] = useState<EspnStandingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [season,  setSeason]  = useState('');

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

  const handleTeamClick = (entry: EspnStandingEntry) => {
    onSelectTeam({
      id: entry.team.id,
      displayName: entry.team.displayName,
      shortDisplayName: entry.team.shortDisplayName,
      logo: entry.team.logos?.[0]?.href ?? '',
      rank: getStatNum(entry, 'rank'),
      points: getStat(entry, 'points'),
      gamesPlayed: getStat(entry, 'gamesPlayed'),
      wins: getStat(entry, 'wins'),
      draws: getStat(entry, 'ties'),
      losses: getStat(entry, 'losses'),
      goalsFor: getStat(entry, 'pointsFor'),
      goalsAgainst: getStat(entry, 'pointsAgainst'),
    });
  };

  const exportStandingsCsv = useCallback(() => {
    const rows = entries.map(entry => ({
      rank: getStatNum(entry, 'rank'),
      team: entry.team.displayName,
      matches_played: getStat(entry, 'gamesPlayed'),
      wins: getStat(entry, 'wins'),
      draws: getStat(entry, 'ties'),
      losses: getStat(entry, 'losses'),
      goals_for: getStat(entry, 'pointsFor'),
      goals_against: getStat(entry, 'pointsAgainst'),
      goal_difference: getStat(entry, 'pointDifferential'),
      points: getStat(entry, 'points'),
      zone: entry.note?.description ?? '',
    }));
    downloadCsv(rows, `standings_${league.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
  }, [entries, league]);

  return (
    <div className="explore-fade-up space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />Voltar às ligas
      </button>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{league.flag}</span>
          <div>
            <h2 className="text-xl font-bold text-white">{league.name}</h2>
            <p className="text-white/50 text-xs">{league.country}{season ? ` · ${season}` : ''}</p>
          </div>
        </div>
        {entries.length > 0 && <ExportButton onClick={exportStandingsCsv} />}
      </div>

      {loading && <SkeletonRows count={12} h="h-10" />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && entries.length > 0 && (
        <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          {/* Table header */}
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

          {/* Table rows — clickable */}
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
              <button key={entry.team.id} onClick={() => handleTeamClick(entry)}
                className={`w-full grid grid-cols-[40px_1fr_40px_40px_40px_40px_40px_40px_50px_50px] gap-1 px-4 py-2.5 text-sm border-l-3 ${borderLeftColor} items-center ${
                  i !== entries.length - 1 ? 'border-b border-white/5' : ''
                } hover:bg-amber-500/8 transition-colors group text-left`}
                style={{ borderLeftWidth: '3px' }}>
                <span className="text-center text-white/50 text-xs font-semibold">{getStatNum(entry, 'rank')}</span>
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={entry.team.logos?.[0]?.href} alt="" className="w-5 h-5 object-contain shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-white font-medium text-sm truncate group-hover:text-amber-300 transition-colors">{entry.team.shortDisplayName}</span>
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
              </button>
            );
          })}

          {/* Legend */}
          <div className="px-4 py-3 border-t border-white/10 bg-white/3 flex flex-wrap gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> Champions League</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> Europa League</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sky-300" /> Conference League</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Rebaixamento</span>
            <span className="ml-auto text-white/30">Clique em um time para ver detalhes</span>
          </div>
        </div>
      )}

      {!loading && !error && entries.length === 0 && <EmptyState message="Classificação não disponível para esta liga." />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM DETAIL VIEW — Season matches + CSV exports
// ═══════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

function TeamDetailView({ team, league, onBack, onSelectPlayer }: {
  team: SelectedTeamInfo; league: LeagueInfo; onBack: () => void; onSelectPlayer: (p: any) => void;
}) {
  const [scheduleEvents, setScheduleEvents] = useState<any[]>([]);
  const [teamMeta, setTeamMeta]             = useState<any>(null);
  const [roster, setRoster]                 = useState<any[]>([]);
  const [rosterLoading, setRosterLoading]   = useState(true);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [loadingCard, setLoadingCard]       = useState<string | null>(null);
  const [toast, setToast]                   = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const summaryCache = useRef<Map<string, any>>(new Map());

  // Fetch schedule + roster on mount
  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const r = await fetch(`${ESPN_API}/${league.slug}/teams/${team.id}/schedule`);
        if (!r.ok) throw new Error();
        const d = await r.json();
        setScheduleEvents(d?.events ?? []);
        setTeamMeta(d?.team ?? null);
      } catch { setError('Não foi possível carregar o calendário do time.'); }
      finally { setLoading(false); }
    })();
    // Fetch roster + photos
    (async () => {
      setRosterLoading(true);
      try {
        const r = await fetch(`${ESPN_API}/${league.slug}/teams/${team.id}/roster`);
        if (!r.ok) throw new Error();
        const d = await r.json();
        const athletes = d?.athletes ?? [];
        // Fetch player photos from API-Football
        const photos = await fetchPlayerPhotos(team.displayName, league.slug);
        // Merge photos into roster by matching names
        for (const a of athletes) {
          const names = [
            normalizeName(a.displayName || ''),
            normalizeName(a.fullName || ''),
            normalizeName(a.shortName || ''),
            normalizeName((a.lastName || '') + ' ' + (a.firstName || '')),
            normalizeName(a.lastName || ''),
          ].filter(Boolean);
          for (const n of names) {
            if (photos.has(n)) { a._photo = photos.get(n); break; }
          }
          // Also try partial match on last name
          if (!a._photo && a.lastName) {
            const ln = normalizeName(a.lastName);
            for (const [key, url] of photos) {
              if (key.includes(ln) || ln.includes(key.split(' ').pop() || '')) {
                a._photo = url; break;
              }
            }
          }
        }
        setRoster(athletes);
      } catch { /* roster optional */ }
      finally { setRosterLoading(false); }
    })();
  }, [team.id, team.displayName, league.slug]);

  // Parse completed matches from schedule
  const completedMatches = useMemo(() => {
    return scheduleEvents
      .filter((ev: any) => {
        const comp = ev.competitions?.[0];
        return comp?.status?.type?.completed === true;
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [scheduleEvents]);

  // Parse a match from schedule into a row object
  const parseMatch = useCallback((ev: any) => {
    const comp = ev.competitions?.[0];
    if (!comp) return null;
    const ourComp  = comp.competitors?.find((c: any) => c.id === team.id || c.team?.id === team.id);
    const oppComp  = comp.competitors?.find((c: any) => c.id !== team.id && c.team?.id !== team.id);
    if (!ourComp || !oppComp) return null;

    const venueType = ourComp.homeAway === 'home' ? 'Home' : 'Away';
    const goalsScored   = parseFloat(ourComp.score?.displayValue ?? ourComp.score?.value ?? '0');
    const goalsConceded = parseFloat(oppComp.score?.displayValue ?? oppComp.score?.value ?? '0');
    const result = ourComp.winner ? 'W' : (oppComp.winner ? 'L' : 'D');

    return {
      eventId: ev.id,
      date: ev.date,
      dateFormatted: new Date(ev.date).toLocaleDateString('pt-BR'),
      dateISO: new Date(ev.date).toISOString().slice(0, 10),
      opponent: oppComp.team?.displayName ?? oppComp.team?.shortDisplayName ?? '?',
      opponentShort: oppComp.team?.shortDisplayName ?? oppComp.team?.abbreviation ?? '?',
      opponentLogo: oppComp.team?.logos?.[0]?.href ?? '',
      opponentRecord: oppComp.record?.[0]?.displayValue ?? '',
      venueType,
      goalsScored,
      goalsConceded,
      goalDifference: goalsScored - goalsConceded,
      result,
      points: result === 'W' ? 3 : result === 'D' ? 1 : 0,
      venue: comp.venue?.fullName ?? '',
      completed: comp.status?.type?.completed ?? false,
    };
  }, [team.id]);

  const parsedMatches = useMemo(() => {
    return completedMatches.map(parseMatch).filter(Boolean);
  }, [completedMatches, parseMatch]);

  // ─── Batch-fetch match summaries ──────────────────────────────────────
  const fetchSummaries = useCallback(async () => {
    const eventIds = completedMatches.map((ev: any) => ev.id as string);
    const uncached = eventIds.filter(id => !summaryCache.current.has(id));
    if (uncached.length === 0) return;

    const BATCH = 5;
    for (let i = 0; i < uncached.length; i += BATCH) {
      const batch = uncached.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(id => fetch(`${ESPN_API}/${league.slug}/summary?event=${id}`).then(r => r.ok ? r.json() : null))
      );
      results.forEach((res, j) => {
        if (res.status === 'fulfilled' && res.value) {
          summaryCache.current.set(batch[j], res.value);
        }
      });
    }
  }, [completedMatches, league.slug]);

  // Helper: get stat from a summary for our team
  const getTeamStatFromSummary = useCallback((eventId: string, statName: string): string => {
    const s = summaryCache.current.get(eventId);
    if (!s?.boxscore?.teams) return '';
    const ourTeamData = s.boxscore.teams.find((t: any) => t.team?.id === team.id);
    if (!ourTeamData?.statistics) return '';
    return ourTeamData.statistics.find((st: any) => st.name === statName)?.displayValue ?? '';
  }, [team.id]);

  // ─── CSV data builders ────────────────────────────────────────────────
  const buildMomentumData = useCallback(() => {
    let cumPoints = 0;
    const rows = parsedMatches.map((m: any, i: number) => {
      cumPoints += m.points;
      const start = Math.max(0, i - 4);
      const lastFive = parsedMatches.slice(start, i + 1).map((x: any) => x.result).join('');
      return {
        date: m.dateISO, opponent: m.opponent, venue_type: m.venueType, result: m.result,
        goals_scored: m.goalsScored, goals_conceded: m.goalsConceded, goal_difference: m.goalDifference,
        cumulative_points: cumPoints, form_last_5: lastFive,
      };
    });
    const filename = `${team.shortDisplayName.replace(/\s/g, '_')}_team_momentum.csv`;
    return { rows, filename };
  }, [parsedMatches, team.shortDisplayName]);

  const buildHomeAwayData = useCallback(async () => {
    await fetchSummaries();
    const rows = parsedMatches.map((m: any) => ({
      date: m.dateISO, opponent: m.opponent, venue_type: m.venueType, result: m.result,
      goals_scored: m.goalsScored, goals_conceded: m.goalsConceded,
      possession_pct: getTeamStatFromSummary(m.eventId, 'possessionPct'),
      total_shots: getTeamStatFromSummary(m.eventId, 'totalShots'),
      shots_on_target: getTeamStatFromSummary(m.eventId, 'shotsOnTarget'),
      opponent_record: m.opponentRecord, venue: m.venue,
    }));
    const filename = `${team.shortDisplayName.replace(/\s/g, '_')}_home_vs_away.csv`;
    return { rows, filename };
  }, [parsedMatches, fetchSummaries, getTeamStatFromSummary, team.shortDisplayName]);

  const buildEfficiencyData = useCallback(async () => {
    await fetchSummaries();
    const rows = parsedMatches.map((m: any) => {
      const shots = parseFloat(getTeamStatFromSummary(m.eventId, 'totalShots')) || 0;
      const onTarget = parseFloat(getTeamStatFromSummary(m.eventId, 'shotsOnTarget')) || 0;
      const corners = parseFloat(getTeamStatFromSummary(m.eventId, 'wonCorners')) || 0;
      const accPasses = parseFloat(getTeamStatFromSummary(m.eventId, 'accuratePasses')) || 0;
      const totalPasses = parseFloat(getTeamStatFromSummary(m.eventId, 'totalPasses')) || 0;
      return {
        date: m.dateISO, opponent: m.opponent, venue_type: m.venueType,
        total_shots: shots, shots_on_target: onTarget, goals: m.goalsScored,
        shot_conversion_rate: shots > 0 ? +(m.goalsScored / shots * 100).toFixed(1) : 0,
        on_target_pct: shots > 0 ? +(onTarget / shots * 100).toFixed(1) : 0,
        corners, possession_pct: getTeamStatFromSummary(m.eventId, 'possessionPct'),
        accurate_passes: accPasses, total_passes: totalPasses,
        pass_completion_pct: totalPasses > 0 ? +(accPasses / totalPasses * 100).toFixed(1) : 0,
        fouls_committed: getTeamStatFromSummary(m.eventId, 'foulsCommitted'),
      };
    });
    const filename = `${team.shortDisplayName.replace(/\s/g, '_')}_efficiency_metrics.csv`;
    return { rows, filename };
  }, [parsedMatches, fetchSummaries, getTeamStatFromSummary, team.shortDisplayName]);

  const buildSeasonStatsData = useCallback(async () => {
    await fetchSummaries();
    let totalGoalsScored = 0, totalGoalsConceded = 0, cleanSheets = 0;
    let homeW = 0, homeD = 0, homeL = 0, awayW = 0, awayD = 0, awayL = 0;
    let homeGoals = 0, awayGoals = 0;
    let totalShots = 0, totalShotsOT = 0, totalPoss = 0, totalYellow = 0, totalRed = 0, totalCorners = 0, totalFouls = 0;
    let statsCount = 0;
    for (const m of parsedMatches) {
      totalGoalsScored   += (m as any).goalsScored;
      totalGoalsConceded += (m as any).goalsConceded;
      if ((m as any).goalsConceded === 0) cleanSheets++;
      if ((m as any).venueType === 'Home') {
        if ((m as any).result === 'W') homeW++; else if ((m as any).result === 'D') homeD++; else homeL++;
        homeGoals += (m as any).goalsScored;
      } else {
        if ((m as any).result === 'W') awayW++; else if ((m as any).result === 'D') awayD++; else awayL++;
        awayGoals += (m as any).goalsScored;
      }
      const shots = parseFloat(getTeamStatFromSummary((m as any).eventId, 'totalShots'));
      if (!isNaN(shots)) {
        statsCount++;
        totalShots   += shots;
        totalShotsOT += parseFloat(getTeamStatFromSummary((m as any).eventId, 'shotsOnTarget')) || 0;
        totalPoss    += parseFloat(getTeamStatFromSummary((m as any).eventId, 'possessionPct')) || 0;
        totalYellow  += parseFloat(getTeamStatFromSummary((m as any).eventId, 'yellowCards')) || 0;
        totalRed     += parseFloat(getTeamStatFromSummary((m as any).eventId, 'redCards')) || 0;
        totalCorners += parseFloat(getTeamStatFromSummary((m as any).eventId, 'wonCorners')) || 0;
        totalFouls   += parseFloat(getTeamStatFromSummary((m as any).eventId, 'foulsCommitted')) || 0;
      }
    }
    const n = parsedMatches.length;
    const wins = homeW + awayW, draws_ = homeD + awayD, losses = homeL + awayL;
    const rows = [{
      team: team.displayName, league: league.name, season: teamMeta?.seasonSummary ?? '',
      matches_played: n, wins, draws: draws_, losses,
      goals_scored: totalGoalsScored, goals_conceded: totalGoalsConceded,
      goal_difference: totalGoalsScored - totalGoalsConceded, points: wins * 3 + draws_,
      clean_sheets: cleanSheets,
      avg_goals_per_game: n > 0 ? +(totalGoalsScored / n).toFixed(2) : 0,
      avg_goals_conceded_per_game: n > 0 ? +(totalGoalsConceded / n).toFixed(2) : 0,
      avg_possession_pct: statsCount > 0 ? +(totalPoss / statsCount).toFixed(1) : 0,
      avg_shots_per_game: statsCount > 0 ? +(totalShots / statsCount).toFixed(1) : 0,
      avg_shots_on_target_per_game: statsCount > 0 ? +(totalShotsOT / statsCount).toFixed(1) : 0,
      total_yellow_cards: totalYellow, total_red_cards: totalRed,
      total_corners: totalCorners, total_fouls: totalFouls,
      home_wins: homeW, home_draws: homeD, home_losses: homeL,
      away_wins: awayW, away_draws: awayD, away_losses: awayL,
      home_goals_scored: homeGoals, away_goals_scored: awayGoals,
    }];
    const filename = `${team.shortDisplayName.replace(/\s/g, '_')}_season_stats.csv`;
    return { rows, filename };
  }, [parsedMatches, fetchSummaries, getTeamStatFromSummary, team, league.name, teamMeta]);

  // ─── Build all players CSV ────────────────────────────────────────────
  const buildAllPlayersData = useCallback(() => {
    const rows = roster.map((p: any) => {
      const getStat = (cat: string, name: string) => {
        const cats = p.statistics?.splits?.categories || [];
        const c = cats.find((x: any) => x.name === cat);
        return c?.stats?.find((s: any) => s.name === name)?.displayValue ?? '';
      };
      return {
        name: p.displayName, jersey: p.jersey ?? '', position: p.position?.displayName ?? '',
        age: p.age ?? '', date_of_birth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : '',
        nationality: p.citizenship ?? '', height: p.displayHeight ?? '', weight: p.displayWeight ?? '',
        appearances: getStat('general', 'appearances'), sub_ins: getStat('general', 'subIns'),
        goals: getStat('offensive', 'totalGoals'), assists: getStat('offensive', 'goalAssists'),
        total_shots: getStat('offensive', 'shotsOnTarget'), shots_on_target: getStat('offensive', 'shotsOnTarget'),
        offsides: getStat('offensive', 'offsides'),
        fouls_committed: getStat('general', 'foulsCommitted'), fouls_suffered: getStat('general', 'foulsSuffered'),
        yellow_cards: getStat('general', 'yellowCards'), red_cards: getStat('general', 'redCards'),
        own_goals: getStat('general', 'ownGoals'),
        status: p.status?.name ?? '',
        injury: p.injuries?.[0]?.type?.description ?? '',
      };
    });
    const filename = `${team.shortDisplayName.replace(/\s/g, '_')}_all_players.csv`;
    return { rows, filename };
  }, [roster, team.shortDisplayName]);

  // ─── Action handlers (download or IPFS) ──────────────────────────────
  const handleAction = useCallback(async (
    cardKey: string,
    buildData: () => { rows: Record<string, string | number>[]; filename: string } | Promise<{ rows: Record<string, string | number>[]; filename: string }>,
    mode: 'download' | 'ipfs'
  ) => {
    setLoadingCard(cardKey + '_' + mode);
    try {
      const { rows, filename } = await buildData();
      if (mode === 'download') {
        downloadCsv(rows, filename);
      } else {
        await uploadCsvToIpfs(rows, filename);
        setToast({ type: 'success', message: `"${filename}" enviado ao IPFS!` });
        setTimeout(() => setToast(null), 3500);
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Erro ao processar.' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setLoadingCard(null);
    }
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="explore-fade-up space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
          <div className={`pointer-events-auto flex items-center gap-2.5 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border animate-[exploreFadeUp_.35s_ease-out] ${
            toast.type === 'success'
              ? 'bg-amber-500/20 border-amber-500/35'
              : 'bg-red-500/20 border-red-500/35'
          }`}>
            <div className={`p-1.5 rounded-full ${toast.type === 'success' ? 'bg-amber-500/40' : 'bg-red-500/40'}`}>
              {toast.type === 'success'
                ? <Check className="w-5 h-5 text-amber-300" />
                : <AlertTriangle className="w-5 h-5 text-red-300" />}
            </div>
            <span className={`text-sm font-semibold drop-shadow-lg whitespace-nowrap ${toast.type === 'success' ? 'text-amber-200' : 'text-red-200'}`}>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />Voltar à classificação
      </button>

      {/* Team header */}
      <div className="backdrop-blur-xl bg-black/40 rounded-2xl p-6 shadow-2xl border border-white/10">
        <div className="flex items-start gap-5">
          {team.logo
            ? <img src={team.logo} alt="" className="w-20 h-20 object-contain shrink-0 drop-shadow-2xl" />
            : <div className="w-20 h-20 rounded-xl bg-white/8 flex items-center justify-center"><Shield className="w-10 h-10 text-white/30" /></div>}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white mb-1">{team.displayName}</h2>
            <div className="flex flex-wrap gap-3 text-sm text-white/60">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />{league.name}
              </span>
              {teamMeta?.standingSummary && (
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />{teamMeta.standingSummary}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <StatPill label="Pos" value={`${team.rank}°`} />
              <StatPill label="Pts" value={team.points} accent />
              <StatPill label="J" value={team.gamesPlayed} />
              <StatPill label="V" value={team.wins} color="text-green-400" />
              <StatPill label="E" value={team.draws} />
              <StatPill label="D" value={team.losses} color="text-red-400" />
              <StatPill label="GP" value={team.goalsFor} />
              <StatPill label="GC" value={team.goalsAgainst} />
            </div>
          </div>
        </div>
      </div>

      {/* CSV Export Cards */}
      <div>
        <SectionTitle icon={Download} title="Exportar Dados para Análise" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <CsvExportCard
            icon={TrendingUp}
            cardKey="momentum"
            title="Team Momentum"
            description="Resultados cronológicos, gols, pontos acumulados e sequência de forma (últimos 5)"
            onDownload={() => handleAction('momentum', buildMomentumData, 'download')}
            onIpfs={() => handleAction('momentum', buildMomentumData, 'ipfs')}
            loadingCard={loadingCard}
          />
          <CsvExportCard
            icon={MapPin}
            cardKey="homeaway"
            title="Home vs Away"
            description="Performance casa/fora com posse de bola, chutes e força do adversário"
            onDownload={() => handleAction('homeaway', buildHomeAwayData, 'download')}
            onIpfs={() => handleAction('homeaway', buildHomeAwayData, 'ipfs')}
            loadingCard={loadingCard}
          />
          <CsvExportCard
            icon={Target}
            cardKey="efficiency"
            title="Efficiency Metrics"
            description="Chutes, gols, escanteios, taxa de conversão e precisão de passes por partida"
            onDownload={() => handleAction('efficiency', buildEfficiencyData, 'download')}
            onIpfs={() => handleAction('efficiency', buildEfficiencyData, 'ipfs')}
            loadingCard={loadingCard}
          />
          <CsvExportCard
            icon={BarChart3}
            cardKey="season"
            title="Season Statistics"
            description="Dados agregados da temporada: clean sheets, médias, cartões, splits casa/fora"
            onDownload={() => handleAction('season', buildSeasonStatsData, 'download')}
            onIpfs={() => handleAction('season', buildSeasonStatsData, 'ipfs')}
            loadingCard={loadingCard}
          />
        </div>
      </div>

      {/* Season match history */}
      <div>
        <SectionTitle icon={Calendar} title={`Partidas da Temporada (${parsedMatches.length})`} />
        {loading && <SkeletonRows count={8} h="h-14" />}
        {error && <ErrorCard message={error} />}
        {!loading && !error && parsedMatches.length === 0 && <EmptyState message="Nenhuma partida encontrada para este time." />}
        {!loading && parsedMatches.length > 0 && (
          <div className="mt-4 backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            {/* Table header */}
            <div className="grid grid-cols-[90px_50px_1fr_70px_50px_120px] gap-2 px-4 py-2.5 text-xs font-semibold text-white/50 border-b border-white/10 bg-white/5">
              <span>Data</span>
              <span className="text-center">Local</span>
              <span>Adversário</span>
              <span className="text-center">Placar</span>
              <span className="text-center">Res.</span>
              <span>Estádio</span>
            </div>
            {parsedMatches.map((m: any, i: number) => (
              <div key={m.eventId}
                className={`grid grid-cols-[90px_50px_1fr_70px_50px_120px] gap-2 px-4 py-3 text-sm items-center ${
                  i !== parsedMatches.length - 1 ? 'border-b border-white/5' : ''
                } hover:bg-white/5 transition-colors`}>
                <span className="text-white/60 text-xs">{m.dateFormatted}</span>
                <span className="text-center">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    m.venueType === 'Home' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {m.venueType === 'Home' ? 'C' : 'F'}
                  </span>
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  {m.opponentLogo && <img src={m.opponentLogo} alt="" className="w-5 h-5 object-contain shrink-0" />}
                  <span className="text-white/80 truncate">{m.opponentShort}</span>
                </div>
                <span className="text-center text-white font-semibold text-xs">
                  {m.goalsScored} – {m.goalsConceded}
                </span>
                <span className="text-center">
                  <span className={`inline-block w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center ${
                    m.result === 'W' ? 'bg-green-500 text-white' : m.result === 'L' ? 'bg-red-500 text-white' : 'bg-white/20 text-white/70'
                  }`}>{m.result}</span>
                </span>
                <span className="text-white/40 text-xs truncate">{m.venue}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Players Roster */}
      <div>
        <SectionTitle icon={Users} title={`Elenco (${roster.length})`} />
        {rosterLoading && <SkeletonRows count={6} h="h-24" />}
        {!rosterLoading && roster.length === 0 && <EmptyState message="Elenco não disponível." />}
        {!rosterLoading && roster.length > 0 && (
          <>
            {/* Export all players */}
            <div className="mt-3 mb-4 flex flex-wrap gap-2">
              <button onClick={() => handleAction('players', buildAllPlayersData, 'download')} disabled={!!loadingCard}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                {loadingCard === 'players_download' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Exportar todos os jogadores (CSV)
              </button>
              <button onClick={() => handleAction('players', buildAllPlayersData, 'ipfs')} disabled={!!loadingCard}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 hover:bg-white/14 text-white/80 hover:text-white text-xs font-semibold transition-all duration-300 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed">
                {loadingCard === 'players_ipfs' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Enviar ao IPFS
              </button>
            </div>

            {/* Group by position */}
            {['Goalkeeper', 'Defender', 'Midfielder', 'Forward'].map(pos => {
              const players = roster.filter((p: any) => p.position?.displayName === pos || p.position?.name === pos);
              if (players.length === 0) return null;
              const posLabel = pos === 'Goalkeeper' ? 'Goleiros' : pos === 'Defender' ? 'Defensores' : pos === 'Midfielder' ? 'Meio-campistas' : 'Atacantes';
              return (
                <div key={pos} className="mb-5">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">{posLabel}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {players.map((p: any) => {
                      const getS = (cat: string, n: string) => p.statistics?.splits?.categories?.find((c: any) => c.name === cat)?.stats?.find((s: any) => s.name === n)?.displayValue ?? '—';
                      const initials = (p.firstName?.[0] || '') + (p.lastName?.[0] || '');
                      const posColors: Record<string, string> = { Goalkeeper: 'from-yellow-600 to-amber-700', Defender: 'from-blue-600 to-indigo-700', Midfielder: 'from-emerald-600 to-teal-700', Forward: 'from-red-500 to-rose-600' };
                      const avatarGrad = posColors[pos] || 'from-zinc-600 to-zinc-700';
                      const photo = p._photo as string | undefined;
                      return (
                        <button key={p.id} onClick={() => onSelectPlayer(p)}
                          className="group relative bg-black/40 rounded-2xl border border-white/10 hover:border-amber-500/30 p-4 text-center transition-colors duration-200 explore-card overflow-hidden">
                          <div className="relative w-14 h-14 mx-auto mb-2">
                            {photo ? (
                              <img src={photo} alt="" className="w-14 h-14 rounded-full object-cover shadow-lg"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                            ) : null}
                            <div className={`${photo ? 'hidden' : ''} w-14 h-14 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center shadow-lg`}>
                              <span className="text-white font-bold text-sm tracking-wide">{initials || '?'}</span>
                            </div>
                            {p.jersey != null && (
                              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow">{p.jersey}</span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-white truncate">{p.shortName || p.displayName}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">{p.position?.abbreviation}</p>
                          <div className="flex justify-center gap-2 mt-1.5 text-[10px] text-white/50">
                            <span>{getS('offensive', 'totalGoals')} gols</span>
                            <span>{getS('general', 'appearances')} jogos</span>
                          </div>
                          {p.flag && <img src={p.flag.href} alt={p.flag.alt} className="absolute top-2 right-2 w-4 h-3 object-cover rounded-sm opacity-60" />}
                          {p.injuries?.length > 0 && (
                            <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Lesionado" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER DETAIL VIEW
// ═══════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

function PlayerDetailView({ player, team, league, onBack }: {
  player: any; team: SelectedTeamInfo; league: LeagueInfo; onBack: () => void;
}) {
  const [teamHistory, setTeamHistory] = useState<any[]>([]);
  const [loadingBio, setLoadingBio]   = useState(false);
  const [loadingCard, setLoadingCard] = useState<string | null>(null);
  const [toast, setToast]             = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const initials = (player.firstName?.[0] || '') + (player.lastName?.[0] || '');
  const posColors: Record<string, string> = { Goalkeeper: 'from-yellow-600 to-amber-700', Defender: 'from-blue-600 to-indigo-700', Midfielder: 'from-emerald-600 to-teal-700', Forward: 'from-red-500 to-rose-600' };
  const avatarGrad = posColors[player.position?.displayName] || 'from-zinc-600 to-zinc-700';

  // Fetch bio (team history) on mount
  useEffect(() => {
    (async () => {
      setLoadingBio(true);
      try {
        const r = await fetch(`https://site.api.espn.com/apis/common/v3/sports/soccer/${league.slug}/athletes/${player.id}/bio`);
        if (r.ok) {
          const d = await r.json();
          setTeamHistory(d?.teamHistory ?? []);
        }
      } catch { /* optional */ }
      finally { setLoadingBio(false); }
    })();
  }, [player.id, league.slug]);

  // Stat helper
  const getStat = (cat: string, name: string) => {
    const cats = player.statistics?.splits?.categories || [];
    const c = cats.find((x: any) => x.name === cat);
    return c?.stats?.find((s: any) => s.name === name)?.displayValue ?? '—';
  };
  const getStatNum = (cat: string, name: string) => parseFloat(getStat(cat, name)) || 0;

  // Build player CSV
  const buildPlayerData = useCallback(() => {
    const rows = [{
      name: player.displayName, jersey: player.jersey ?? '', position: player.position?.displayName ?? '',
      age: player.age ?? '', date_of_birth: player.dateOfBirth ? new Date(player.dateOfBirth).toISOString().slice(0, 10) : '',
      nationality: player.citizenship ?? '', height: player.displayHeight ?? '', weight: player.displayWeight ?? '',
      appearances: getStat('general', 'appearances'), sub_ins: getStat('general', 'subIns'),
      goals: getStat('offensive', 'totalGoals'), assists: getStat('offensive', 'goalAssists'),
      total_shots: getStat('offensive', 'totalShots'), shots_on_target: getStat('offensive', 'shotsOnTarget'),
      offsides: getStat('offensive', 'offsides'),
      fouls_committed: getStat('general', 'foulsCommitted'), fouls_suffered: getStat('general', 'foulsSuffered'),
      yellow_cards: getStat('general', 'yellowCards'), red_cards: getStat('general', 'redCards'),
      own_goals: getStat('general', 'ownGoals'),
      status: player.status?.name ?? '', injury: player.injuries?.[0]?.type?.description ?? '',
      team_history: teamHistory.filter((t: any) => !t.displayName?.includes('U21') && !t.displayName?.includes('U18')).map((t: any) => `${t.displayName} (${t.seasons})`).join('; '),
    }];
    const filename = `${player.displayName.replace(/\s/g, '_')}_stats.csv`;
    return { rows, filename };
  }, [player, teamHistory]);

  const handleAction = useCallback(async (mode: 'download' | 'ipfs') => {
    setLoadingCard(mode);
    try {
      const { rows, filename } = buildPlayerData();
      if (mode === 'download') { downloadCsv(rows, filename); }
      else {
        await uploadCsvToIpfs(rows, filename);
        setToast({ type: 'success', message: `"${filename}" enviado ao IPFS!` });
        setTimeout(() => setToast(null), 3500);
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Erro ao processar.' });
      setTimeout(() => setToast(null), 4000);
    } finally { setLoadingCard(null); }
  }, [buildPlayerData]);

  const appearances = getStatNum('general', 'appearances');
  const subIns = getStatNum('general', 'subIns');
  const starts = appearances - subIns;

  return (
    <div className="explore-fade-up space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
          <div className={`pointer-events-auto flex items-center gap-2.5 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border animate-[exploreFadeUp_.35s_ease-out] ${
            toast.type === 'success' ? 'bg-amber-500/20 border-amber-500/35' : 'bg-red-500/20 border-red-500/35'
          }`}>
            <div className={`p-1.5 rounded-full ${toast.type === 'success' ? 'bg-amber-500/40' : 'bg-red-500/40'}`}>
              {toast.type === 'success' ? <Check className="w-5 h-5 text-amber-300" /> : <AlertTriangle className="w-5 h-5 text-red-300" />}
            </div>
            <span className={`text-sm font-semibold drop-shadow-lg ${toast.type === 'success' ? 'text-amber-200' : 'text-red-200'}`}>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />Voltar ao elenco
      </button>

      {/* Player Header */}
      <div className="backdrop-blur-xl bg-black/40 rounded-2xl p-6 shadow-2xl border border-white/10">
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            {player._photo ? (
              <img src={player._photo} alt="" className="w-24 h-24 rounded-2xl object-cover shadow-xl"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
            ) : null}
            <div className={`${player._photo ? 'hidden' : ''} w-24 h-24 rounded-2xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center shadow-xl`}>
              <span className="text-white font-bold text-2xl tracking-wide">{initials || '?'}</span>
            </div>
            {player.jersey != null && (
              <span className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center shadow-lg border-2 border-zinc-900">{player.jersey}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white mb-1">{player.displayName}</h2>
            <div className="flex flex-wrap gap-3 text-sm text-white/60">
              <span className="flex items-center gap-1.5">{player.position?.displayName}</span>
              {player.flag && <span className="flex items-center gap-1.5"><img src={player.flag.href} alt="" className="w-4 h-3 rounded-sm" />{player.citizenship}</span>}
              <span className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-amber-400" />{team.displayName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => handleAction('download')} disabled={!!loadingCard}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold transition-all duration-300 shadow-md disabled:opacity-50">
          {loadingCard === 'download' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Download
        </button>
        <button onClick={() => handleAction('ipfs')} disabled={!!loadingCard}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 hover:bg-white/14 text-white/80 text-xs font-semibold transition-all duration-300 border border-white/10 disabled:opacity-50">
          {loadingCard === 'ipfs' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Enviar ao IPFS
        </button>
      </div>

      {/* Bio */}
      <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-5 shadow-xl">
        <SectionTitle icon={User} title="Perfil Biográfico" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
          <BioItem label="Idade" value={player.age != null ? `${player.age} anos` : '—'} />
          <BioItem label="Data de Nascimento" value={player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString('pt-BR') : '—'} />
          <BioItem label="Nacionalidade" value={player.citizenship ?? '—'} flag={player.flag?.href} />
          <BioItem label="Altura" value={player.displayHeight ?? '—'} />
          <BioItem label="Peso" value={player.displayWeight ?? '—'} />
          <BioItem label="Posição" value={player.position?.displayName ?? '—'} />
          <BioItem label="Camisa" value={player.jersey != null ? `#${player.jersey}` : '—'} />
          <BioItem label="Status" value={player.status?.name ?? '—'} color={player.status?.type === 'active' ? 'text-green-400' : 'text-red-400'} />
        </div>
      </div>

      {/* Season Stats */}
      <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-5 shadow-xl">
        <SectionTitle icon={BarChart3} title="Estatísticas da Temporada" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <StatCard label="Jogos" value={`${appearances}`} sub={`${starts} titular · ${subIns} reserva`} />
          <StatCard label="Gols" value={getStat('offensive', 'totalGoals')} accent />
          <StatCard label="Assistências" value={getStat('offensive', 'goalAssists')} accent />
          <StatCard label="Gols Contra" value={getStat('general', 'ownGoals')} />
        </div>
      </div>

      {/* Offensive & Defensive */}
      <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-5 shadow-xl">
        <SectionTitle icon={Target} title="Métricas Ofensivas e Defensivas" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          <StatCard label="Chutes Totais" value={getStat('offensive', 'totalShots')} />
          <StatCard label="Chutes no Gol" value={getStat('offensive', 'shotsOnTarget')} />
          <StatCard label="Impedimentos" value={getStat('offensive', 'offsides')} />
          {player.position?.displayName === 'Goalkeeper' && (
            <>
              <StatCard label="Defesas" value={getStat('goalKeeping', 'saves')} accent />
              <StatCard label="Chutes Enfrentados" value={getStat('goalKeeping', 'shotsFaced')} />
              <StatCard label="Gols Sofridos" value={getStat('goalKeeping', 'goalsConceded')} />
            </>
          )}
        </div>
      </div>

      {/* Disciplinary */}
      <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-5 shadow-xl">
        <SectionTitle icon={Flag} title="Registro Disciplinar" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <StatCard label="Faltas Cometidas" value={getStat('general', 'foulsCommitted')} />
          <StatCard label="Faltas Sofridas" value={getStat('general', 'foulsSuffered')} />
          <StatCard label="Cartões Amarelos" value={getStat('general', 'yellowCards')} color="text-yellow-400" />
          <StatCard label="Cartões Vermelhos" value={getStat('general', 'redCards')} color="text-red-400" />
        </div>
      </div>

      {/* Injuries */}
      {player.injuries && player.injuries.length > 0 && (
        <div className="backdrop-blur-xl bg-red-500/10 rounded-2xl border border-red-500/25 p-5 shadow-xl">
          <SectionTitle icon={AlertTriangle} title="Lesão / Suspensão" />
          <div className="mt-3 space-y-2">
            {player.injuries.map((inj: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-300">{inj.type?.description || inj.status || 'Indisponível'}</p>
                  {inj.details?.returnDate && <p className="text-xs text-red-400/70 mt-0.5">Retorno previsto: {new Date(inj.details.returnDate).toLocaleDateString('pt-BR')}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team History (Transfer History) */}
      <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-5 shadow-xl">
        <SectionTitle icon={Globe} title="Histórico de Clubes" />
        {loadingBio && <SkeletonRows count={3} h="h-12" />}
        {!loadingBio && teamHistory.length === 0 && <p className="text-white/40 text-sm mt-3">Histórico não disponível.</p>}
        {!loadingBio && teamHistory.length > 0 && (
          <div className="mt-4 space-y-2">
            {teamHistory.filter((t: any) => !t.displayName?.includes('U21') && !t.displayName?.includes('U18') && !t.displayName?.includes('U23')).map((t: any, i: number) => {
              const isCurrent = typeof t.seasons === 'string' && t.seasons.includes('CURRENT');
              return (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isCurrent ? 'bg-amber-500/10 border-amber-500/25' : 'bg-white/5 border-white/8'} explore-fade-up`}
                  style={{ animationDelay: `${i * 40}ms` }}>
                  {t.logo && <img src={t.logo} alt="" className="w-7 h-7 object-contain shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isCurrent ? 'text-amber-300' : 'text-white/80'}`}>{t.displayName}</p>
                    <p className="text-xs text-white/40">{t.seasons?.replace('CURRENT', 'Atual')}</p>
                  </div>
                  {isCurrent && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">Atual</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BioItem({ label, value, flag, color }: { label: string; value: string; flag?: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        {flag && <img src={flag} alt="" className="w-4 h-3 rounded-sm" />}
        <p className={`text-sm font-medium ${color ?? 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent, color }: { label: string; value: string; sub?: string; accent?: boolean; color?: string }) {
  return (
    <div className={`px-4 py-3 rounded-xl border ${accent ? 'bg-amber-500/10 border-amber-500/25' : 'bg-white/5 border-white/8'}`}>
      <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`text-xl font-bold ${color ?? (accent ? 'text-amber-400' : 'text-white')}`}>{value}</p>
      {sub && <p className="text-[10px] text-white/40 mt-0.5">{sub}</p>}
    </div>
  );
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ═══════════════════════════════════════════════════════════════════════════════
// MATCHES TAB (preserved)
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

  const exportMatchesCsv = () => {
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
  };

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
// LEAGUE SELECTOR (for MatchesTab)
// ═══════════════════════════════════════════════════════════════════════════════

function LeagueSelector({ selected, onSelect }: { selected: LeagueInfo; onSelect: (l: LeagueInfo) => void }) {
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
// SHARED UI COMPONENTS
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

function CsvExportCard({ icon: Icon, cardKey, title, description, onDownload, onIpfs, loadingCard }: {
  icon: React.ElementType; cardKey: string; title: string; description: string;
  onDownload: () => void; onIpfs: () => void; loadingCard: string | null;
}) {
  const isDownloading = loadingCard === cardKey + '_download';
  const isUploading   = loadingCard === cardKey + '_ipfs';
  const isBusy        = isDownloading || isUploading;

  return (
    <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 p-5 hover:border-amber-500/30 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 shrink-0 group-hover:bg-amber-500/25 transition-colors">
          <Icon className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
          <p className="text-xs text-white/50 leading-relaxed mb-3">{description}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={onDownload} disabled={isBusy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold transition-all duration-300 shadow-md shadow-amber-500/15 hover:shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
              {isDownloading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Download className="w-3.5 h-3.5" />}
              Download
            </button>
            <button onClick={onIpfs} disabled={isBusy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/8 hover:bg-white/14 text-white/80 hover:text-white text-xs font-semibold transition-all duration-300 border border-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
              {isUploading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Upload className="w-3.5 h-3.5" />}
              Enviar ao IPFS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, accent, color }: { label: string; value: string; accent?: boolean; color?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
      accent ? 'bg-amber-500/15 border-amber-500/25 text-amber-400' : 'bg-white/5 border-white/10'
    }`}>
      <span className="text-white/50">{label}</span>
      <span className={color ?? (accent ? 'text-amber-400' : 'text-white')}>{value}</span>
    </span>
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

function ErrorCard({ message }: { message: string }) {
  return <div className="backdrop-blur-xl bg-red-500/15 rounded-2xl p-5 border border-red-500/25 text-red-300 flex items-center gap-3"><span className="text-xl">⚠️</span><span className="text-sm">{message}</span></div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="backdrop-blur-xl bg-black/30 rounded-2xl p-12 text-center border border-white/8"><Trophy className="w-10 h-10 text-white/20 mx-auto mb-3" /><p className="text-white/50 text-sm">{message}</p></div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProtectedExplorePage() {
  return <AuthGuard><ExplorePage /></AuthGuard>;
}
