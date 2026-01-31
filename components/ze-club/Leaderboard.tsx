'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Search, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface LeaderboardUser {
  _id: string;
  zeTag: string;
  points: number;
  rank: number;
  userRank: string;
  rankIcon: string;
  profilePhoto?: string | null;
}

const RANKS = ['all', 'Errorless Legend', 'Vanguard', 'Gladiator', 'Contender', 'Rookie'];

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rankFilter, setRankFilter] = useState<string>('all');
  const [viewState, setViewState] = useState<'all' | 'top10'>('all');

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
    
    // View state filter (Top 10 vs All)
    if (viewState === 'top10') {
      filtered = filtered.slice(0, 10);
    }
    
    setFilteredUsers(filtered);
  }, [searchQuery, rankFilter, viewState, users]);

  const topThree = filteredUsers.slice(0, 3);
  const restUsers = filteredUsers.slice(3);

  return (
    <div className="text-white min-h-screen pb-24 w-full max-w-7xl mx-auto px-4 sm:px-6">
      <HeaderSection />

      {/* Controls Section */}
      <div className="z-20 relative bg-transparent py-6 mb-12 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center w-full">
            <div className="relative w-full md:w-96 group flex-shrink-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                <Input
                    placeholder="Search by ZeTag..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-transparent border-white/20 text-white placeholder:text-gray-500 h-11 focus:ring-1 focus:ring-red-500/50 transition-all rounded-xl hover:border-white/30"
                />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 backdrop-blur-sm flex-shrink-0">
                    <button
                        onClick={() => setViewState('all')}
                        className={cn(
                            "px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                            viewState === 'all' ? "bg-red-600 text-white shadow-lg shadow-red-900/20" : "text-gray-400 hover:text-white"
                        )}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setViewState('top10')}
                        className={cn(
                            "px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                            viewState === 'top10' ? "bg-red-600 text-white shadow-lg shadow-red-900/20" : "text-gray-400 hover:text-white"
                        )}
                    >
                        Top 10
                    </button>
                </div>
                
                <div className="h-8 w-[1px] bg-white/10 mx-2 hidden md:block flex-shrink-0" />

                <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 backdrop-blur-sm flex-shrink-0">
                   {/* Mobile Dropdown for Ranks could go here, but for now horizontal scroll works well */}
                    <div className="flex gap-1">
                        {['all', 'Errorless Legend', 'Vanguard', 'Gladiator'].map((r) => (
                             <button
                                key={r}
                                onClick={() => setRankFilter(r)}
                                className={cn(
                                    "px-2 md:px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                                    rankFilter === r ? "bg-white/10 text-white border border-white/10" : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {r === 'all' ? 'All Ranks' : r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {loading ? (
        <LeaderboardSkeleton />
      ) : error ? (
        <div className="text-center py-20 text-red-400 bg-red-900/10 rounded-2xl border border-red-500/20">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">Unable to load rankings</h3>
            <p className="opacity-70">{error}</p>
        </div>
      ) : (
        <div className="space-y-10">
          <AnimatePresence mode="wait">
            {filteredUsers.length === 0 ? (
                <EmptyState />
            ) : (
                <>
                {/* Podium Section - Only show if current page includes top ranks */}
                {!searchQuery && viewState === 'all' && rankFilter === 'all' && (
                    <Podium topThree={topThree} />
                )}

                {/* List Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-12">
                            <span className="w-8 text-center">#</span>
                            <span>Player</span>
                        </div>
                        <div className="flex items-center gap-8 md:gap-16">
                            <span className="hidden md:block">Rank Tier</span>
                            <span className="w-20 text-right">Points</span>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        {(searchQuery || rankFilter !== 'all' ? filteredUsers : restUsers).map((user) => (
                            <LeaderboardRow 
                                key={user._id} 
                                user={user} 
                            />
                        ))}
                    </div>
                </div>
                </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function HeaderSection() {
    return (
        <div className="pt-0 pb-8 text-center space-y-4 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-red-600/20 blur-[100px] pointer-events-none" />
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold tracking-wider uppercase mb-4">
                    <Trophy className="h-3 w-3" />
                    Season 1 Rankings
                </div>
                <h1 className="text-4xl md:text-6xl font-black italic tracking-tigh text-white uppercase">
                    Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Champions</span>
                </h1>
                <p className="text-gray-400 max-w-lg mx-auto text-sm md:text-base mt-4 font-medium leading-relaxed">
                    Compete, climb the ranks, and earn your place among the Zero Error elite.
                </p>
            </motion.div>
        </div>
    )
}

function Podium({ topThree }: { topThree: LeaderboardUser[] }) {
    if (topThree.length === 0) return null;

    const [first, second, third] = [topThree[0], topThree[1], topThree[2]];

    return (
        <div className="relative py-8 mb-4 md:mb-12 mt-4 md:mt-8">
            <div className="flex flex-row items-end justify-center gap-2 md:gap-8 max-w-4xl mx-auto px-2 md:px-4">
                {/* 2nd Place */}
                {second && (
                     <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="order-1 w-1/3 md:flex-1 relative z-10"
                    >
                         <PodiumCard user={second} rank={2} color="slate" />
                    </motion.div>
                )}

                {/* 1st Place */}
                {first && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="order-2 w-1/3 md:w-1/3 z-20 pb-6 md:pb-0 md:-mt-16 relative"
                    >
                        <PodiumCard user={first} rank={1} color="yellow" isFirst />
                    </motion.div>
                )}

                {/* 3rd Place */}
                {third && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="order-3 w-1/3 md:flex-1 relative z-10"
                    >
                        <PodiumCard user={third} rank={3} color="orange" />
                    </motion.div>
                )}
            </div>
            
            {/* Ambient Base Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-t from-red-600/10 to-transparent blur-3xl pointer-events-none" />
        </div>
    )
}

function PodiumCard({ user, rank, color, isFirst = false }: { user: LeaderboardUser, rank: number, color: 'yellow' | 'slate' | 'orange', isFirst?: boolean }) {
    const borderColor = {
        yellow: 'border-yellow-500/50',
        slate: 'border-slate-400/30',
        orange: 'border-orange-700/50'
    }[color];

    const shadowColor = {
        yellow: 'shadow-yellow-500/20',
        slate: 'shadow-slate-500/10',
        orange: 'shadow-orange-500/10'
    }[color];

    const iconColor = {
        yellow: 'text-yellow-400',
        slate: 'text-slate-300',
        orange: 'text-orange-400'
    }[color];

    const bgGradient = {
        yellow: 'from-yellow-500/10 to-yellow-900/10',
        slate: 'from-slate-500/10 to-slate-900/10',
        orange: 'from-orange-500/10 to-orange-900/10'
    }[color];

    return (
        <div className={cn(
            "relative flex flex-col items-center p-3 md:p-6 rounded-2xl bg-transparent backdrop-blur-sm border",
            borderColor,
           "shadow-2xl", shadowColor,
            isFirst ? "py-6 md:py-10" : "py-4 md:py-6"
        )}>
             {/* Crown/Rank Indicator */}
             <div className="absolute -top-3 md:-top-5">
                {rank === 1 ? (
                     <div className="bg-yellow-500 text-black p-2 md:p-3 rounded-full shadow-lg shadow-yellow-500/50">
                        <Crown className="w-4 h-4 md:w-6 md:h-6 fill-current" />
                     </div>
                ) : (
                    <div className={cn("px-2 py-0.5 md:px-4 md:py-1 rounded-full text-xs md:text-sm font-bold border bg-[#09090b]", borderColor, iconColor)}>
                        #{rank}
                    </div>
                )}
             </div>

             {/* Background Effects */}
             <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-b opacity-50 pointer-events-none", bgGradient)} />

             <Avatar className={cn(
                 "border-2 md:border-4 mb-2 md:mb-4", 
                 isFirst ? "w-16 h-16 sm:w-32 sm:h-32" : "w-10 h-10 sm:w-20 sm:h-20",
                 borderColor
            )}>
                <AvatarImage src={user.profilePhoto || undefined} alt={user.zeTag} className="object-cover" />
                <AvatarFallback className="bg-neutral-900 text-white font-bold text-sm md:text-xl">{user.zeTag[0].toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="text-center relative z-10 space-y-0.5 md:space-y-1 w-full">
                <h3 className={cn("font-bold text-white tracking-tight truncate w-full px-1 text-center", isFirst ? "text-sm sm:text-2xl" : "text-xs md:text-lg")}>
                    {user.zeTag}
                </h3>
                <div className="flex items-center justify-center gap-1.5 opacity-80 scale-75 md:scale-100">
                     <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider border-white/10 bg-white/5", iconColor)}>
                        {user.userRank}
                     </Badge>
                </div>
                <div className={cn("font-mono font-bold mt-1 md:mt-2", isFirst ? "text-lg sm:text-3xl text-yellow-500" : "text-sm md:text-xl text-white/90")}>
                    {user.points.toLocaleString()} <span className="hidden md:inline text-xs sm:text-sm font-sans font-medium opacity-50">XP</span>
                </div>
            </div>
        </div>
    )
}

function LeaderboardRow({ user }: { user: LeaderboardUser }) {
    const rank = user.rank;
    
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="group relative flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all duration-300"
        >
            <div className="flex items-center gap-3 md:gap-12">
                <div className="w-8 flex justify-center">
                    <span className={cn(
                        "font-mono font-bold text-lg",
                        rank <= 3 ? "text-yellow-500" : "text-gray-500"
                    )}>
                        #{rank}
                    </span>
                </div>
                
                <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12 border border-white/10 group-hover:border-red-500/50 transition-colors">
                        <AvatarImage src={user.profilePhoto || undefined} />
                        <AvatarFallback className="bg-neutral-800 text-xs">{user.zeTag.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                        <div className="font-bold text-white text-sm md:text-base group-hover:text-red-400 transition-colors">
                            {user.zeTag}
                        </div>
                        <div className="text-xs text-gray-500 md:hidden">
                            {user.userRank}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-8 md:gap-16 text-right">
                <div className="hidden md:block text-sm text-gray-400 font-medium">
                    {user.userRank}
                </div>
                
                <div className="w-20">
                    <span className="font-mono font-bold text-white group-hover:text-yellow-400 transition-colors">
                        {user.points.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-600 block leading-none mt-1">XP</span>
                </div>
            </div>
        </motion.div>
    )
}

function LeaderboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Podium Skeleton */}
            <div className="flex justify-center items-end gap-4 h-64 mb-12">
                <Skeleton className="w-1/3 h-48 rounded-t-2xl opacity-50" />
                <Skeleton className="w-1/3 h-64 rounded-t-2xl opacity-75" />
                <Skeleton className="w-1/3 h-40 rounded-t-2xl opacity-50" />
            </div>
            
            {/* List Skeleton */}
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                ))}
            </div>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Search className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No players found</h3>
            <p className="text-gray-500 max-w-sm">
                We couldn't find any players matching your current filters. Try adjusting your search criteria.
            </p>
        </div>
    )
}
