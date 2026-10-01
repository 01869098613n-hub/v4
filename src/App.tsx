import React, { useState, useEffect } from "react";
import { UserWallet, TableRound, RoadmapItem, HighLoadTelemetry } from "./types";
import { LoginScreen } from "./components/LoginScreen";
import { Navbar } from "./components/Navbar";
import { GameTable } from "./components/GameTable";
import { P2PLobby } from "./components/P2PLobby";
import { Leaderboard } from "./components/Leaderboard";
import { WalletModal } from "./components/WalletModal";
import { ProvablyFairModal } from "./components/ProvablyFairModal";
import { RoadmapModal } from "./components/RoadmapModal";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminLogin } from "./components/AdminLogin";
import { AdminModal } from "./components/AdminModal"; // Kept if needed elsewhere, but plan to remove usage
import { UserProfileModal } from "./components/UserProfileModal";
import { SiteLiquidityModal } from "./components/SiteLiquidityModal";
import { RegulatoryFooter } from "./components/RegulatoryFooter";
import { UserBetHistoryModal } from "./components/UserBetHistoryModal";
import { GameRulesModal } from "./components/GameRulesModal";
import { TransparencyCharterModal } from "./components/TransparencyCharterModal";
import { SideNavDrawer } from "./components/SideNavDrawer";
import { ActiveOnlineUsersModal } from "./components/ActiveOnlineUsersModal";
import { AutoLogoutTimer } from "./components/AutoLogoutTimer";
import { GlobalShortcuts } from "./components/GlobalShortcuts";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { CurrencySelectorModal } from "./components/CurrencySelectorModal";
import { usePWAInstall } from "./utils/usePWAInstall";
import { useDrag } from "@use-gesture/react";
import { motion, AnimatePresence } from "framer-motion";
import { sound } from "./utils/audio";
import { getStoredCurrencyCode, setStoredCurrencyCode } from "./utils/currency";

