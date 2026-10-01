import React from "react";
import { Swords, Trophy, Wallet, Gamepad2, Smartphone } from "lucide-react";
import { UserWallet } from "../types";
import { sound } from "../utils/audio";
import { formatCurrency, getStoredCurrencyCode } from "../utils/currency";

interface MobileBottomNavProps {
  activeTab: "game" | "p2p" | "leaderboard";
  setActiveTab: (tab: "game" | "p2p" | "leaderboard") => void;
  onOpenWallet: () => void;
  onOpenInstallApp?: () => void;
  isStandalone?: boolean;
  isInstalled?: boolean;
  user: UserWallet;
  openRoomsCount?: number;
  selectedCurrency?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenWallet,
  onOpenInstallApp,
  isStandalone = false,
  isInstalled = false,
  user,
  openRoomsCount = 0,
  selectedCurrency,
}) => {
  const activeCurrencyCode = selectedCurrency || getStoredCurrencyCode();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/80 backdrop-blur-2xl border-t border-white/5 px-2 py-3 flex items-center justify-around safe-area-pb shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
      {/* 1. Game Table */}
      <button
        type="button"
        onClick={() => {
          sound.playButtonClick();
          setActiveTab("game");
        }}
        className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
          activeTab === "game"
            ? "text-white"
            : "text-neutral-600 hover:text-neutral-400"
        }`}
      >
        <Gamepad2 className={`w-5 h-5 ${activeTab === "game" ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
        <span className="text-[9px] font-bold uppercase tracking-widest">Arena</span>
      </button>

      {/* 2. P2P Lobby */}
      <button
        type="button"
        onClick={() => {
          sound.playButtonClick();
          setActiveTab("p2p");
        }}
        className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
          activeTab === "p2p"
            ? "text-white"
            : "text-neutral-600 hover:text-neutral-400"
        }`}
      >
        <div className="relative">
          <Swords className={`w-5 h-5 ${activeTab === "p2p" ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          {openRoomsCount > 0 && (
            <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-violet-500 text-white rounded-full text-[8px] flex items-center justify-center font-bold animate-pulse">
              {openRoomsCount}
            </span>
          )}
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest">Dual</span>
      </button>

      {/* 3. Leaderboard */}
      <button
        type="button"
        onClick={() => {
          sound.playButtonClick();
          setActiveTab("leaderboard");
        }}
        className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
          activeTab === "leaderboard"
            ? "text-white"
            : "text-neutral-600 hover:text-neutral-400"
        }`}
      >
        <Trophy className={`w-5 h-5 ${activeTab === "leaderboard" ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
        <span className="text-[9px] font-bold uppercase tracking-widest">Elite</span>
      </button>

      {/* 4. Install / Open App (Hidden completely inside standalone PWA app) */}
      {onOpenInstallApp && !isStandalone && (
        <button
          type="button"
          onClick={() => {
            sound.playButtonClick();
            onOpenInstallApp();
          }}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 text-amber-400 hover:text-amber-300 transition-all cursor-pointer active:scale-95"
        >
          <Smartphone className="w-5 h-5 animate-pulse stroke-[2.2]" />
          <span className="text-[9px] font-black uppercase tracking-widest">
            {isInstalled ? "Open" : "Install"}
          </span>
        </button>
      )}

      {/* 5. Wallet */}
      <button
        type="button"
        onClick={() => {
          sound.playButtonClick();
          onOpenWallet();
        }}
        className="flex-1 flex flex-col items-center justify-center gap-1.5 text-neutral-600 hover:text-white transition-all cursor-pointer active:scale-95"
      >
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <Wallet className="w-4 h-4" />
        </div>
        <span className="text-[9px] font-bold tabular-nums">
          {formatCurrency(user.balance, {
            currencyCode: activeCurrencyCode,
            convertFromBase: true,
            compact: true
          })}
        </span>
      </button>
    </nav>
  );
};
