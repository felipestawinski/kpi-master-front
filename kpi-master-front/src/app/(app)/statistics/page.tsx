'use client';

import { useState } from 'react';
import { Search, TrendingUp, Users, Target, Award } from 'lucide-react';

interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
}

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Player {
  id: number;
  name: string;
  photo: string;
  position: string;
}

interface PlayerStats {
  goals: number;
  assists: number;
  shots: number;
  passesAccuracy: number;
  rating: string;
}

export default function StatisticsPage() {
  const [searchType, setSearchType] = useState<'league' | 'team' | 'player'>('league');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Popular leagues
  const popularLeagues: League[] = [
    { id: 39, name: 'Premier League', country: 'England', logo: '🏴󐁧󐁢󐁥󐁮󐁧󐁿' },
    { id: 140, name: 'La Liga', country: 'Spain', logo: '🇪🇸' },
    { id: 78, name: 'Bundesliga', country: 'Germany', logo: '🇩🇪' },
    { id: 135, name: 'Serie A', country: 'Italy', logo: '🇮🇹' },
    { id: 61, name: 'Ligue 1', country: 'France', logo: '🇫🇷' },
    { id: 71, name: 'Brasileirão', country: 'Brazil', logo: '🇧🇷' },
  ];

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Note: Replace with your actual API calls
      if (searchType === 'team' && selectedLeague) {
        // Mock data - replace with actual API call
        setTeams([
          { id: 1, name: 'Manchester United', logo: '⚽' },
          { id: 2, name: 'Liverpool', logo: '⚽' },
          { id: 3, name: 'Chelsea', logo: '⚽' },
        ]);
      } else if (searchType === 'player' && selectedTeam) {
        // Mock data - replace with actual API call
        setPlayers([
          { id: 1, name: 'Player 1', photo: '👤', position: 'Forward' },
          { id: 2, name: 'Player 2', photo: '👤', position: 'Midfielder' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Soccer Statistics
          </h1>
          <p className="text-gray-600">
            Search for leagues, teams, and player statistics
          </p>
        </div>

        {/* Search Type Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setSearchType('league')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                searchType === 'league'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Award className="inline-block mr-2 h-5 w-5" />
              Leagues
            </button>
            <button
              onClick={() => setSearchType('team')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                searchType === 'team'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={!selectedLeague}
            >
              <Users className="inline-block mr-2 h-5 w-5" />
              Teams
            </button>
            <button
              onClick={() => setSearchType('player')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                searchType === 'player'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={!selectedTeam}
            >
              <Target className="inline-block mr-2 h-5 w-5" />
              Players
            </button>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search for ${searchType}...`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Popular Leagues */}
        {searchType === 'league' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Popular Leagues</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularLeagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => {
                    setSelectedLeague(league);
                    setSearchType('team');
                  }}
                  className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <span className="text-3xl">{league.logo}</span>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{league.name}</h3>
                    <p className="text-sm text-gray-600">{league.country}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected League Info */}
        {selectedLeague && (
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>Selected League:</strong> {selectedLeague.name} ({selectedLeague.country})
            </p>
          </div>
        )}

        {/* Teams List */}
        {searchType === 'team' && teams.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Teams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    setSelectedTeam(team);
                    setSearchType('player');
                  }}
                  className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <span className="text-3xl">{team.logo}</span>
                  <h3 className="font-semibold text-gray-900">{team.name}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Players List */}
        {searchType === 'player' && players.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Players</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-all"
                >
                  <span className="text-4xl">{player.photo}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{player.name}</h3>
                    <p className="text-sm text-gray-600">{player.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player Statistics */}
        {playerStats && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Player Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{playerStats.goals}</div>
                <div className="text-sm text-gray-600 mt-1">Goals</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{playerStats.assists}</div>
                <div className="text-sm text-gray-600 mt-1">Assists</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600">{playerStats.shots}</div>
                <div className="text-sm text-gray-600 mt-1">Shots</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600">{playerStats.rating}</div>
                <div className="text-sm text-gray-600 mt-1">Rating</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading statistics...</p>
          </div>
        )}
      </div>
    </div>
  );
}