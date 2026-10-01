import React, { useState, useRef, useEffect } from "react";
import {
  Shield,
  Wallet,
  Gamepad2,
  Flame,
  Menu,
  ChevronDown,
  Globe,
  Check,
  Swords,
  Trophy,
  Crown,
  Smartphone,
} from "lucide-react";
import { UserWallet } from "../types";
import { formatCurrency, CURRENCIES, getStoredCurrencyCode } from "../utils/currency";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  user: UserWallet;
  activeTab: "game" | "p2p" | "leaderboard";
  setActiveTab: (tab: "game" | "p2p" | "leaderboard") => void;
  selectedTable: "express" | "classic" | "vip";
  onSelectTable: (table: "express" | "classic" | "vip") => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  onOpenWallet: () => void;
  onOpenMenu: () => void;
  onOpenInstallApp?: () => void;
  isStandalone?: boolean;
  isInstalled?: boolean;
  onOpenOnlineUsers: () => void;
  onOpenQuickDeposit?: () => void;
  onOpenProfile?: () => void;
  onOpenProvablyFair?: () => void;
  onOpenRoadmap?: () => void;
  onOpenAdmin?: () => void;
  onOpenMerchant?: () => void;
  onOpenSiteLiquidity?: () => void;
  onOpenBetHistory?: () => void;
  onOpenRules?: () => void;
  onOpenTransparency?: () => void;
  onOpenPublicUsers?: () => void;
  onOpenReferral?: () => void;
  onOpenCurrencySelector?: () => void;
  selectedCurrency?: string;
  onLogout: () => void;
  onToggleBalanceType: () => void;
  lang?: "bn" | "en";
  onToggleLang?: () => void;
  telemetryPlayerCount?: number;
  tablePlayerCounts?: {
    express: number;
    classic: number;
    vip: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  selectedTable,
  onSelectTable,
  onOpenWallet,
  onOpenMenu,
  onOpenInstallApp,
  isStandalone = false,
  isInstalled = false,
  selectedCurrency,
  lang = "bn",
  telemetryPlayerCount = 1,
  tablePlayerCounts,
}) => {
  const [tableDropdownOpen, setTableDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCurrencyCode = selectedCurrency || getStoredCurrencyCode();
  const activeCurrencyConfig = CURRENCIES[activeCurrencyCode] || CURRENCIES.INR;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTableDropdownOpen(false);
      }
    };
    if (tableDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [tableDropdownOpen]);

  // Real active counts calculation per table
  const realTableCounts = {
    express: tablePlayerCounts?.express ?? (selectedTable === "express" ? Math.max(1, telemetryPlayerCount) : 0),
    classic: tablePlayerCounts?.classic ?? (selectedTable === "classic" ? Math.max(1, telemetryPlayerCount) : 0),
    vip: tablePlayerCounts?.vip ?? (selectedTable === "vip" ? Math.max(1, telemetryPlayerCount) : 0),
  };

  const tableOptions: Array<{
    id: "express" | "classic" | "vip";
    name: string;
    icon: string;
    speed: string;
    minBet: number;
    maxBet: number;
    minBetFormatted: string;
    maxBetFormatted: string;
    realActiveCount: number;
  }> = [
    {
      id: "express",
      name: "Express",
      icon: "⚡",
      speed: "10s",
      minBet: 1 / activeCurrencyConfig.rateFromBase,
      maxBet: 1000,
      minBetFormatted: formatCurrency(1 / activeCurrencyConfig.rateFromBase, { currencyCode: activeCurrencyCode, convertFromBase: true }),
      maxBetFormatted: formatCurrency(1000, { currencyCode: activeCurrencyCode, convertFromBase: true }),
      realActiveCount: realTableCounts.express,
    },
    {
      id: "classic",
      name: "Classic",
      icon: "🎯",
      speed: "15s",
      minBet: 1 / activeCurrencyConfig.rateFromBase,
      maxBet: 10000,
      minBetFormatted: formatCurrency(1 / activeCurrencyConfig.rateFromBase, { currencyCode: activeCurrencyCode, convertFromBase: true }),
      maxBetFormatted: formatCurrency(10000, { currencyCode: activeCurrencyCode, convertFromBase: true }),
      realActiveCount: realTableCounts.classic,
    },
    {
      id: "vip",
      name: "VIP",
      icon: "👑",
      speed: "20s",
      minBet: 1 / activeCurrencyConfig.rateFromBase,
      maxBet: 100000,
      minBetFormatted: formatCurrency(1 / activeCurrencyConfig.rateFromBase, { currencyCode: activeCurrencyCode, convertFromBase: true }),
      maxBetFormatted: formatCurrency(100000, { currencyCode: activeCurrencyCode, convertFromBase: true }),
      realActiveCount: realTableCounts.vip,
    },
  ];

  const currentTable = tableOptions.find((t) => t.id === selectedTable) || tableOptions[0];
  const currentBalance = user.balanceType === "real" ? user.balance : user.demoBalance;

  return (
    <header className="bg-neutral-950/80 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50 px-2.5 sm:px-6 py-2 sm:py-3 shadow-2xl w-full select-none">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Zone 1: Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 group cursor-pointer">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-transform group-hover:scale-110">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xs sm:text-sm font-black tracking-[0.2em] text-white">SANCTUM</span>
            <span className="text-[7px] sm:text-[8px] font-bold text-neutral-600 uppercase tracking-widest mt-0.5 sm:mt-1">Prime v5.0</span>
          </div>
        </div>

        {/* Zone 2: Navigation (Desktop) */}
        <nav className="hidden lg:flex items-center gap-2">
          {['game', 'p2p', 'leaderboard'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? "bg-white text-black shadow-xl" 
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
              }`}
            >
              {tab === 'game' ? 'Arena' : tab === 'p2p' ? '1v1 Dual' : 'Elite'}
            </button>
          ))}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3">
          {/* Table Selector */}
          <div ref={dropdownRef} className="relative hidden sm:block">
            <button
              onClick={() => setTableDropdownOpen(!tableDropdownOpen)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-neutral-400 hover:text-white hover:border-white/10 transition-all cursor-pointer"
            >
              <span>{currentTable.icon}</span>
              <span className="uppercase tracking-widest">{currentTable.name}</span>
              <ChevronDown className={`w-3 h-3 text-neutral-600 transition-transform ${tableDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {tableDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-3 w-64 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
                >
                  {tableOptions.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectTable(t.id);
                        setTableDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-between ${
                        selectedTable === t.id ? "bg-violet-500/10 text-violet-400" : "text-neutral-500 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{t.icon}</span>
                        <span>{t.name}</span>
                      </div>
                      <span className="text-[9px] font-mono opacity-40">{t.realActiveCount}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Install / Open App Button (Hidden completely inside standalone PWA app) */}
          {onOpenInstallApp && !isStandalone && (
            <button
              onClick={onOpenInstallApp}
              className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 sm:px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 text-[10px] sm:text-xs font-bold cursor-pointer"
              title={
                isInstalled
                  ? (lang === "bn" ? "অ্যাপ খুলুন" : "Open App")
                  : (lang === "bn" ? "অ্যাপ ইনস্টল করুন" : "Install App / Add to Home Screen")
              }
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
              <span className="hidden sm:inline">
                {isInstalled
                  ? (lang === "bn" ? "অ্যাপ খুলুন" : "Open App")
                  : (lang === "bn" ? "ইনস্টল অ্যাপ" : "Install App")}
              </span>
            </button>
          )}

          {/* Balance & Wallet */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 sm:gap-3 bg-neutral-950 border border-white/5 hover:border-violet-500/30 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all shadow-inner active:scale-95 group"
          >
            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <Wallet className="w-3 h-3" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-white font-mono tracking-tight">
              {formatCurrency(currentBalance, {
                currencyCode: activeCurrencyCode,
                convertFromBase: true,
              })}
            </span>
          </button>

          {/* Menu */}
          <button
            onClick={onOpenMenu}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white transition-all active:scale-90"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
