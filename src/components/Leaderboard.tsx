import React, { useState, useEffect } from 'react';
import { Trophy, Sparkles, TrendingUp, Coins, Flame, Zap, Crown, Award, ChevronRight } from 'lucide-react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  onOpenLiquidity?: () => void;
  currentUser?: {
    userId: string;
    username: string;
    stats?: {
      currentStreak?: number;
      bestStreak?: number;
    };
  } | null;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onOpenLiquidity, currentUser }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'profit' | 'streak'>('profit');

  const fallbackLeaderboard: LeaderboardEntry[] = [
    { userId: 'usr_101', username: 'DragonKing', balance: 85400, profit: 45000, winRate: 72, gamesPlayed: 142, vipTier: 'Master VIP', currentStreak: 12, bestStreak: 15, streakTier: 'godlike' },
    { userId: 'usr_102', username: 'TigerMaster', balance: 62100, profit: 32000, winRate: 68, gamesPlayed: 110, vipTier: 'Diamond VIP', currentStreak: 8, bestStreak: 10, streakTier: 'unstoppable' },
    { userId: 'usr_103', username: 'ApexPredator', balance: 41000, profit: 21500, winRate: 64, gamesPlayed: 95, vipTier: 'Platinum VIP', currentStreak: 5, bestStreak: 8, streakTier: 'fire' },
    { userId: 'usr_104', username: 'Velociraptor', balance: 38200, profit: 18400, winRate: 61, gamesPlayed: 88, vipTier: 'Gold VIP', currentStreak: 4, bestStreak: 6, streakTier: 'hot' },
    { userId: 'usr_105', username: 'KolkataKnight', balance: 29500, profit: 12100, winRate: 58, gamesPlayed: 74, vipTier: 'Silver VIP', currentStreak: 3, bestStreak: 5, streakTier: 'hot' },
  ];

  const fetchLeaderboard = async (sortMode = sortBy) => {
    try {
      const res = await fetch(`/api/leaderboard?sortBy=${sortMode}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setLeaderboard(data);
      } else {
        setLeaderboard((prev) => (prev.length > 0 ? prev : fallbackLeaderboard));
      }
    } catch {
      setLeaderboard((prev) => (prev.length > 0 ? prev : fallbackLeaderboard));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(sortBy);
    const interval = setInterval(() => fetchLeaderboard(sortBy), 5000);
    return () => clearInterval(interval);
  }, [sortBy]);

  const handleSortChange = (newSort: 'profit' | 'streak') => {
    setSortBy(newSort);
    setLoading(true);
    fetchLeaderboard(newSort);
  };

  // Helper for streak badge styling & flame tier
  const renderStreakBadge = (currentStreak = 0, bestStreak = 0) => {
    if (currentStreak >= 10) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 via-rose-500/25 to-purple-500/20 border border-amber-400/60 shadow-lg shadow-amber-500/20 animate-pulse">
          <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span className="text-xs font-black text-amber-200 tracking-wide">
            🔥 {currentStreak} <span className="text-[10px] uppercase font-bold text-amber-300/90">Godlike</span>
          </span>
          {bestStreak > currentStreak && (
            <span className="text-[9px] text-amber-300/70 border-l border-amber-400/40 pl-1.5 ml-0.5">
              Best: {bestStreak}
            </span>
          )}
        </div>
      );
    }
    if (currentStreak >= 7) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-500/25 to-amber-500/20 border border-rose-500/50 shadow-md shadow-rose-950/40">
          <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-bounce" />
          <span className="text-xs font-black text-rose-200 tracking-wide">
            🔥 {currentStreak} <span className="text-[10px] uppercase font-bold text-rose-300">Unstoppable</span>
          </span>
          {bestStreak > currentStreak && (
            <span className="text-[9px] text-neutral-400 border-l border-rose-500/30 pl-1.5 ml-0.5">
              Best: {bestStreak}
            </span>
          )}
        </div>
      );
    }
    if (currentStreak >= 5) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40">
          <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
          <span className="text-xs font-black text-orange-300">
            🔥 {currentStreak} <span className="text-[10px] uppercase font-bold text-orange-400">On Fire</span>
          </span>
          {bestStreak > currentStreak && (
            <span className="text-[9px] text-neutral-400 border-l border-neutral-700 pl-1.5 ml-0.5">
              Best: {bestStreak}
            </span>
          )}
        </div>
      );
    }
    if (currentStreak >= 3) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30">
          <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-xs font-bold text-amber-300">
            🔥 {currentStreak} <span className="text-[9px] text-amber-400">Hot Streak</span>
          </span>
        </div>
      );
    }
    if (currentStreak >= 1) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px] font-semibold">
          <Flame className="w-3 h-3 text-neutral-400" />
          <span>{currentStreak} {currentStreak === 1 ? 'Win' : 'Wins'}</span>
          {bestStreak > currentStreak && (
            <span className="text-[9px] text-neutral-500 ml-1">
              (Best {bestStreak})
            </span>
          )}
        </div>
      );
    }
    return (
      <div className="text-[11px] text-neutral-500 font-mono">
        Best: {bestStreak || 0}
      </div>
    );
  };

  const userStreak = currentUser?.stats?.currentStreak || 0;
  const userBestStreak = currentUser?.stats?.bestStreak || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-900 border border-amber-500/30 rounded-3xl p-6 lg:p-8 shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4 relative z-10 shadow-lg">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl lg:text-3xl font-black text-white relative z-10">Real-Time VIP Leaderboard & Win Streaks</h2>
        <p className="text-sm text-neutral-400 mt-1 max-w-lg mx-auto relative z-10">
          টপ প্লেয়ারদের রিয়েল-টাইম নেট লাভ ও টানা জয়ের ধারা (Win Streak)। লাইভ সিঙ্ক প্রতি ৫ সেকেন্ড পর পর।
        </p>

        {/* Win Streak Retention Incentives Bar */}
        <div className="mt-5 p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-left max-w-2xl mx-auto relative z-10">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-300 mb-2">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>টানা জয়ের রিওয়ার্ড লেভেল (Win Streak Tiers):</span>
            </span>
            <span className="text-[10px] text-neutral-400">খেলোয়াড়দের আকর্ষণ ও দীর্ঘ স্থায়িত্ব</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-neutral-900/90 border border-amber-500/30">
              <span className="text-[10px] text-amber-400 font-bold block">🔥 ৩ জয়</span>
              <span className="text-xs font-black text-white">Hot Streak</span>
            </div>
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/40">
              <span className="text-[10px] text-orange-400 font-bold block">🔥🔥 ৫ জয়</span>
              <span className="text-xs font-black text-orange-200">On Fire</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/40">
              <span className="text-[10px] text-rose-400 font-bold block">⚡ ৭ জয়</span>
              <span className="text-xs font-black text-rose-200">Unstoppable</span>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/40">
              <span className="text-[10px] text-purple-400 font-bold block">👑 ১০+ জয়</span>
              <span className="text-xs font-black text-purple-200">Godlike Legend</span>
            </div>
          </div>
        </div>

        {/* Current User Active Streak Callout */}
        {currentUser && (
          <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/40 text-left relative z-10 shadow-lg">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Flame className="w-5 h-5 fill-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>আপনার বর্তমান ধারা:</span>
                <span className="text-amber-300 font-black">🔥 {userStreak} Round Streak</span>
                <span className="text-[11px] text-neutral-400">(সর্বোচ্চ: {userBestStreak})</span>
              </div>
              <p className="text-[10px] text-neutral-400">
                {userStreak >= 5
                  ? 'অবিশ্বাস্য! আপনি অন ফায়ার! লিডারবোর্ডের শীর্ষে উঠতে ধারা বজায় রাখুন!'
                  : userStreak >= 3
                  ? 'দারুণ খেলছেন! আর ২টি জয় পেলেই "On Fire" স্ট্যাটাস অর্জন করবেন!'
                  : 'টানা জয়ী হয়ে ফ্লেম ব্যাজ ও লিডারবোর্ডের স্পেশাল টায়ার আনলক করুন!'}
              </p>
            </div>
          </div>
        )}

        {onOpenLiquidity && (
          <div className="mt-4 relative z-10">
            <button
              onClick={onOpenLiquidity}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all active:scale-95 shadow-lg shadow-emerald-950/40"
            >
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>সাইটের মোট লিকুইডিটি ও সকল ইউজারের ব্যালেন্স লেজার দেখুন</span>
            </button>
          </div>
        )}
      </div>

      {/* Leaderboard Table Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-3 sm:p-5 bg-neutral-950 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 h-4" /> Global Rankings
            </div>
            {/* Sorting Switch Buttons */}
            <div className="flex items-center bg-neutral-900 p-0.5 rounded-xl border border-neutral-800">
              <button
                onClick={() => handleSortChange('profit')}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
                  sortBy === 'profit'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>Profit</span>
              </button>
              <button
                onClick={() => handleSortChange('streak')}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
                  sortBy === 'streak'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-900/40'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Flame className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
                <span>Streak 🔥</span>
              </button>
            </div>
          </div>

          <div className="text-[10px] text-neutral-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Sync</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral-500 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading live rankings & win streaks...</span>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = currentUser?.userId === entry.userId;
              return (
                <div
                  key={entry.userId}
                  className={`p-4 lg:p-5 flex items-center justify-between transition-colors hover:bg-neutral-800/40 ${
                    isCurrentUser ? 'bg-amber-500/15 border-l-4 border-amber-400 shadow-inner' :
                    rank === 1 ? 'bg-amber-500/10 border-l-4 border-amber-500' :
                    rank === 2 ? 'bg-neutral-800/20 border-l-4 border-neutral-400' :
                    rank === 3 ? 'bg-amber-700/10 border-l-4 border-amber-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-8 text-center font-black text-lg shrink-0">
                      {rank === 1 ? (
                        <span className="text-amber-400">🥇</span>
                      ) : rank === 2 ? (
                        <span className="text-neutral-300">🥈</span>
                      ) : rank === 3 ? (
                        <span className="text-amber-600">🥉</span>
                      ) : (
                        <span className="text-neutral-500 text-sm">#{rank}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                        <span>{entry.username}</span>
                        {entry.equippedTitle && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold">
                            🏷️ {entry.equippedTitle}
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                            YOU
                          </span>
                        )}
                        <span className="text-[10px] bg-neutral-800 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> {entry.vipTier}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-amber-400">
                          🏆 ELO {entry.eloRating || 1000} ({entry.eloTier || 'Bronze'})
                        </span>
                        <span>•</span>
                        <span>{entry.gamesPlayed} Rounds Played</span>
                        <span>•</span>
                        <span className="text-neutral-300 font-semibold">{entry.winRate}% Win Rate</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    {/* Visual Win Streak Indicator */}
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-semibold text-neutral-400 mb-0.5">
                        Win Streak
                      </div>
                      {renderStreakBadge(entry.currentStreak, entry.bestStreak)}
                    </div>

                    {/* Net Profit */}
                    <div className="text-right min-w-[90px] sm:min-w-[110px]">
                      <div className="text-[10px] uppercase font-semibold text-neutral-400">Net Profit</div>
                      <div className={`text-sm lg:text-base font-black ${entry.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {entry.profit >= 0 ? '+' : ''}{entry.profit.toLocaleString()} <span className="text-xs font-normal text-neutral-400">CHIPS</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
