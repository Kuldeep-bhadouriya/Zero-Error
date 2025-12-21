'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import RankBadge from './RankBadge';

interface LeaderboardUser {
  _id: string;
  zeTag: string;
  points: number;
  rank: number;
  userRank: string;
  rankIcon: string;
  profilePhoto?: string | null;
}

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [rankFilter, setRankFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/ze-club/leaderboard');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  useEffect(() => {
    let filtered = users;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.zeTag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Rank tier filter
    if (rankFilter !== 'all') {
      filtered = filtered.filter(user => user.userRank === rankFilter);
    }
    
    // Category filter (can be extended)
    if (activeFilter === 'top10') {
      filtered = filtered.slice(0, 10);
    }
    
    setFilteredUsers(filtered);
  }, [searchQuery, activeFilter, rankFilter, users]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-300" />;
      case 3:
        return <Medal className="h-6 w-6 text-orange-600" />;
      default:
        return <Trophy className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/50';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/50';
      default:
        return 'hover:bg-gray-800/30';
    }
  };

  const getRankTierColor = (userRank: string) => {
    const colors = {
      "Errorless Legend": 'bg-yellow-500/10 hover:bg-yellow-500/20 border-l-2 border-yellow-500/50',
      Vanguard: 'bg-red-400/10 hover:bg-red-400/20 border-l-2 border-red-400/50',
      Gladiator: 'bg-red-500/10 hover:bg-red-500/20 border-l-2 border-red-500/50',
      Contender: 'bg-red-600/10 hover:bg-red-600/20 border-l-2 border-red-600/50',
      Rookie: 'bg-red-700/10 hover:bg-red-700/20 border-l-2 border-red-700/50',
    };
    return colors[userRank as keyof typeof colors] || 'hover:bg-gray-800/30';
  };

  const topThree = filteredUsers.slice(0, 3);
  const restUsers = filteredUsers.slice(3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-white"
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
          🏆 Leaderboard
        </h1>
        <p className="text-gray-400 text-sm sm:text-base md:text-lg">See where you stand among the champions</p>
      </div>

      {/* Search and Filters */}
      <GlassCard variant="intense" className="mb-4 sm:mb-6">
        <div className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 bg-black/60 border-white/10 text-white placeholder:text-gray-500 h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('all')}
                className={`h-10 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm touch-manipulation active:scale-95 ${activeFilter === 'all' ? 'bg-red-600 hover:bg-red-700' : 'bg-black/60 border-white/10 hover:bg-black/80 text-white'}`}
              >
                All Players
              </Button>
              <Button
                variant={activeFilter === 'top10' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('top10')}
                className={`h-10 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm touch-manipulation active:scale-95 ${activeFilter === 'top10' ? 'bg-red-600 hover:bg-red-700' : 'bg-black/60 border-white/10 hover:bg-black/80 text-white'}`}
              >
                Top 10
              </Button>
            </div>
          </div>
          
          {/* Rank Filter */}
          <div className="flex items-start sm:items-center gap-2 flex-wrap pt-3 sm:pt-4 border-t border-gray-700/50">
            <span className="text-xs sm:text-sm text-gray-400 w-full sm:w-auto mb-1 sm:mb-0">Filter by rank:</span>
            {['all', 'Errorless Legend', 'Vanguard', 'Gladiator', 'Contender', 'Rookie'].map((rankType) => (
              <Button
                key={rankType}
                variant={rankFilter === rankType ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRankFilter(rankType)}
                className={`h-9 sm:h-8 px-2.5 sm:px-3 text-xs touch-manipulation active:scale-95 ${rankFilter === rankType ? 'bg-red-600 hover:bg-red-700' : 'bg-black/60 border-white/10 hover:bg-black/80 text-white'}`}
              >
                {rankType === 'all' ? 'All Ranks' : rankType}
              </Button>
            ))}
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center h-64"
        >
          <div className="text-xl text-gray-400 flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-red-500 animate-pulse" />
            Loading leaderboard...
          </div>
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <GlassCard variant="intense" gradient="red" className="p-6">
            <p className="text-red-400">Error: {error}</p>
          </GlassCard>
        </motion.div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 sm:mb-8"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* 2nd Place */}
                {topThree[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="md:order-1"
                  >
                    <GlassCard variant="intense" className="text-center p-6 h-full relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-400 to-gray-500 opacity-20 blur-3xl" />
                      <div className="relative z-10">
                        <div className="flex justify-center mb-4">
                          <div className="relative">
                            <Avatar className="h-20 w-20 border-4 border-gray-400 shadow-xl">
                              <AvatarImage src={topThree[1].profilePhoto || undefined} alt={topThree[1].zeTag} />
                              <AvatarFallback className="bg-black/70 text-white text-2xl font-bold">
                                {topThree[1].zeTag.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 bg-black/90 rounded-full px-3 py-1 text-xs font-bold border-2 border-gray-400 text-gray-200">
                              2nd
                            </div>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 drop-shadow-lg">@{topThree[1].zeTag}</h3>
                        <p className="text-2xl font-bold text-gray-200 drop-shadow-md">
                          {topThree[1].points} pts
                        </p>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="md:order-2"
                  >
                    <GlassCard variant="intense" gradient="orange" className="text-center p-6 md:scale-110 h-full relative overflow-hidden border-yellow-500/60 shadow-2xl shadow-yellow-500/20">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 opacity-20 blur-3xl" />
                      <div className="relative z-10">
                        <div className="flex justify-center mb-4">
                          <div className="relative">
                            <Avatar className="h-24 w-24 border-4 border-yellow-400 shadow-2xl shadow-yellow-500/50">
                              <AvatarImage src={topThree[0].profilePhoto || undefined} alt={topThree[0].zeTag} />
                              <AvatarFallback className="bg-yellow-600 text-white text-3xl font-bold">
                                {topThree[0].zeTag.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 bg-black/90 rounded-full px-3 py-1 text-sm font-bold border-2 border-yellow-400 text-yellow-300">
                              1st
                            </div>
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">@{topThree[0].zeTag}</h3>
                        <p className="text-3xl font-bold text-yellow-400 drop-shadow-md">
                          {topThree[0].points} pts
                        </p>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="md:order-3"
                  >
                    <GlassCard variant="intense" className="text-center p-6 h-full relative overflow-hidden border-orange-600/50">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500 to-orange-600 opacity-20 blur-3xl" />
                      <div className="relative z-10">
                        <div className="flex justify-center mb-4">
                          <div className="relative">
                            <Avatar className="h-20 w-20 border-4 border-orange-600 shadow-xl shadow-orange-500/30">
                              <AvatarImage src={topThree[2].profilePhoto || undefined} alt={topThree[2].zeTag} />
                              <AvatarFallback className="bg-orange-700 text-white text-2xl font-bold">
                                {topThree[2].zeTag.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 bg-black/90 rounded-full px-3 py-1 text-xs font-bold border-2 border-orange-600 text-orange-300">
                              3rd
                            </div>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 drop-shadow-lg">@{topThree[2].zeTag}</h3>
                        <p className="text-2xl font-bold text-orange-400 drop-shadow-md">
                          {topThree[2].points} pts
                        </p>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Rest of Leaderboard */}
          <GlassCard variant="intense" className="overflow-hidden">
            <div className="px-3 sm:px-6 pt-4 sm:pt-6">
              <h3 className="text-lg sm:text-xl md:text-2xl text-white font-bold">All Rankings</h3>
            </div>
            <div className="overflow-x-auto p-0 sm:p-6 -mx-3 sm:mx-0">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No players found.</p>
              ) : (
                <div className="min-w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700/50 hover:bg-transparent">
                        <TableHead className="w-[100px] text-gray-400">Rank</TableHead>
                        <TableHead className="text-gray-400">Player</TableHead>
                        <TableHead className="text-gray-400">Tier</TableHead>
                        <TableHead className="text-right text-gray-400">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(topThree.length > 0 ? restUsers : filteredUsers).map((user, index) => (
                        <motion.tr
                          key={user._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: (index + 3) * 0.05 }}
                          className={`border-gray-700/50 transition-all ${getRankColor(user.rank)} ${getRankTierColor(user.userRank)}`}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getRankIcon(user.rank)}
                              <span className="text-white font-bold">#{user.rank}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-white/20">
                                <AvatarImage src={user.profilePhoto || undefined} alt={user.zeTag} />
                                <AvatarFallback className="bg-black/70 text-white font-bold">
                                  {user.zeTag.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-white font-medium">@{user.zeTag}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <RankBadge
                              rank={user.userRank}
                              rankIcon={user.rankIcon}
                              size="sm"
                              showLabel={false}
                              animated={false}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-red-400 font-bold text-lg">
                              {user.points}
                            </span>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </GlassCard>
        </>
      )}
    </motion.div>
  );
}