export default function App() {
  const [user, setUser] = useState<UserWallet | null>(null);
  const [activeTab, setActiveTab] = useState<"game" | "p2p" | "leaderboard">("game");
  const [tabDirection, setTabDirection] = useState<number>(1);
  const [selectedTable, setSelectedTable] = useState<"express" | "classic" | "vip">("classic");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [lang, setLang] = useState<"bn" | "en">("bn");
  const [telemetry, setTelemetry] = useState<HighLoadTelemetry | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(getStoredCurrencyCode());
  const [isCurrencySelectorOpen, setIsCurrencySelectorOpen] = useState<boolean>(false);

  // Modals & Overlays state
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isOnlineUsersOpen, setIsOnlineUsersOpen] = useState<boolean>(false);
  const [showRegulatoryFooter, setShowRegulatoryFooter] = useState<boolean>(true);
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isProvablyFairOpen, setIsProvablyFairOpen] = useState<boolean>(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState<boolean>(false);
  const [isMerchantOpen, setIsMerchantOpen] = useState<boolean>(false);
  const [isLiquidityOpen, setIsLiquidityOpen] = useState<boolean>(false);
  const [isBetHistoryOpen, setIsBetHistoryOpen] = useState<boolean>(false);
  const [isGameRulesOpen, setIsGameRulesOpen] = useState<boolean>(false);
  const [isTransparencyOpen, setIsTransparencyOpen] = useState<boolean>(false);
  const [transparencyTab, setTransparencyTab] = useState<"charter" | "comparison" | "proofOfReserves" | "liveLedger" | "publicUsers">("charter");
  const [isReferralOpen, setIsReferralOpen] = useState<boolean>(false);

  // Direct PWA Install Trigger Hook
  const { isInstallable, isInstalled, isStandalone, install, openApp } = usePWAInstall();

  const handleTriggerInstallApp = async () => {
    sound.playButtonClick();
    if (isInstalled && !isStandalone) {
      openApp();
    } else {
      await install();
    }
  };

  // Active round reference for Provably Fair modal
  const [activeRound, setActiveRound] = useState<TableRound | null>(null);
  const [tableRoadmap, setTableRoadmap] = useState<RoadmapItem[]>([]);

  // Hook to detect screen orientation and aspect ratio changes, dynamically toggling 'compact-mode' on root element
  useEffect(() => {
    const checkCompactMode = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isMobile = window.innerWidth <= 1024 || window.innerHeight <= 600;
      const isCompact = isLandscape && isMobile;
      if (isCompact) {
        document.documentElement.classList.add("compact-mode");
      } else {
        document.documentElement.classList.remove("compact-mode");
      }
    };
    checkCompactMode();
    window.addEventListener("resize", checkCompactMode);
    window.addEventListener("orientationchange", checkCompactMode);
    return () => {
      window.removeEventListener("resize", checkCompactMode);
      window.removeEventListener("orientationchange", checkCompactMode);
    };
  }, []);

  // Telemetry periodic fetch for high-load state
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch("/api/system/telemetry");
        if (res.ok) {
          const data = await res.json();
          setTelemetry(data);
        }
      } catch {
        // Fallback default high-load values
      }
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, []);

  // Listen for custom currency changes across the app
  useEffect(() => {
    const handleCurrencyChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ code: string }>;
      if (customEvent.detail?.code) {
        setSelectedCurrency(customEvent.detail.code);
      }
    };
    window.addEventListener("currency-change", handleCurrencyChange);
    return () => window.removeEventListener("currency-change", handleCurrencyChange);
  }, []);

  const [swipeNotice, setSwipeNotice] = useState<string | null>(null);

  const tabSequence: Array<"game" | "p2p" | "leaderboard"> = ["game", "p2p", "leaderboard"];
  const tabIndexMap: Record<"game" | "p2p" | "leaderboard", number> = {
    game: 0,
    p2p: 1,
    leaderboard: 2,
  };

  const handleTabChange = (newTab: "game" | "p2p" | "leaderboard") => {
    if (newTab === activeTab) return;
    const dir = tabIndexMap[newTab] > tabIndexMap[activeTab] ? 1 : -1;
    setTabDirection(dir);
    setActiveTab(newTab);
  };

  const tabSlideVariants = {
    initial: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 45 : -45,
      scale: 0.99,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.28, ease: "easeOut" as const },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -45 : 45,
      scale: 0.99,
      transition: { duration: 0.2, ease: "easeIn" as const },
    }),
  };

  const bindTabSwipe = useDrag(
    ({ swipe: [swipeX], movement: [mx], direction: [dirX], event, last }) => {
      // Ignore drags originating inside horizontal scrollable elements or buttons
      const targetEl = event.target as HTMLElement | null;
      if (
        targetEl &&
        targetEl.closest(".no-scrollbar, .overflow-x-auto, input[type='range'], [data-prevent-swipe='true']")
      ) {
        return;
      }

      if (last) {
        const currentIndex = tabSequence.indexOf(activeTab);

        // Swipe Left -> Next Tab
        if (swipeX < 0 || (mx < -50 && dirX < 0)) {
          if (currentIndex < tabSequence.length - 1) {
            sound.playButtonClick();
            const nextTab = tabSequence[currentIndex + 1];
            handleTabChange(nextTab);
            const label = nextTab === "p2p" ? "1v1 Duels" : "Leaderboard";
            setSwipeNotice(`Swiped to ${label} ➔`);
            setTimeout(() => setSwipeNotice(null), 1500);
          }
        }
        // Swipe Right -> Previous Tab
        else if (swipeX > 0 || (mx > 50 && dirX > 0)) {
          if (currentIndex > 0) {
            sound.playButtonClick();
            const prevTab = tabSequence[currentIndex - 1];
            handleTabChange(prevTab);
            const label = prevTab === "game" ? "Live Arena" : "1v1 Duels";
            setSwipeNotice(`⬅ Swiped to ${label}`);
            setTimeout(() => setSwipeNotice(null), 1500);
          }
        }
      }
    },
    {
      axis: "x",
      filterTaps: true,
      pointer: { touch: true },
      swipe: { distance: 30, velocity: 0.15 },
    }
  );

  // Check localStorage for saved user session on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem("dt_user_id");
    const savedUsername = localStorage.getItem("dt_username");
    if (savedUserId && savedUsername) {
      fetchUser(savedUserId, savedUsername);
    }
  }, []);

  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname + window.location.hash;
  });

  // Admin and Route Navigation Listener
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(window.location.pathname + window.location.hash);
    };
    handleLocationChange();
    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  // Real-time balance and user state polling loop (every 2.5s)
  useEffect(() => {
    if (!user?.userId) return;
    const interval = setInterval(() => {
      fetchUser(user.userId, user.username);
    }, 2500);
    return () => clearInterval(interval);
  }, [user?.userId, user?.username]);

  const fetchUser = async (userId: string, username: string) => {
    if (!userId || userId === "undefined" || userId.trim() === "") {
      handleLogout();
      return;
    }
    try {
      const res = await fetch(`/api/wallet/${encodeURIComponent(userId)}?username=${encodeURIComponent(username)}`);
      if (!res.ok) {
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return;
      }
      const data = await res.json();
      if (data && data.userId) {
        setUser(data);
        localStorage.setItem("dt_user_id", userId);
        localStorage.setItem("dt_username", username);
      }
    } catch {
      // Ignore transient network errors
    }
  };

  const handleLoginSuccess = (loggedInUser: UserWallet) => {
    setUser(loggedInUser);
    localStorage.setItem("dt_user_id", loggedInUser.userId);
    localStorage.setItem("dt_username", loggedInUser.username);
  };

  const handleLogout = () => {
    localStorage.removeItem("dt_user_id");
    localStorage.removeItem("dt_username");
    setUser(null);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.sfxEnabled = next;
  };

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    sound.voiceEnabled = next;
  };

  const handleToggleBalanceType = async () => {
    if (!user) return;
    const targetType: "demo" | "real" = user.balanceType === "real" ? "demo" : "real";
    
    // 1. Instant optimistic UI update
    setUser((prev) => (prev ? { ...prev, balanceType: targetType } : null));
    sound.playButtonClick();

    try {
      const res = await fetch(`/api/wallet/${user.userId}/toggle-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balanceType: targetType }),
      });
      const data = await res.json();
      
      // 2. Explicit state check to ensure UI reflects target balance mode regardless of latency
      if (data.success && data.user) {
        setUser((prev) => {
          const resolvedType = (data.user.balanceType || targetType) as "demo" | "real";
          if (!prev) return { ...data.user, balanceType: resolvedType };
          return {
            ...data.user,
            balanceType: resolvedType,
          };
        });
      } else {
        // Fallback: reinforce optimistic target balance mode
        setUser((prev) => (prev ? { ...prev, balanceType: targetType } : null));
      }
    } catch (e) {
      console.error("Failed to toggle balance type on server:", e);
      // Retain optimistic balance mode on transient network error
      setUser((prev) => (prev ? { ...prev, balanceType: targetType } : null));
    }
  };

  const handleOpenRoadmap = async () => {
    try {
      const res = await fetch(`/api/tables/${selectedTable}/roadmap`);
      const data = await res.json();
      setTableRoadmap(data);
    } catch (e) {
      console.error(e);
    }
    setIsRoadmapOpen(true);
  };

  const handleOpenProvablyFair = async () => {
    try {
      const res = await fetch("/api/tables");
      const tables = await res.json();
      const match = tables.find((t: { config: { slug: string } }) => t.config.slug === selectedTable);
      if (match) setActiveRound(match.currentRound);
    } catch (e) {
      console.error(e);
    }
    setIsProvablyFairOpen(true);
  };

  const handleCloseAllModals = () => {
    setIsWalletOpen(false);
    setIsProfileOpen(false);
    setIsProvablyFairOpen(false);
    setIsRoadmapOpen(false);
    setIsMerchantOpen(false);
    setIsLiquidityOpen(false);
    setIsBetHistoryOpen(false);
    setIsGameRulesOpen(false);
    setIsTransparencyOpen(false);
    setIsReferralOpen(false);
    setIsMenuOpen(false);
    setIsOnlineUsersOpen(false);
  };

  // Updated state-driven admin route handler
  const isAdminRoute =
    currentRoute.includes("/admin") ||
    currentRoute.includes("#/admin") ||
    currentRoute.includes("#admin");

  const isAdminLogin =
    currentRoute.includes("/admin/login") ||
    currentRoute.includes("#/admin/login");

  const isAdminAuthorized =
    localStorage.getItem("admin_token") !== null ||
    sessionStorage.getItem("admin_authorized") === "true";

  if (isAdminRoute) {
    if (!isAdminAuthorized || isAdminLogin) {
      return (
        <AdminLogin
          onLoginSuccess={() => {
            sessionStorage.setItem("admin_authorized", "true");
            window.location.hash = "#/admin";
            setCurrentRoute(window.location.pathname + "#/admin");
          }}
          onBackToGame={() => {
            window.location.hash = "#/";
            setCurrentRoute(window.location.pathname + "#/");
          }}
        />
      );
    }
    return (
      <AdminDashboard
        onExit={() => {
          window.location.hash = "#/";
          setCurrentRoute(window.location.pathname + "#/");
        }}
        onLogout={() => {
          localStorage.removeItem("admin_token");
          sessionStorage.removeItem("admin_authorized");
          sessionStorage.removeItem("admin_user");
          window.location.hash = "#/admin/login";
          setCurrentRoute(window.location.pathname + "#/admin/login");
        }}
      />
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`w-full text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950 relative ${activeTab === "game" ? "h-[100dvh] overflow-hidden bg-black select-none" : "min-h-[100dvh] bg-[#02050b] overflow-x-hidden"}`}>
      {/* Immersive Atmospheric Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-red-600/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
      </div>

      <div className={`w-full flex-1 flex flex-col relative z-10 ${activeTab === "game" ? "h-full overflow-hidden pb-12 md:pb-0" : "pb-20 md:pb-8"}`}>
        {/* Inactivity Security Auto-Logout (30 mins) */}
        <AutoLogoutTimer onLogout={handleLogout} timeoutMinutes={30} warningMinutes={2} />

        {/* Global Keyboard Shortcut Listener */}
        <GlobalShortcuts
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenLeaderboard={() => handleTabChange("leaderboard")}
          onOpenGame={() => handleTabChange("game")}
          onOpenP2P={() => handleTabChange("p2p")}
          onOpenMenu={() => setIsMenuOpen(true)}
          onCloseModals={handleCloseAllModals}
        />

        <Navbar
          user={user}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          selectedTable={selectedTable}
          onSelectTable={setSelectedTable}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          voiceEnabled={voiceEnabled}
          onToggleVoice={handleToggleVoice}
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenProvablyFair={handleOpenProvablyFair}
          onOpenRoadmap={handleOpenRoadmap}
          onOpenMerchant={() => setIsMerchantOpen(true)}
          onOpenSiteLiquidity={() => setIsLiquidityOpen(true)}
          onOpenBetHistory={() => setIsBetHistoryOpen(true)}
          onOpenRules={() => setIsGameRulesOpen(true)}
          onOpenTransparency={() => {
            setTransparencyTab("charter");
            setIsTransparencyOpen(true);
          }}
          onOpenReferral={() => setIsReferralOpen(true)}
          onOpenCurrencySelector={() => setIsCurrencySelectorOpen(true)}
          onOpenInstallApp={handleTriggerInstallApp}
          isStandalone={isStandalone}
          isInstalled={isInstalled}
          selectedCurrency={selectedCurrency}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenOnlineUsers={() => setIsOnlineUsersOpen(true)}
          onLogout={handleLogout}
          onToggleBalanceType={handleToggleBalanceType}
          lang={lang}
          onToggleLang={() => setLang((l) => (l === "bn" ? "en" : "bn"))}
          telemetryPlayerCount={telemetry?.totalActivePlayers ?? 1}
          tablePlayerCounts={telemetry?.tableActivePlayers}
        />

        {/* Swipe Feedback Toast Notice */}
        <AnimatePresence>
          {swipeNotice && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] bg-neutral-900/95 border border-amber-500/50 text-amber-300 px-4 py-2 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.8)] font-black text-xs tracking-wider font-mono flex items-center gap-2 pointer-events-none"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{swipeNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gesture Swipe Container for Tab Navigation */}
        <div {...bindTabSwipe()} className="w-full flex-1 flex flex-col relative touch-pan-y">
          <AnimatePresence mode="wait" custom={tabDirection}>
            <motion.main
              key={activeTab}
              custom={tabDirection}
              variants={tabSlideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`w-full relative ${
                activeTab === "game"
                  ? "max-w-none p-0 overflow-hidden flex flex-col flex-1 h-full min-h-0"
                  : "max-w-7xl mx-auto px-1 sm:px-4 lg:px-8 py-1.5 sm:py-4 pb-20 md:pb-8"
              }`}
            >
            {activeTab === "game" && (
              <GameTable
                user={user}
                selectedTableSlug={selectedTable}
                onUpdateWallet={setUser}
                onOpenProvablyFair={handleOpenProvablyFair}
                onOpenRoadmap={handleOpenRoadmap}
                onOpenBetHistory={() => setIsBetHistoryOpen(true)}
                onOpenRules={() => setIsGameRulesOpen(true)}
                onOpenProfile={() => setIsProfileOpen(true)}
                onToggleBalanceType={handleToggleBalanceType}
                onNavigateToP2P={() => handleTabChange("p2p")}
              />
            )}
            {activeTab === "p2p" && <P2PLobby user={user} onUpdateWallet={setUser} />}
            {activeTab === "leaderboard" && (
              <Leaderboard
                onOpenLiquidity={() => setIsLiquidityOpen(true)}
                currentUser={user}
              />
            )}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Render Regulatory Footer on standard pages (on game tab, build number is integrated in table HUD) */}
      {showRegulatoryFooter && activeTab !== "game" && (
        <RegulatoryFooter
          lang={lang}
          telemetry={telemetry}
          onOpenProvablyFair={handleOpenProvablyFair}
          onOpenLiquidity={() => setIsLiquidityOpen(true)}
          onOpenTransparency={() => setIsTransparencyOpen(true)}
          onOpenRules={() => setIsGameRulesOpen(true)}
          onOpenReferral={() => setIsReferralOpen(true)}
        />
      )}

      {/* Side Navigation Menu Drawer */}
      <SideNavDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === "bn" ? "en" : "bn"))}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        voiceEnabled={voiceEnabled}
        onToggleVoice={handleToggleVoice}
        onOpenWallet={() => {
          setIsMenuOpen(false);
          setIsWalletOpen(true);
        }}
        onOpenProfile={() => {
          setIsMenuOpen(false);
          setIsProfileOpen(true);
        }}
        onOpenProvablyFair={() => {
          setIsMenuOpen(false);
          handleOpenProvablyFair();
        }}
        onOpenRoadmap={() => {
          setIsMenuOpen(false);
          handleOpenRoadmap();
        }}
        onOpenRules={() => {
          setIsMenuOpen(false);
          setIsGameRulesOpen(true);
        }}
        onOpenTransparency={() => {
          setIsMenuOpen(false);
          setTransparencyTab("charter");
          setIsTransparencyOpen(true);
        }}
        onOpenPublicUsers={() => {
          setIsMenuOpen(false);
          setTransparencyTab("publicUsers");
          setIsTransparencyOpen(true);
        }}
        onOpenBetHistory={() => {
          setIsMenuOpen(false);
          setIsBetHistoryOpen(true);
        }}
        onOpenSiteLiquidity={() => {
          setIsMenuOpen(false);
          setIsLiquidityOpen(true);
        }}
        onOpenReferral={() => {
          setIsMenuOpen(false);
          setIsReferralOpen(true);
        }}
        onOpenCurrencySelector={() => {
          setIsMenuOpen(false);
          setIsCurrencySelectorOpen(true);
        }}
        onOpenInstallApp={() => {
          setIsMenuOpen(false);
          handleTriggerInstallApp();
        }}
        isStandalone={isStandalone}
        isInstalled={isInstalled}
        selectedCurrency={selectedCurrency}
        onOpenMerchant={() => {
          setIsMenuOpen(false);
          setIsMerchantOpen(true);
        }}
        onOpenAdmin={() => {
          setIsMenuOpen(false);
          window.location.hash = "#/admin";
          setCurrentRoute(window.location.pathname + "#/admin");
        }}
        onToggleRegulatoryFooter={() => setShowRegulatoryFooter((prev) => !prev)}
        showRegulatoryFooter={showRegulatoryFooter}
        onToggleBalanceType={handleToggleBalanceType}
        onLogout={() => {
          setIsMenuOpen(false);
          handleLogout();
        }}
      />

      {/* Online Active Users Transparency Modal */}
      {isOnlineUsersOpen && (
        <ActiveOnlineUsersModal
          isOpen={isOnlineUsersOpen}
          onClose={() => setIsOnlineUsersOpen(false)}
          onlineCount={telemetry?.totalActivePlayers || 284592}
          lang={lang}
        />
      )}

      {/* MODALS */}

      {isBetHistoryOpen && (
        <UserBetHistoryModal
          user={user}
          isOpen={isBetHistoryOpen}
          onClose={() => setIsBetHistoryOpen(false)}
          lang={lang}
        />
      )}

      {isGameRulesOpen && (
        <GameRulesModal
          isOpen={isGameRulesOpen}
          onClose={() => setIsGameRulesOpen(false)}
          lang={lang}
        />
      )}

      {isTransparencyOpen && (
        <TransparencyCharterModal
          isOpen={isTransparencyOpen}
          onClose={() => setIsTransparencyOpen(false)}
          lang={lang}
          onOpenProvablyFair={handleOpenProvablyFair}
          onOpenLiquidity={() => setIsLiquidityOpen(true)}
          initialTab={transparencyTab}
        />
      )}

      {isLiquidityOpen && (
        <SiteLiquidityModal
          isOpen={isLiquidityOpen}
          onClose={() => setIsLiquidityOpen(false)}
          currentUserId={user.userId}
        />
      )}

      {isProfileOpen && (
        <UserProfileModal
          user={user}
          onClose={() => setIsProfileOpen(false)}
          onOpenWallet={() => {
            setIsProfileOpen(false);
            setIsWalletOpen(true);
          }}
          onUpdateWallet={setUser}
          onOpenReferral={() => setIsReferralOpen(true)}
        />
      )}

      {isWalletOpen && (
        <WalletModal
          user={user}
          onClose={() => setIsWalletOpen(false)}
          onUpdateWallet={setUser}
          onOpenProfile={() => setIsProfileOpen(true)}
          onToggleBalanceType={handleToggleBalanceType}
        />
      )}

      {isProvablyFairOpen && (
        <ProvablyFairModal
          currentRound={activeRound}
          onClose={() => setIsProvablyFairOpen(false)}
        />
      )}

      {isRoadmapOpen && (
        <RoadmapModal
          tableName={selectedTable.toUpperCase()}
          roadmap={tableRoadmap}
          onClose={() => setIsRoadmapOpen(false)}
        />
      )}

      {isCurrencySelectorOpen && (
        <CurrencySelectorModal
          selectedCurrency={selectedCurrency}
          onSelectCurrency={(code) => {
            setSelectedCurrency(code);
            setStoredCurrencyCode(code);
          }}
          onClose={() => setIsCurrencySelectorOpen(false)}
          baseBalance={user?.balance || 50000}
        />
      )}

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenInstallApp={handleTriggerInstallApp}
        isStandalone={isStandalone}
        isInstalled={isInstalled}
        user={user}
        selectedCurrency={selectedCurrency}
      />
    </div>
  </div>
  );
}
