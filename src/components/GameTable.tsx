import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  RotateCcw,
  Zap,
  Flame,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Radio,
  ShieldCheck,
  TrendingUp,
  Users,
  CheckCircle2,
  BookOpen,
  Clock,
  Scale,
  Award,
  User,
  Check,
  Plus,
  Minus,
  RefreshCw,
  X,
  AlertCircle,
  HelpCircle,
  SlidersHorizontal,
  Swords,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Gift,
  History,
  Settings as SettingsIcon,
  Info,
  Maximize2,
  Minimize2,
  Star,
  Play,
} from "lucide-react";
import { UserWallet, TableRound, RoadmapItem, LiveBetRecord } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { PlayingCard as PlayingCardComponent } from "./PlayingCard";
import { useSoundManager } from "../utils/useSoundManager";
import { sound } from "../utils/audio";
import { useActiveCurrency, formatCurrency } from "../utils/currency";
import { LiveChat } from "./LiveChat";
import { LiveBetFeed } from "./LiveBetFeed";
import { LiveAction } from "./LiveAction";
import { BUILD_NUMBER } from "../config/version";
import virtualCasinoBg from "../assets/images/virtual_dragon_tiger_bg_1790593984233.jpg";

interface GameTableProps {
  user: UserWallet;
  selectedTableSlug: "express" | "classic" | "vip";
  onUpdateWallet: (updatedUser: UserWallet) => void;
  onOpenProvablyFair: () => void;
  onOpenRoadmap: () => void;
  onOpenBetHistory?: () => void;
  onOpenRules?: () => void;
  onOpenProfile?: () => void;
  onToggleBalanceType?: () => void;
  onNavigateToP2P?: () => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  user,
  selectedTableSlug,
  onUpdateWallet,
  onOpenProvablyFair,
  onOpenRoadmap,
  onOpenBetHistory,
  onOpenRules,
  onOpenProfile,
  onToggleBalanceType,
  onNavigateToP2P,
}) => {
  const soundManager = useSoundManager();

  // Table Limits & Chip Configuration per Table
  const tableConfigs: Record<
    "express" | "classic" | "vip",
    {
      minBet: number;
      maxBet: number;
      chips: number[];
      quickAddIncrements: number[];
      step: number;
      speedLabel: string;
      name: string;
    }
  > = {
    express: {
      minBet: 1,
      maxBet: 1000,
      chips: [1, 5, 10, 25, 50, 100, 250, 500],
      quickAddIncrements: [1, 5, 10, 50, 100],
      step: 1,
      speedLabel: "15s Speed",
      name: "Express Speed Arena",
    },
    classic: {
      minBet: 1,
      maxBet: 10000,
      chips: [1, 10, 25, 50, 100, 250, 500, 1000, 2500],
      quickAddIncrements: [1, 10, 50, 100, 500, 1000],
      step: 10,
      speedLabel: "30s Standard",
      name: "Classic High Table",
    },
    vip: {
      minBet: 1,
      maxBet: 100000,
      chips: [1, 100, 250, 500, 1000, 2500, 5000, 10000, 25000],
      quickAddIncrements: [1, 100, 500, 1000, 5000, 10000],
      step: 100,
      speedLabel: "30s VIP",
      name: "VIP Diamond Lounge",
    },
  };

  const activeCurrency = useActiveCurrency();
  const baseLimits = tableConfigs[selectedTableSlug] || tableConfigs.express;
  
  // Dynamically calculate limits so the minimum bet is exactly 1 BDT / 1 INR / 1 USD depending on active rate!
  const activeLimits = {
    ...baseLimits,
    minBet: 1 / activeCurrency.rateFromBase,
    chips: [
      1 / activeCurrency.rateFromBase,
      5 / activeCurrency.rateFromBase,
      10 / activeCurrency.rateFromBase,
      50 / activeCurrency.rateFromBase,
      100 / activeCurrency.rateFromBase,
      500 / activeCurrency.rateFromBase,
      1000 / activeCurrency.rateFromBase,
      5000 / activeCurrency.rateFromBase,
    ].filter(c => c >= 1 / activeCurrency.rateFromBase)
  };

  const formatAmt = (amt: number | null | undefined, compact = false) =>
    formatCurrency(amt, { currencyCode: activeCurrency.code, convertFromBase: true, compact });

  // Streamlined Betting state (Side -> Amount -> Place)
  const [selectedSide, setSelectedSide] = useState<"DRAGON" | "TIGER" | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(activeLimits.minBet);
  const [customAmountInput, setCustomAmountInput] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  // Staged side bets for legacy chip-stack clicks
  const [dragonBet, setDragonBet] = useState<number>(0);
  const [tigerBet, setTigerBet] = useState<number>(0);
  const [lastPlacedBet, setLastPlacedBet] = useState<{ side: "DRAGON" | "TIGER"; amount: number } | null>(null);

  // Modal and Toolbar states matching Petros04 / Iconic21 screenshots
  const [showLimitsDropdown, setShowLimitsDropdown] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<"settings" | "mute">("settings");
  const [historyTab, setHistoryTab] = useState<"myBets" | "history" | "mute">("myBets");
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [volumeLevel, setVolumeLevel] = useState<number>(85);
  const [showWinnerList, setShowWinnerList] = useState<boolean>(true);
  const [showOtherReactions, setShowOtherReactions] = useState<boolean>(true);
  const [showRoadmapPanel, setShowRoadmapPanel] = useState<boolean>(typeof window !== "undefined" ? window.innerWidth >= 1024 : true);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [voiceFeedback, setVoiceFeedback] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const recognitionRef = useRef<any>(null);

  // ResizeObserver state & ref for responsive card element auto-scaling
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [cardScale, setCardScale] = useState<number>(1);
  const roadmapScrollRef = useRef<HTMLDivElement>(null);
  
  // Pro Auto Bet Engine 2.0 State
  type AutoBetStrategy = "FLAT" | "MARTINGALE" | "ANTI_MARTINGALE" | "ALTERNATE" | "STREAK_CHASER";

  const [autoBetConfig, setAutoBetConfig] = useState<{
    isActive: boolean;
    strategy: AutoBetStrategy;
    side: "DRAGON" | "TIGER";
    baseAmount: number;
    currentStake: number;
    totalRounds: number; // 5, 10, 20, 50, 100, 9999
    roundsRemaining: number;
    roundsCompleted: number;
    totalWagered: number;
    totalProfitLoss: number;
    winsCount: number;
    lossesCount: number;
    currentStreak: number; // positive = win streak, negative = loss streak
    stopOnWin: boolean;
    stopOnLoss: boolean;
    stopProfitTarget: number; // 0 = off, else target profit amount
    stopLossLimit: number; // 0 = off, else max loss limit amount
    maxStakeCap: number; // Max stake cap for Martingale safety
  }>({
    isActive: false,
    strategy: "FLAT",
    side: "DRAGON",
    baseAmount: activeLimits.minBet,
    currentStake: activeLimits.minBet,
    totalRounds: 10,
    roundsRemaining: 10,
    roundsCompleted: 0,
    totalWagered: 0,
    totalProfitLoss: 0,
    winsCount: 0,
    lossesCount: 0,
    currentStreak: 0,
    stopOnWin: false,
    stopOnLoss: false,
    stopProfitTarget: 0,
    stopLossLimit: 0,
    maxStakeCap: activeLimits.maxBet,
  });

  const [showAutoBetModal, setShowAutoBetModal] = useState<boolean>(false);
  const autoBetProcessedRoundRef = useRef<number | null>(null);
  const autoBetPrevRoundRef = useRef<TableRound | null>(null);

  const [activeConfirmedBet, setActiveConfirmedBet] = useState<{
    id?: string;
    side: "DRAGON" | "TIGER";
    amount: number;
  } | null>(null);

  // UI helpers & Sheets
  const [showQuickGuide, setShowQuickGuide] = useState<boolean>(false);
  const [showRulesSheet, setShowRulesSheet] = useState<boolean>(false);
  const [showTrustBar, setShowTrustBar] = useState<boolean>(true);
  const [showProfileCard, setShowProfileCard] = useState<boolean>(true);
  const [showQuickNav, setShowQuickNav] = useState<boolean>(true);
  const [demoResetLoading, setDemoResetLoading] = useState<boolean>(false);
  const [cancelingBet, setCancelingBet] = useState<boolean>(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState<boolean>(false);

  // Live Table Round State from Server
  const [currentRound, setCurrentRound] = useState<TableRound | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);

  useEffect(() => {
    if (roadmapScrollRef.current) {
      roadmapScrollRef.current.scrollLeft = roadmapScrollRef.current.scrollWidth;
    }
  }, [roadmap, showRoadmapPanel]);
  const [currentRoundBets, setCurrentRoundBets] = useState<LiveBetRecord[]>([]);
  const [recentSettledBets, setRecentSettledBets] = useState<LiveBetRecord[]>([]);
  const [dealerCommentary, setDealerCommentary] = useState<string>(
    "Welcome to the P2P Dragon Tiger Arena. Choose Dragon or Tiger to play!"
  );
  const [sidebarTab, setSidebarTab] = useState<"liveAction" | "chat" | "roadmap" | "guide">("liveAction");
  const [tieRefundBanner, setTieRefundBanner] = useState<{ amount: number; roundNumber: number } | null>(null);
  const [streakCelebration, setStreakCelebration] = useState<{ streak: number; roundNumber: number } | null>(null);
  const [showWinCelebration, setShowWinCelebration] = useState<boolean>(false);
  const [slotPulse, setSlotPulse] = useState<{
    dragon: "WIN" | "LOSS" | "TIE" | null;
    tiger: "WIN" | "LOSS" | "TIE" | null;
    active: boolean;
  }>({ dragon: null, tiger: null, active: false });

  const [broadcastTime, setBroadcastTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setBroadcastTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeBalance = user.balanceType === "real" ? user.balance : user.demoBalance;

  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => !!document.fullscreenElement);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ResizeObserver to watch container and dynamically scale internal card elements via CSS transform: scale()
  useEffect(() => {
    if (!gameContainerRef.current) return;
    const container = gameContainerRef.current;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Calculate appropriate scale factor based on viewport container width and height
        // Baseline: ~740px width and ~540px height corresponds to 1.0 scale
        // When viewport is constrained (e.g. mobile portrait or landscape), calculate scale
        const scaleByWidth = width / 740;
        const scaleByHeight = height / 540;
        const minScale = Math.min(scaleByWidth, scaleByHeight);
        // Ensure scale stays within [0.55, 1.15] so cards never clip or overlap
        const boundedScale = Math.min(Math.max(minScale, 0.55), 1.15);
        setCardScale(Number(boundedScale.toFixed(3)));
      }
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);


  // Sync default amount when switching table
  useEffect(() => {
    if (selectedAmount < activeLimits.minBet || selectedAmount > activeLimits.maxBet) {
      setSelectedAmount(activeLimits.minBet);
      setCustomAmountInput(String(Math.round(activeLimits.minBet * activeCurrency.rateFromBase)));
    }
  }, [selectedTableSlug, activeLimits.minBet, activeLimits.maxBet, activeCurrency.rateFromBase]);

  // Check Onboarding Tutorial status
  useEffect(() => {
    const seen = localStorage.getItem("dt_tutorial_seen");
    if (!seen) {
      setShowQuickGuide(true);
    }
  }, []);

  const handleDismissTutorial = () => {
    setShowQuickGuide(false);
    localStorage.setItem("dt_tutorial_seen", "true");
  };

  // Pro Auto Bet Engine Automation Loop
  useEffect(() => {
    if (!currentRound) return;

    // 1. Auto Bet Execution during BETTING status
    if (
      autoBetConfig.isActive &&
      currentRound.status === "BETTING" &&
      currentRound.secondsRemaining > 2 &&
      autoBetProcessedRoundRef.current !== currentRound.roundNumber
    ) {
      const stakeToUse = autoBetConfig.currentStake;

      if (autoBetConfig.roundsRemaining > 0 && activeBalance >= stakeToUse) {
        autoBetProcessedRoundRef.current = currentRound.roundNumber;
        executeDirectBet(autoBetConfig.side, stakeToUse);

        setAutoBetConfig((prev) => {
          const nextRemaining = prev.roundsRemaining === 9999 ? 9999 : prev.roundsRemaining - 1;
          const isDone = nextRemaining <= 0;
          return {
            ...prev,
            roundsRemaining: nextRemaining,
            roundsCompleted: prev.roundsCompleted + 1,
            totalWagered: prev.totalWagered + stakeToUse,
            isActive: !isDone,
          };
        });
      } else {
        // Stop if balance is insufficient or rounds finished
        setAutoBetConfig((prev) => ({ ...prev, isActive: false }));
      }
    }

    // 2. Strategy Calculation & Stop Condition Checks when round settles
    if (
      autoBetConfig.isActive &&
      (currentRound.status === "SETTLING" || currentRound.status === "COMPLETED") &&
      currentRound.result &&
      autoBetPrevRoundRef.current?.roundNumber !== currentRound.roundNumber
    ) {
      autoBetPrevRoundRef.current = currentRound;
      const result = currentRound.result;
      const isWin = result === autoBetConfig.side;
      const isLoss = result !== "TIE" && result !== autoBetConfig.side;
      const isTie = result === "TIE";

      setAutoBetConfig((prev) => {
        let nextSide = prev.side;
        let nextStake = prev.baseAmount;
        let pnlDelta = 0;
        let newWins = prev.winsCount;
        let newLosses = prev.lossesCount;
        let newStreak = prev.currentStreak;

        if (isWin) {
          pnlDelta = prev.currentStake; // 1:1 payout net win
          newWins += 1;
          newStreak = prev.currentStreak > 0 ? prev.currentStreak + 1 : 1;

          // Strategy logic after Win
          if (prev.strategy === "FLAT") {
            nextStake = prev.baseAmount;
          } else if (prev.strategy === "MARTINGALE") {
            // Reset to base amount on win!
            nextStake = prev.baseAmount;
          } else if (prev.strategy === "ANTI_MARTINGALE") {
            // Double stake on win!
            nextStake = Math.min(prev.maxStakeCap, prev.currentStake * 2);
          } else if (prev.strategy === "ALTERNATE") {
            nextSide = prev.side === "DRAGON" ? "TIGER" : "DRAGON";
            nextStake = prev.baseAmount;
          } else if (prev.strategy === "STREAK_CHASER") {
            nextSide = result === "DRAGON" || result === "TIGER" ? result : prev.side;
            nextStake = prev.baseAmount;
          }
        } else if (isLoss) {
          pnlDelta = -prev.currentStake;
          newLosses += 1;
          newStreak = prev.currentStreak < 0 ? prev.currentStreak - 1 : -1;

          // Strategy logic after Loss
          if (prev.strategy === "FLAT") {
            nextStake = prev.baseAmount;
          } else if (prev.strategy === "MARTINGALE") {
            // Double stake on loss!
            nextStake = Math.min(prev.maxStakeCap, prev.currentStake * 2);
          } else if (prev.strategy === "ANTI_MARTINGALE") {
            // Reset to base amount on loss!
            nextStake = prev.baseAmount;
          } else if (prev.strategy === "ALTERNATE") {
            nextSide = prev.side === "DRAGON" ? "TIGER" : "DRAGON";
            nextStake = prev.baseAmount;
          } else if (prev.strategy === "STREAK_CHASER") {
            nextSide = result === "DRAGON" || result === "TIGER" ? result : prev.side;
            nextStake = prev.baseAmount;
          }
        } else if (isTie) {
          // Tie refunds stake or holds
          nextStake = prev.currentStake;
        }

        const newPnl = prev.totalProfitLoss + pnlDelta;

        // Check stop rules
        let shouldStop = false;
        if (isWin && prev.stopOnWin) shouldStop = true;
        if (isLoss && prev.stopOnLoss) shouldStop = true;
        if (prev.stopProfitTarget > 0 && newPnl >= prev.stopProfitTarget) shouldStop = true;
        if (prev.stopLossLimit > 0 && newPnl <= -prev.stopLossLimit) shouldStop = true;

        return {
          ...prev,
          side: nextSide,
          currentStake: nextStake,
          totalProfitLoss: newPnl,
          winsCount: newWins,
          lossesCount: newLosses,
          currentStreak: newStreak,
          isActive: !shouldStop && prev.isActive,
        };
      });
    }
  }, [currentRound, autoBetConfig, activeBalance]);

  // Fetch initial roadmap, round info, and transparent live bets
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const safeFetchJson = async (url: string) => {
          try {
            const res = await fetch(url);
            if (!res.ok) return null;
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) return null;
            return await res.json();
          } catch {
            return null;
          }
        };

        const [tablesData, roadData, betsData] = await Promise.all([
          safeFetchJson("/api/tables"),
          safeFetchJson(`/api/tables/${selectedTableSlug}/roadmap`),
          safeFetchJson(`/api/tables/${selectedTableSlug}/bets`),
        ]);

        if (Array.isArray(tablesData)) {
          const match = tablesData.find((t: { config: { slug: string } }) => t.config.slug === selectedTableSlug);
          if (match) {
            setCurrentRound(match.currentRound);
          }
        }
        if (Array.isArray(roadData)) {
          setRoadmap(roadData);
        }
        if (betsData) {
          if (Array.isArray(betsData.currentRoundBets)) {
            setCurrentRoundBets(betsData.currentRoundBets);
          }
          if (Array.isArray(betsData.recentSettledBets)) {
            setRecentSettledBets(betsData.recentSettledBets);
          }
        }
      } catch (e) {
        console.error("Error fetching table data:", e);
      }
    };

    fetchTableData();
  }, [selectedTableSlug]);

  // WebSocket Live Subscription
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "TIMER_TICK" && data.tableSlug === selectedTableSlug) {
          setCurrentRound((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              secondsRemaining: data.secondsRemaining,
              dragonPool: data.dragonPool,
              tigerPool: data.tigerPool,
              matchedAmount: data.matchedAmount,
            };
          });
          if (data.secondsRemaining === 5) {
            soundManager.playLastBets();
          }
          if (data.secondsRemaining <= 5 && data.secondsRemaining > 0) {
            soundManager.playTick(data.secondsRemaining);
          }
        } else if (data.type === "ROUND_PHASE" && data.tableSlug === selectedTableSlug) {
          setCurrentRound((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: data.status,
              matchedAmount: data.matchedAmount,
              dragonPool: data.dragonPool !== undefined ? data.dragonPool : prev.dragonPool,
              tigerPool: data.tigerPool !== undefined ? data.tigerPool : prev.tigerPool,
            };
          });
          if (data.status === "MATCHING" || data.status === "DEALING") {
            soundManager.playBetsClosed();
            const dPool = data.dragonPool || 0;
            const tPool = data.tigerPool || 0;
            const mAmount = data.matchedAmount || 0;
            const returnedTotal = Math.max(0, dPool + tPool - mAmount * 2);
            soundManager.announceMatchingPools(dPool, tPool, mAmount, returnedTotal);
            // Instantly refresh wallet upon matching so unmatched refunds appear immediately
            fetch(`/api/wallet/${user.userId}`)
              .then((r) => r.json())
              .then((updated) => onUpdateWallet(updated))
              .catch(() => {});
          }
        } else if (data.type === "ROUND_DEALING" && data.tableSlug === selectedTableSlug) {
          soundManager.triggerCardFlip();
          setCurrentRound((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: "DEALING",
              dragonCard: data.dragonCard,
              tigerCard: data.tigerCard,
              result: data.result,
            };
          });
        } else if (data.type === "NEW_BET" && data.tableSlug === selectedTableSlug) {
          if (data.bet) {
            setCurrentRoundBets((prev) => {
              if (prev.some((b) => b.id === data.bet.id)) return prev;
              return [data.bet, ...prev].slice(0, 60);
            });
          }
        } else if (data.type === "BET_CANCELLED" && data.tableSlug === selectedTableSlug) {
          setCurrentRoundBets((prev) => prev.filter((b) => b.id !== data.betId));
          if (activeConfirmedBet?.id === data.betId) {
            setActiveConfirmedBet(null);
          }
        } else if (data.type === "ROUND_RESULT" && data.tableSlug === selectedTableSlug) {
          setCurrentRound(data.round);
          setRoadmap(data.roadmap);
          if (Array.isArray(data.settledBets)) {
            setRecentSettledBets((prev) => [...data.settledBets, ...prev].slice(0, 80));
          }

          const winner = data.round.result;
          if (winner) {
            const dRank = data.round.dragonCard?.display || "Card";
            const tRank = data.round.tigerCard?.display || "Card";
            let payout = 0;
            let tieRefund = 0;

            if (activeConfirmedBet) {
              if (activeConfirmedBet.side === winner) {
                payout =
                  winner === "TIE"
                    ? Math.floor(activeConfirmedBet.amount * 8)
                    : Math.floor(activeConfirmedBet.amount * 1.9);
                setShowWinCelebration(true);
                setTimeout(() => setShowWinCelebration(false), 4000);
              } else if (
                winner === "TIE" &&
                (activeConfirmedBet.side === "DRAGON" || activeConfirmedBet.side === "TIGER")
              ) {
                tieRefund = 0;
                setTieRefundBanner({ amount: activeConfirmedBet.amount, roundNumber: data.round.roundNumber });
              }
            }

            // Synchronize dynamic visual feedback pulse with sound engine win/loss triggers
            if (winner === "DRAGON") {
              if (activeConfirmedBet && activeConfirmedBet.side === "TIGER") {
                setSlotPulse({ dragon: "WIN", tiger: "LOSS", active: true });
              } else {
                setSlotPulse({ dragon: "WIN", tiger: null, active: true });
              }
            } else if (winner === "TIGER") {
              if (activeConfirmedBet && activeConfirmedBet.side === "DRAGON") {
                setSlotPulse({ dragon: "LOSS", tiger: "WIN", active: true });
              } else {
                setSlotPulse({ dragon: null, tiger: "WIN", active: true });
              }
            } else if (winner === "TIE") {
              setSlotPulse({ dragon: "TIE", tiger: "TIE", active: true });
            }

            soundManager.announceWinner(winner);
            soundManager.announceDetailedCardsAndResult(winner, dRank, tRank, payout, tieRefund);

            if (activeConfirmedBet) {
              if (activeConfirmedBet.side === winner) {
                soundManager.triggerWinningState(payout);
              } else if (
                winner === "TIE" &&
                (activeConfirmedBet.side === "DRAGON" || activeConfirmedBet.side === "TIGER")
              ) {
                soundManager.triggerCoinsClinking();
                soundManager.announceTieRefund(tieRefund);
              } else {
                soundManager.triggerLosingState(activeConfirmedBet.amount);
              }
            } else {
              soundManager.triggerCoinsClinking();
            }

            setTimeout(() => {
              setSlotPulse({ dragon: null, tiger: null, active: false });
            }, 4500);
          }

          fetch(`/api/wallet/${user.userId}`)
            .then((r) => r.json())
            .then((updated) => {
              onUpdateWallet(updated);
              if (
                updated?.stats?.currentStreak &&
                updated.stats.currentStreak >= 2 &&
                activeConfirmedBet?.side === winner
              ) {
                setStreakCelebration({ streak: updated.stats.currentStreak, roundNumber: data.round.roundNumber });
                soundManager.announceWinStreak(updated.stats.currentStreak);
              }
            })
            .catch(() => {});

          fetch("/api/ai-dealer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lastWinner: data.round.result,
              tableSlug: selectedTableSlug,
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.commentary) setDealerCommentary(d.commentary);
            })
            .catch(() => {});
        } else if (data.type === "NEW_ROUND" && data.tableSlug === selectedTableSlug) {
          setCurrentRound(data.round);
          setCurrentRoundBets([]);
          soundManager.triggerRoundInitiation();
          setActiveConfirmedBet(null);
          setTieRefundBanner(null);
          setStreakCelebration(null);
          setShowWinCelebration(false);
          setSlotPulse({ dragon: null, tiger: null, active: false });

          setDragonBet(0);
          setTigerBet(0);
        }
      } catch (e) {
        console.error(e);
      }
    };

    return () => socket.close();
  }, [selectedTableSlug, user.userId, activeConfirmedBet]);

  // Stepper and Chip Selection Handlers
  const handleSelectSide = (side: "DRAGON" | "TIGER") => {
    soundManager.playChip(1.2);
    setSelectedSide(side);
  };

  const handleChipSelect = (amt: number) => {
    soundManager.playChip(1.2);
    setSelectedAmount(amt);
    setCustomAmountInput(String(Math.round(amt * activeCurrency.rateFromBase)));
    setShowCustomInput(false);
  };

  const handleAdjustAmount = (delta: number) => {
    soundManager.playChip(1.0);
    setSelectedAmount((prev) => {
      const next = Math.max(activeLimits.minBet, Math.min(activeLimits.maxBet, prev + (delta / activeCurrency.rateFromBase)));
      setCustomAmountInput(String(Math.round(next * activeCurrency.rateFromBase)));
      return next;
    });
  };

  const handleToggleCustomInput = () => {
    if (!showCustomInput) {
      setCustomAmountInput(String(Math.round(selectedAmount * activeCurrency.rateFromBase)));
    }
    setShowCustomInput(!showCustomInput);
  };

  const handleAddCustomAmount = (increment: number) => {
    soundManager.playChip(1.1);
    const current = Number(customAmountInput) || 0;
    const next = Math.min(Math.round(activeLimits.maxBet * activeCurrency.rateFromBase), current + increment);
    setCustomAmountInput(String(next));
    setSelectedAmount(next / activeCurrency.rateFromBase);
  };

  const handleKeypadTap = (action: string) => {
    soundManager.playChip(1.0);
    if (action === "CLEAR") {
      setCustomAmountInput("");
      setSelectedAmount(0);
    } else if (action === "BACKSPACE") {
      const next = customAmountInput.slice(0, -1);
      setCustomAmountInput(next);
      setSelectedAmount((Number(next) || 0) / activeCurrency.rateFromBase);
    } else {
      const next = (customAmountInput + action).replace(/^0+(?=\d)/, "");
      setCustomAmountInput(next);
      setSelectedAmount((Number(next) || 0) / activeCurrency.rateFromBase);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setCustomAmountInput(raw);
    if (raw !== "") {
      const parsed = Number(raw);
      if (!isNaN(parsed)) {
        setSelectedAmount(parsed / activeCurrency.rateFromBase);
      }
    } else {
      setSelectedAmount(0);
    }
  };

  const handleToggleVoiceListening = () => {
    if (isListeningVoice) {
      if (recognitionRef.current && recognitionRef.current.stop) {
        recognitionRef.current.stop();
      }
      setIsListeningVoice(false);
      setVoiceFeedback(null);
      return;
    }

    const startSimulationMode = (reason?: string) => {
      setIsListeningVoice(true);
      setVoiceFeedback({ 
        message: reason ? `🎙️ ${reason} Say 'Bet 100 on Dragon'...` : "🎙️ Voice Bet: Say 'Bet 100 on Dragon'...", 
        type: "info" 
      });
      soundManager.playButtonClick();
      const simTimer = setTimeout(() => {
        const samples = [
          { side: "DRAGON", amount: 100, text: "Bet 100 on Dragon" },
          { side: "TIGER", amount: 250, text: "Bet 250 on Tiger" },
          { side: "DRAGON", amount: 500, text: "Dragon 500" },
        ];
        const chosen = samples[Math.floor(Math.random() * samples.length)];
        processVoiceCommand(chosen.text, chosen.side as any, chosen.amount);
      }, 3000);
      recognitionRef.current = { stop: () => clearTimeout(simTimer) };
    };

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      startSimulationMode();
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListeningVoice(true);
        setVoiceFeedback({ message: "🎙️ Listening... Speak your bet (e.g. 'Bet 100 on Dragon')", type: "info" });
        soundManager.playButtonClick();
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join("");
        setVoiceTranscript(transcript);

        if (event.results[0]?.isFinal) {
          parseAndExecuteVoiceCommand(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event?.error || "unknown";
        if (errType === "not-allowed" || errType === "service-not-allowed") {
          // Microphone access denied or not permitted in iframe sandbox -> switch gracefully to assisted mode
          startSimulationMode("Mic permission restricted.");
        } else if (errType === "no-speech" || errType === "aborted") {
          setIsListeningVoice(false);
          setVoiceFeedback(null);
        } else {
          setVoiceFeedback({ message: `Voice command unavailable (${errType}). Try again.`, type: "info" });
          setIsListeningVoice(false);
          setTimeout(() => setVoiceFeedback(null), 3000);
        }
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      startSimulationMode();
    }
  };

  const parseAndExecuteVoiceCommand = (transcript: string) => {
    const lower = transcript.toLowerCase();
    let side: "DRAGON" | "TIGER" | "TIE" | null = null;
    if (lower.includes("dragon")) side = "DRAGON";
    else if (lower.includes("tiger")) side = "TIGER";
    else if (lower.includes("tie")) side = "TIE";

    const numbers = lower.match(/\d+/);
    const amount = numbers ? Number(numbers[0]) : Math.round(selectedAmount * activeCurrency.rateFromBase);

    if (side && amount > 0) {
      processVoiceCommand(transcript, side, amount / activeCurrency.rateFromBase);
    } else {
      setVoiceFeedback({ message: `Could not parse: "${transcript}". Say 'Bet 100 on Dragon'.`, type: "error" });
      setTimeout(() => setVoiceFeedback(null), 4000);
    }
  };

  const processVoiceCommand = (transcript: string, side: "DRAGON" | "TIGER" | "TIE", baseAmount: number) => {
    setVoiceFeedback({ message: `🎙️ "${transcript}" → Placing ${formatAmt(baseAmount)} on ${side}!`, type: "success" });
    soundManager.playChip(1.2);
    if (side === "DRAGON" || side === "TIGER") {
      executeDirectBet(side, baseAmount);
    } else {
      executeDirectBet("DRAGON", baseAmount);
    }
    setTimeout(() => {
      setIsListeningVoice(false);
      setVoiceFeedback(null);
      setVoiceTranscript("");
    }, 3500);
  };

  // Direct 1-Tap Bet Execution
  const executeDirectBet = async (side: "DRAGON" | "TIGER", amount: number) => {
    if (!user || !user.userId) {
      alert("Every player must be logged in to place a bet. Please log in.");
      return;
    }
    if (amount <= 0) return;
    if (amount < activeLimits.minBet) {
      alert(`Minimum bet for this table is ${formatAmt(activeLimits.minBet)}.`);
      return;
    }
    if (amount > activeLimits.maxBet) {
      alert(`Maximum bet for this table is ${formatAmt(activeLimits.maxBet)}.`);
      return;
    }
    if (activeBalance < amount) {
      alert(`Your balance is ${formatAmt(activeBalance)}, so ${formatAmt(amount)} cannot be placed.`);
      return;
    }

    try {
      const res = await fetch("/api/game/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          tableSlug: selectedTableSlug,
          side: side.toLowerCase(),
          amount: amount,
          balanceType: user.balanceType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        soundManager.triggerCoinsClinking();
        setLastPlacedBet({ side, amount });
        setActiveConfirmedBet({
          id: data.bet?.id,
          side: side,
          amount: amount,
        });
        soundManager.announceBetAmount(amount, side);
        if (data.bet) {
          setCurrentRoundBets((prev) => [data.bet, ...prev.filter((b) => b.id !== data.bet.id)]);
        }
        fetch(`/api/wallet/${user.userId}`)
          .then((r) => r.json())
          .then((updated) => onUpdateWallet(updated));
      } else {
        alert(data.error || "Failed to confirm bet");
      }
    } catch {
      alert("Connection interrupted. Please verify your connection.");
    }
  };

  // Cancel Active Bet (1-Tap Refund)
  const handleCancelActiveBet = async () => {
    if (!activeConfirmedBet || cancelingBet) return;
    setCancelingBet(true);
    try {
      const res = await fetch("/api/game/cancel-bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          tableSlug: selectedTableSlug,
          betId: activeConfirmedBet.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        soundManager.playButtonClick();
        setActiveConfirmedBet(null);
        fetch(`/api/wallet/${user.userId}`)
          .then((r) => r.json())
          .then((updated) => onUpdateWallet(updated));
      } else {
        alert(data.error || "Could not cancel bet");
      }
    } catch {
      alert("Failed to cancel bet.");
    } finally {
      setCancelingBet(false);
    }
  };

  // 1-Tap Demo Balance Reset
  const handleResetDemoBalance = async () => {
    if (demoResetLoading) return;
    setDemoResetLoading(true);
    try {
      const res = await fetch(`/api/wallet/${user.userId}/reset-demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success && data.user) {
        soundManager.triggerCoinsClinking();
        onUpdateWallet(data.user);
      }
    } catch {
      alert("Failed to reset demo balance.");
    } finally {
      setDemoResetLoading(false);
    }
  };

  // Quick Action Buttons
  const handleFollowBet = (side: "dragon" | "tiger" | "tie", amount: number) => {
    if (side === "tie") {
      alert("Tie-তে বাজি ধরা যায় না। শুধুমাত্র Dragon বা Tiger বেছে নিন।");
      return;
    }
    const targetSide = side.toUpperCase() as "DRAGON" | "TIGER";
    setSelectedSide(targetSide);
    const clampedAmt = Math.max(activeLimits.minBet, Math.min(activeLimits.maxBet, amount));
    setSelectedAmount(clampedAmt);
    executeDirectBet(targetSide, clampedAmt);
  };

  const handleDoubleBet = () => {
    soundManager.playChipStack();
    const doubled = selectedAmount * 2;
    if (doubled > activeLimits.maxBet) {
      alert(`Cannot exceed table maximum limit of ৳${activeLimits.maxBet.toLocaleString()}.`);
      return;
    }
    if (activeBalance < doubled) {
      alert("Insufficient balance to double bet.");
      return;
    }
    setSelectedAmount(doubled);
  };

  const handleRepeatBet = () => {
    if (!lastPlacedBet) return;
    if (activeBalance < lastPlacedBet.amount) {
      alert("Insufficient balance to repeat previous bet.");
      return;
    }
    soundManager.playChipStack();
    setSelectedSide(lastPlacedBet.side);
    setSelectedAmount(lastPlacedBet.amount);
    executeDirectBet(lastPlacedBet.side, lastPlacedBet.amount);
  };

  // Timer visualization and Human-friendly Round Phase Labels
  const maxTimer = currentRound?.totalDuration || 30;
  const timeLeft = currentRound?.secondsRemaining ?? maxTimer;
  const strokeDash = 264;
  const strokeDashoffset = strokeDash - (strokeDash * timeLeft) / maxTimer;

  const getPhaseDisplay = () => {
    if (!currentRound) return { label: "WAITING...", color: "text-neutral-400" };
    if (currentRound.status === "BETTING") {
      if (timeLeft <= 5) {
        return { label: `5 SECONDS LEFT (${timeLeft}s)`, color: "text-red-400 animate-pulse" };
      }
      return { label: `BETTING OPEN (${timeLeft}s)`, color: "text-emerald-400" };
    }
    if (currentRound.status === "MATCHING") {
      return { label: "BETTING CLOSED · MATCHING", color: "text-amber-400" };
    }
    if (currentRound.status === "DEALING") {
      return { label: "REVEALING CARDS", color: "text-blue-400 animate-pulse" };
    }
    if (currentRound.status === "SETTLING") {
      return { label: "CALCULATING RESULT", color: "text-purple-400" };
    }
    return { label: currentRound.status, color: "text-neutral-400" };
  };

  const phaseInfo = getPhaseDisplay();

  const getDealerStatus = () => {
    if (!currentRound) return "SHUFFLING";
    switch (currentRound.status) {
      case "BETTING":
        return "WAITING FOR BETS";
      case "DEALING":
        return "DEALING...";
      case "SETTLING":
        return "SHUFFLING";
      default:
        return "READY";
    }
  };

  // Matched calculation for active bet
  const currentDragonPool = currentRound?.dragonPool || 0;
  const currentTigerPool = currentRound?.tigerPool || 0;
  const currentMatchedPool = currentRound?.matchedAmount || 0;

  const userActiveSidePool =
    activeConfirmedBet?.side === "DRAGON" ? currentDragonPool : currentTigerPool;
  const userOpposingSidePool =
    activeConfirmedBet?.side === "DRAGON" ? currentTigerPool : currentDragonPool;

  let userMatchedPortion = 0;
  let userWaitingPortion = 0;
  let matchPercentage = 100;

  if (activeConfirmedBet) {
    if (userActiveSidePool <= userOpposingSidePool) {
      userMatchedPortion = activeConfirmedBet.amount;
      userWaitingPortion = 0;
      matchPercentage = 100;
    } else {
      const matchRatio = userActiveSidePool > 0 ? userOpposingSidePool / userActiveSidePool : 1;
      userMatchedPortion = Math.floor(activeConfirmedBet.amount * matchRatio);
      userWaitingPortion = activeConfirmedBet.amount - userMatchedPortion;
      matchPercentage = Math.round(matchRatio * 100);
    }
  }

  // Validity checks for Place Bet button
  const isValidAmount =
    selectedAmount >= activeLimits.minBet && selectedAmount <= activeLimits.maxBet;
  const hasSufficientBalance = activeBalance >= selectedAmount;
  const isBettingOpen = currentRound?.status === "BETTING";
  const canPlaceBet = selectedSide && isValidAmount && hasSufficientBalance && isBettingOpen;

  return (
    <div className="w-full h-full flex-1 min-h-0 text-neutral-200 font-sans selection:bg-amber-500/30 overflow-hidden relative flex flex-col justify-between select-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a1a] via-black to-black">
      {/* Rules & Transparency Modal */}
      <AnimatePresence>
        {showRulesSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl w-full smart-glass rounded-[40px] p-8 relative overflow-hidden border-white/10"
            >
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                        <ShieldCheck className="w-6 h-6 text-violet-400" />
                     </div>
                     <h2 className="text-xl font-bold tracking-tight text-white uppercase">Fairness Decree</h2>
                  </div>
                  <button onClick={() => setShowRulesSheet(false)} className="p-2 rounded-full hover:bg-white/5 transition-colors"><X className="w-6 h-6 text-neutral-500" /></button>
               </div>
               
               <div className="space-y-6 text-sm text-neutral-400 leading-relaxed">
                  <p>Our P2P matching engine ensures players wager against players. The house retains a 5% commission on winning stakes to maintain the sanctum.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="block font-bold text-violet-400 mb-1">TIE REBATE</span>
                      <p>Matched bets are forfeited in a tie. Unmatched funds return to your treasury.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="block font-bold text-cyan-400 mb-1">DIVINE PROOF</span>
                      <p>Every hand is cryptographically sealed and verifiable.</p>
                    </div>
                  </div>
                  <button onClick={onOpenProvablyFair} className="w-full py-4 rounded-2xl bg-violet-500 text-white font-bold hover:bg-violet-600 transition-all shadow-lg shadow-violet-500/20">Verify Protocol</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation Sidebar */}
      <AnimatePresence>
        {showSidebarMobile && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed inset-y-0 right-0 z-[120] w-[80%] max-w-sm smart-glass border-l border-white/5 p-6 lg:hidden flex flex-col gap-6 shadow-2xl"
          >
             <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Live Insights</span>
                <button onClick={() => setShowSidebarMobile(false)} className="p-2 rounded-xl bg-white/5 text-neutral-400"><X className="w-5 h-5" /></button>
             </div>
             
             <div className="flex-1 overflow-hidden flex flex-col gap-4">
                <div className="flex gap-1 p-1 bg-black/40 rounded-2xl border border-white/5">
                   {['liveAction', 'chat', 'roadmap'].map((t) => (
                     <button
                       key={t}
                       onClick={() => setSidebarTab(t as any)}
                       className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                         sidebarTab === t ? "bg-white/10 text-white" : "text-neutral-500"
                       }`}
                     >
                       {t.replace('liveAction', 'Activity').replace('chat', 'Social').replace('roadmap', 'Data')}
                     </button>
                   ))}
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                   {sidebarTab === 'liveAction' && <LiveAction currentRoundBets={currentRoundBets} currentUser={user} roundNumber={currentRound?.roundNumber} onFollowBet={handleFollowBet} />}
                   {sidebarTab === 'chat' && <LiveChat username={user.username} />}
                   {sidebarTab === 'roadmap' && (
                     <div className="grid grid-cols-6 gap-2 pt-2">
                        {roadmap.slice(-42).map((r, i) => (
                          <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold border border-white/5 ${
                             r.result === "DRAGON" ? "bg-violet-500/20 text-violet-400" : 
                             r.result === "TIGER" ? "bg-cyan-500/20 text-cyan-400" : "bg-neutral-500/20 text-neutral-400"
                          }`}>{r.result.charAt(0)}</div>
                        ))}
                     </div>
                   )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Floating Coins / Particle Celebration Overlay */}
      <AnimatePresence>
        {showWinCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[100] overflow-hidden flex items-center justify-center bg-amber-500/5 backdrop-blur-[2px]"
          >
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: 120,
                  x: (Math.random() - 0.5) * 400,
                  scale: 0.4,
                  opacity: 1,
                  rotate: 0,
                }}
                animate={{
                  y: -400 - Math.random() * 200,
                  x: (Math.random() - 0.5) * 600,
                  scale: [0.4, 1.5, 0.8],
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 720,
                }}
                transition={{
                  duration: 2.5 + Math.random() * 1.5,
                  ease: "easeOut",
                  delay: Math.random() * 0.5,
                }}
                className="absolute text-3xl font-black text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,1)]"
              >
                🪙
              </motion.div>
            ))}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: [0.5, 1.15, 1], opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="px-10 py-6 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 text-neutral-950 font-black text-3xl sm:text-4xl rounded-[32px] shadow-[0_0_80px_rgba(251,191,36,0.8)] border-4 border-amber-200/50 flex flex-col items-center gap-1 z-50"
            >
              <Sparkles className="w-10 h-10 mb-2 animate-spin-slow" />
              <span>VICTORY REVEALED</span>
              <span className="text-sm font-black opacity-60 tracking-[0.3em]">YOU ARE THE CHAMPION</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recognition Floating Feedback Banner */}
      <AnimatePresence>
        {(isListeningVoice || voiceFeedback) && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[110] bg-black/90 backdrop-blur-2xl border-2 border-red-500/80 rounded-2xl px-6 py-3 shadow-[0_10px_40px_rgba(239,68,68,0.5)] flex items-center gap-3 text-white pointer-events-auto"
          >
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider text-red-400">
                🎙️ Voice Betting Assistant
              </span>
              <span className="text-sm font-mono font-bold text-amber-300">
                {voiceFeedback ? voiceFeedback.message : voiceTranscript ? `"${voiceTranscript}"` : "Listening... Say 'Bet 100 on Dragon'"}
              </span>
            </div>
            <button
              onClick={() => {
                if (recognitionRef.current && recognitionRef.current.stop) recognitionRef.current.stop();
                setIsListeningVoice(false);
                setVoiceFeedback(null);
              }}
              className="ml-3 p-1 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        ref={gameContainerRef}
        className="w-full h-full flex-1 flex flex-col items-center justify-between p-1 sm:p-2.5 md:p-3.5 lg:p-4 relative overflow-hidden select-none box-border"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, rgba(20, 5, 5, 0.3) 0%, rgba(5, 2, 2, 0.92) 100%), url(${virtualCasinoBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >

        {/* SETTINGS MODAL (Screenshot 1 Exact Implementation) */}
        <AnimatePresence>
          {showSettingsModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed inset-x-3 top-14 sm:absolute sm:inset-auto sm:top-16 sm:right-4 z-50 w-auto max-w-sm sm:w-80 bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-neutral-200 select-none mx-auto sm:mx-0"
            >
               {/* Header Tabs & Close Button */}
               <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-sm font-black text-white">Settings</span>
                  <div className="flex items-center gap-1 bg-black/60 rounded-xl p-1 border border-white/5">
                     <button
                       onClick={() => setSettingsTab("settings")}
                       className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                         settingsTab === "settings" ? "bg-white/10 text-white shadow" : "text-neutral-500 hover:text-neutral-300"
                       }`}
                     >
                       Settings
                     </button>
                     <button
                       onClick={() => setSettingsTab("mute")}
                       className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                         settingsTab === "mute" ? "bg-white/10 text-white shadow" : "text-neutral-500 hover:text-neutral-300"
                       }`}
                     >
                       Mute
                     </button>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
               </div>

               {/* Settings Controls */}
               <div className="space-y-4 py-4 text-xs font-medium">
                  {/* Sound Toggle */}
                  <div className="flex items-center justify-between">
                     <span className="text-neutral-300">Sound</span>
                     <button
                       onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                       className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                         isSoundEnabled ? "bg-amber-500 justify-end" : "bg-neutral-800 justify-start"
                       }`}
                     >
                       <span className="w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform" />
                     </button>
                  </div>

                  {/* Volume Slider */}
                  <div className="space-y-1.5">
                     <span className="text-neutral-300 block">Volume</span>
                     <div className="flex items-center gap-3 bg-amber-600/90 rounded-xl px-3 py-2">
                        <Volume2 className="w-4 h-4 text-neutral-950 shrink-0" />
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={volumeLevel} 
                          onChange={(e) => setVolumeLevel(Number(e.target.value))}
                          className="w-full accent-amber-300 cursor-pointer h-1.5 bg-black/30 rounded-lg" 
                        />
                     </div>
                  </div>

                  {/* Show Winner List Toggle */}
                  <div className="flex items-center justify-between pt-2">
                     <span className="text-neutral-300">Show winner list</span>
                     <button
                       onClick={() => setShowWinnerList(!showWinnerList)}
                       className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                         showWinnerList ? "bg-amber-500 justify-end" : "bg-neutral-800 justify-start"
                       }`}
                     >
                       <span className="w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform" />
                     </button>
                  </div>

                  {/* Show Other Players Reactions Toggle */}
                  <div className="flex items-center justify-between">
                     <span className="text-neutral-300">Show other players reactions</span>
                     <button
                       onClick={() => setShowOtherReactions(!showOtherReactions)}
                       className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                         showOtherReactions ? "bg-amber-500 justify-end" : "bg-neutral-800 justify-start"
                       }`}
                     >
                       <span className="w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform" />
                     </button>
                  </div>
               </div>

               {/* Footer Version Details */}
               <div className="pt-3 border-t border-white/10 text-[9px] font-mono text-neutral-500 space-y-0.5">
                  <p>Virtual Dragon Tiger version 1.0</p>
                  <p>Client version 26.31.0-4</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MY BETS / HISTORY MODAL (Screenshot 2 Exact Implementation) */}
        <AnimatePresence>
          {showHistoryModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed inset-x-3 top-14 sm:absolute sm:inset-auto sm:top-16 sm:right-4 z-50 w-auto max-w-md sm:w-96 bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-neutral-200 select-none mx-auto sm:mx-0"
            >
               {/* Header Tabs & Close */}
               <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-sm font-black text-white">My bets</span>
                  <div className="flex items-center gap-1 bg-black/60 rounded-xl p-1 border border-white/5">
                     <button
                       onClick={() => setHistoryTab("myBets")}
                       className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                         historyTab === "myBets" ? "bg-white/10 text-white shadow" : "text-neutral-500 hover:text-neutral-300"
                       }`}
                     >
                       My bets
                     </button>
                     <button
                       onClick={() => setHistoryTab("history")}
                       className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                         historyTab === "history" ? "bg-white/10 text-white shadow" : "text-neutral-500 hover:text-neutral-300"
                       }`}
                     >
                       History
                     </button>
                     <button
                       onClick={() => setHistoryTab("mute")}
                       className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                         historyTab === "mute" ? "bg-white/10 text-white shadow" : "text-neutral-500 hover:text-neutral-300"
                       }`}
                     >
                       Mute
                     </button>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
               </div>

               {/* Table Columns */}
               <div className="grid grid-cols-4 text-[10px] font-black text-neutral-400 uppercase tracking-wider py-2.5 border-b border-white/5 font-mono">
                  <span>Date</span>
                  <span>Game</span>
                  <span className="text-right">€ Bet</span>
                  <span className="text-right">€ Result</span>
               </div>

               {/* Bets List / Empty State */}
               <div className="min-h-[160px] max-h-[240px] overflow-y-auto no-scrollbar py-4 flex flex-col items-center justify-center">
                  {recentSettledBets.length > 0 ? (
                    <div className="w-full space-y-2 text-xs font-mono">
                       {recentSettledBets.slice(0, 8).map((b, i) => (
                         <div key={i} className="grid grid-cols-4 items-center text-[11px] py-1 border-b border-white/5">
                            <span className="text-neutral-400">{new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="font-bold text-amber-400">{b.side}</span>
                            <span className="text-right font-mono">{formatAmt(b.amount)}</span>
                            <span className={`text-right font-mono font-black ${(b.payout ?? 0) > 0 ? "text-emerald-400" : "text-neutral-500"}`}>
                              {(b.payout ?? 0) > 0 ? `+${formatAmt(b.payout)}` : "0"}
                            </span>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-neutral-500">No results</span>
                  )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CENTER LAYER: 3D PERSPECTIVE OVAL CASINO TABLE & REAL CARDS */}
        <div className="relative w-full flex-1 min-h-0 flex items-center justify-center my-auto py-1 sm:py-2 overflow-hidden">
           
           {/* 3D OVAL TABLE CONTAINER - Responsive to Screen Resolution */}
           <div className="relative w-full max-w-4xl lg:max-w-5xl h-full max-h-[32vh] sm:max-h-[44vh] lg:max-h-[48vh] aspect-[2.1/1] sm:aspect-[2.35/1] flex items-center justify-center select-none">
              
              {/* Carved Luxury Metallic Pedestal Base */}
              <div 
                className="absolute -bottom-6 sm:-bottom-8 w-[90%] max-w-3xl h-16 sm:h-24 rounded-b-[90px] sm:rounded-b-[130px] border-x-2 sm:border-x-4 border-b-2 sm:border-b-4 border-amber-600/40 shadow-[0_45px_90px_rgba(0,0,0,0.98)] overflow-hidden pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at 50% 0%, #2a221b 0%, #15110d 50%, #080605 100%)",
                }}
              >
                 {/* Traditional Golden Engraved Pattern Trim */}
                 <div className="absolute inset-x-0 top-1.5 sm:top-2 h-10 opacity-35 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/25 via-amber-200/10 to-transparent flex items-center justify-center">
                    <span className="text-[10px] sm:text-[11px] font-mono tracking-[1.2em] sm:tracking-[1.5em] text-amber-300 uppercase select-none drop-shadow">
                      ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖
                    </span>
                 </div>
              </div>

              {/* Main Oval Table Felt with Deep Mahogany Wood Rim & Brass Inlays */}
              <div 
                className="relative w-full h-full rounded-[100px] sm:rounded-[200px] lg:rounded-[240px] overflow-hidden flex flex-col items-center justify-between p-2 sm:p-5 transition-all"
                style={{
                  background: "radial-gradient(ellipse at 50% 36%, #c51d1d 0%, #991b1b 38%, #751414 72%, #380707 100%)",
                  border: "10px sm:border-[13px] solid #1f0d06",
                  boxShadow: "inset 0 0 80px rgba(0,0,0,0.85), 0 25px 60px rgba(0,0,0,0.95), 0 0 0 2px #d97706, 0 0 0 4px #78350f, 0 0 35px rgba(185,28,28,0.35)",
                }}
              >
                 {/* Felt Overhead Soft Spotlight */}
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.25)_0%,transparent_65%)] pointer-events-none" />

                 {/* TOP SECTION: BURN CARD (LEFT) & DECK SHOE (CENTER) */}
                 <div 
                   className="w-full flex items-start justify-between relative z-10 px-8 sm:px-16 pt-1 transition-transform duration-150"
                   style={{
                     transform: `scale(${Math.min(cardScale, 1)})`,
                     transformOrigin: "top center",
                   }}
                 >
                    
                    {/* Top-Left: Face-down Burn / Discard Card with Criss-Cross Pattern */}
                    <div className="w-10 h-15 sm:w-13 sm:h-18 rounded-lg bg-neutral-900 border-2 border-amber-400/80 shadow-2xl rotate-[-15deg] overflow-hidden relative flex items-center justify-center transition-transform hover:rotate-[-12deg]">
                       {/* Criss-Cross Diamond Card Back Pattern */}
                       <div 
                         className="absolute inset-0 opacity-85" 
                         style={{
                           backgroundImage: `repeating-linear-gradient(45deg, #0f0f0f 0, #0f0f0f 2px, #c5a880 0, #c5a880 3px), repeating-linear-gradient(-45deg, #0f0f0f 0, #0f0f0f 2px, #c5a880 0, #c5a880 3px)`,
                         }}
                       />
                       <div className="absolute inset-1 rounded border border-amber-200/50 pointer-events-none" />
                    </div>

                    {/* Top-Center: Live Dealing Deck Shoe */}
                    <div className="relative flex flex-col items-center group">
                       <div className="w-13 h-17 sm:w-16 sm:h-20 rounded-lg bg-neutral-900 border-2 border-amber-400/90 shadow-[0_10px_25px_rgba(0,0,0,0.9)] overflow-hidden relative flex items-center justify-center">
                          {/* Criss-Cross Diamond Card Back Pattern */}
                          <div 
                            className="absolute inset-0 opacity-85" 
                            style={{
                              backgroundImage: `repeating-linear-gradient(45deg, #0f0f0f 0, #0f0f0f 2px, #c5a880 0, #c5a880 3px), repeating-linear-gradient(-45deg, #0f0f0f 0, #0f0f0f 2px, #c5a880 0, #c5a880 3px)`,
                            }}
                          />
                          <div className="absolute inset-1 rounded border border-amber-200/50 pointer-events-none" />
                       </div>
                       {/* Stack Depth Layers */}
                       <div className="w-12 h-1 bg-amber-200/90 rounded-b shadow -mt-0.5" />
                       <div className="w-11 h-1 bg-neutral-400 rounded-b shadow -mt-0.5" />
                       <div className="w-10 h-1 bg-neutral-600 rounded-b shadow -mt-0.5" />
                    </div>

                    {/* Top-Right Spacer */}
                    <div className="w-10 h-15 sm:w-13 sm:h-18 opacity-0" />
                 </div>

                 {/* GOLDEN CHINESE DRAGON ETCHING (LEFT FELT) */}
                 <div className="absolute left-4 sm:left-12 top-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 opacity-35 pointer-events-none select-none">
                    <svg viewBox="0 0 200 200" className="w-full h-full text-amber-300 stroke-current fill-none stroke-[1.5] filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                      <path d="M40,100 C60,40 140,40 160,100 C180,160 100,180 60,140 C40,120 70,80 100,80 C130,80 140,110 120,130 C100,150 80,130 90,110" />
                      <circle cx="100" cy="80" r="15" />
                      <path d="M85,75 Q90,65 100,75 Q110,65 115,75" />
                      <path d="M30,120 Q10,100 30,80 Q50,90 30,120" />
                      <path d="M170,120 Q190,100 170,80 Q150,90 170,120" />
                    </svg>
                 </div>

                 {/* GOLDEN CHINESE TIGER ETCHING (RIGHT FELT) */}
                 <div className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 opacity-35 pointer-events-none select-none">
                    <svg viewBox="0 0 200 200" className="w-full h-full text-amber-300 stroke-current fill-none stroke-[1.5] filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                      <circle cx="100" cy="100" r="50" />
                      <path d="M70,80 Q100,120 130,80" />
                      <path d="M80,110 L120,110" />
                      <path d="M90,130 L110,130" />
                      <path d="M60,60 Q70,40 90,55" />
                      <path d="M140,60 Q130,40 110,55" />
                      <path d="M60,140 C80,170 120,170 140,140" />
                    </svg>
                 </div>

                 {/* DEALT PLAYING CARDS & DEDICATED FELT BOXES (Centerstage) */}
                 <div 
                   className="relative z-20 flex items-center justify-center gap-5 sm:gap-14 md:gap-20 my-auto transition-transform duration-150"
                   style={{
                     transform: `scale(${cardScale})`,
                     transformOrigin: "center center",
                   }}
                 >
                    {/* DRAGON FELT CARD BOX */}
                    <div className="flex flex-col items-center gap-1">
                       <motion.div
                         onClick={() => handleSelectSide("DRAGON")}
                         whileHover={{ scale: 1.04 }}
                         whileTap={{ scale: 0.96 }}
                         className={`relative w-20 h-28 sm:w-24 sm:h-34 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 ${
                           currentRound?.result === "DRAGON" && (currentRound.status === "SETTLING" || currentRound.status === "COMPLETED")
                             ? "ring-4 ring-red-500 shadow-[0_0_40px_rgba(239,68,68,0.95)] bg-red-950/40"
                             : selectedSide === "DRAGON"
                             ? "ring-4 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.85)] bg-amber-950/30"
                             : "border-2 border-amber-400/60 bg-black/50 hover:border-amber-300 hover:bg-black/60 shadow-inner"
                         }`}
                         style={{
                           boxShadow: currentRound?.result === "DRAGON" ? "0 0 40px rgba(239,68,68,0.9), inset 0 0 25px rgba(239,68,68,0.5)" : "inset 0 0 20px rgba(0,0,0,0.85)",
                         }}
                       >
                          {/* Inner Felt Golden Border Line */}
                          <div className="absolute inset-1.5 rounded-xl border border-amber-400/35 pointer-events-none" />

                          {currentRound?.dragonCard ? (
                            <PlayingCardComponent 
                              card={currentRound.dragonCard} 
                              side="DRAGON" 
                              isWinner={currentRound.result === "DRAGON"} 
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
                               <span className="text-3xl sm:text-4xl filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">🐉</span>
                               <span className="text-[10px] font-black text-amber-200 tracking-wider mt-1 uppercase font-mono">DRAGON</span>
                               <span className="text-[9px] font-bold text-amber-400/80 font-mono">1:1</span>
                            </div>
                          )}
                       </motion.div>
                       <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-amber-300 uppercase drop-shadow font-mono flex items-center gap-1">
                         <span>DRAGON</span>
                       </span>
                    </div>

                    {/* TABLE CENTER: TIMER OR 'NO MORE BETS' */}
                    <div className="relative z-20 flex flex-col items-center justify-center min-w-[70px]">
                      {currentRound?.status === "BETTING" ? (
                        <>
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                             <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" stroke="rgba(0,0,0,0.65)" strokeWidth="8" fill="rgba(10,5,5,0.85)" />
                                <circle
                                  cx="50" cy="50" r="42"
                                  stroke={timeLeft <= 5 ? "#ef4444" : "#84cc16"}
                                  strokeWidth="8"
                                  strokeDasharray="264"
                                  strokeDashoffset={264 - (264 * timeLeft) / maxTimer}
                                  strokeLinecap="round"
                                  fill="transparent"
                                  className="transition-all duration-1000 ease-linear drop-shadow-[0_0_12px_rgba(132,204,22,0.9)]"
                                />
                             </svg>
                             <span className={`absolute text-base sm:text-lg font-black font-mono tabular-nums drop-shadow ${timeLeft <= 5 ? "text-red-400 animate-pulse scale-110" : "text-white"}`}>
                               {timeLeft}
                             </span>
                          </div>
                          <span className="text-[8px] font-black text-neutral-200 uppercase tracking-widest mt-1 opacity-90 drop-shadow">
                            BETTING
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center py-1">
                          <span className="px-2.5 py-1 rounded-full bg-black/80 border border-amber-400/40 text-[11px] sm:text-xs font-black text-amber-300 uppercase tracking-wider shadow-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] whitespace-nowrap">
                            No more bets
                          </span>
                          <span className="text-[8px] font-bold text-amber-200 uppercase tracking-widest mt-1">
                            {currentRound?.status === "DEALING" ? "Dealing" : "Settling"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* TIGER FELT CARD BOX */}
                    <div className="flex flex-col items-center gap-1">
                       <motion.div
                         onClick={() => handleSelectSide("TIGER")}
                         whileHover={{ scale: 1.04 }}
                         whileTap={{ scale: 0.96 }}
                         className={`relative w-20 h-28 sm:w-24 sm:h-34 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 ${
                           currentRound?.result === "TIGER" && (currentRound.status === "SETTLING" || currentRound.status === "COMPLETED")
                             ? "ring-4 ring-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.95)] bg-amber-950/40"
                             : selectedSide === "TIGER"
                             ? "ring-4 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.85)] bg-amber-950/30"
                             : "border-2 border-amber-400/60 bg-black/50 hover:border-amber-300 hover:bg-black/60 shadow-inner"
                         }`}
                         style={{
                           boxShadow: currentRound?.result === "TIGER" ? "0 0 40px rgba(245,158,11,0.9), inset 0 0 25px rgba(245,158,11,0.5)" : "inset 0 0 20px rgba(0,0,0,0.85)",
                         }}
                       >
                          {/* Inner Felt Golden Border Line */}
                          <div className="absolute inset-1.5 rounded-xl border border-amber-400/35 pointer-events-none" />

                          {currentRound?.tigerCard ? (
                            <PlayingCardComponent 
                              card={currentRound.tigerCard} 
                              side="TIGER" 
                              isWinner={currentRound.result === "TIGER"} 
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
                               <span className="text-3xl sm:text-4xl filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">🐯</span>
                               <span className="text-[10px] font-black text-amber-200 tracking-wider mt-1 uppercase font-mono">TIGER</span>
                               <span className="text-[9px] font-bold text-amber-400/80 font-mono">1:1</span>
                            </div>
                          )}
                       </motion.div>
                       <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-amber-300 uppercase drop-shadow font-mono flex items-center gap-1">
                         <span>TIGER</span>
                       </span>
                    </div>
                 </div>

              </div>
           </div>
        </div>

        {/* BOTTOM LAYER: ICONIC21 INTEGRATED HUD CONSOLE */}
        <div className="relative z-30 w-full shrink-0 flex flex-col lg:flex-row items-stretch gap-1 sm:gap-2 bg-black/85 backdrop-blur-2xl p-1 sm:p-2 pb-14 sm:pb-2 rounded-2xl border border-white/10 shadow-2xl touch-manipulation">
           
           {/* LEFT: ROADMAP MATRIX (Bead Road & Big Road) */}
           <div className="w-full lg:w-[170px] xl:w-[200px] shrink-0 flex flex-col justify-between bg-black/90 backdrop-blur-xl p-1 sm:p-2 rounded-xl border border-white/10 shadow-lg sticky top-1 transition-all overflow-hidden">
              {/* Header Stats Counter */}
              <div className="flex items-center justify-between pb-1 sm:pb-1.5 border-b border-white/10 text-xs font-mono font-bold">
                 <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="text-amber-400 font-black tracking-tight text-[10px] sm:text-xs">
                      #{currentRound?.roundNumber || 96}
                    </span>
                    <button
                      onClick={() => setShowRoadmapPanel(!showRoadmapPanel)}
                      className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[9px] text-amber-300 font-mono active:scale-95 transition-all cursor-pointer flex items-center gap-0.5"
                      title={showRoadmapPanel ? "Collapse Roadmap Matrix" : "Expand Roadmap Matrix"}
                    >
                      <span className="text-[8px]">{showRoadmapPanel ? "▲" : "▼"}</span>
                      <span className="text-[8px] uppercase tracking-wider hidden xs:inline">Road</span>
                    </button>
                 </div>
                 <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-red-300 bg-red-950/80 border border-red-500/30 px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-0.5 sm:gap-1 font-bold text-[8px] sm:text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
                      {roadmap.filter(r => r.result === "DRAGON").length || 47}
                    </span>
                    <span className="text-amber-300 bg-amber-950/80 border border-amber-500/30 px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-0.5 sm:gap-1 font-bold text-[8px] sm:text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
                      {roadmap.filter(r => r.result === "TIGER").length || 45}
                    </span>
                    <span className="text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-0.5 sm:gap-1 font-bold text-[8px] sm:text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                      {roadmap.filter(r => r.result === "TIE").length || 4}
                    </span>
                 </div>
              </div>

              {/* Collapsible Roadmap Grids with Auto-Scroll to Latest Results */}
              {showRoadmapPanel && (
                <div ref={roadmapScrollRef} className="my-1 sm:my-1.5 overflow-x-auto no-scrollbar scroll-smooth">
                  {/* Upper Grid: Bead Road (6 rows) */}
                  <div className="grid grid-rows-6 grid-flow-col gap-0.5 sm:gap-1 py-0.5 min-w-max">
                     {Array.from({ length: 36 }).map((_, i) => {
                        const r = roadmap[roadmap.length - 36 + i];
                        const res = r?.result;
                        return (
                          <div
                            key={i}
                            className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center text-[7px] sm:text-[8px] font-black transition-all ${
                              res === "DRAGON"
                                ? "bg-gradient-to-br from-red-600 to-red-800 text-white border border-red-400/80 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                                : res === "TIGER"
                                ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-neutral-950 border border-amber-300/80 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                                : res === "TIE"
                                ? "bg-gradient-to-br from-teal-400 to-cyan-600 text-neutral-950 border border-cyan-300/80 shadow-[0_0_6px_rgba(6,182,212,0.5)]"
                                : "bg-white/[0.04] border border-white/[0.06] text-transparent"
                            }`}
                          >
                             {res ? res.charAt(0) : ""}
                          </div>
                        );
                     })}
                  </div>

                  {/* Lower Grid: Big Road (Hollow streak rings) */}
                  <div className="grid grid-rows-4 grid-flow-col gap-0.5 sm:gap-1 pt-1 sm:pt-1.5 border-t border-white/10 min-w-max">
                     {Array.from({ length: 36 }).map((_, i) => {
                        const r = roadmap[roadmap.length - 36 + i];
                        const res = r?.result;
                        return (
                          <div key={i} className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center bg-white/[0.02] rounded-sm">
                             {res === "DRAGON" && <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 border-red-500 shadow-[0_0_4px_rgba(239,68,68,0.4)]" />}
                             {res === "TIGER" && <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 border-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.4)]" />}
                             {res === "TIE" && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.6)]" />}
                          </div>
                        );
                     })}
                  </div>
                </div>
              )}
           </div>

           {/* CENTER: ICONIC21 DRAGON TIGER BETTING BOARD + CHIPS CAROUSEL */}
           <div className="flex-1 flex flex-col gap-1 sm:gap-2">
              
              {/* UPPER SECTION: DRAGON (Left) | TIE / SUITED TIE (Center) | TIGER (Right) */}
              <div className="grid grid-cols-12 gap-1 sm:gap-2 items-stretch">
                 
                 {/* DRAGON TAB (5 cols) */}
                 <motion.button
                   whileHover={{ scale: 1.01 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => handleSelectSide("DRAGON")}
                   className={`col-span-5 relative rounded-xl p-1.5 sm:p-3 flex flex-col justify-between border-2 transition-all cursor-pointer overflow-hidden select-none ${
                     selectedSide === "DRAGON"
                       ? "bg-gradient-to-r from-red-700 via-red-800 to-red-900 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)] text-white"
                       : "bg-gradient-to-r from-red-950/80 to-red-900/50 border-red-700/40 text-red-200 hover:border-red-400"
                   }`}
                 >
                    {/* Top Stats Line: Percentage, Total Bet, Player count */}
                    <div className="flex items-center justify-between w-full text-[8px] sm:text-[9px] font-bold font-mono opacity-80">
                       <span className="px-1 py-0.5 rounded bg-black/40 text-white text-[7px] sm:text-[8px]">100%</span>
                       <div className="flex items-center gap-1 sm:gap-2">
                          <span>🪙 {formatAmt(currentDragonPool, true)}</span>
                          <span className="hidden xs:inline">👤 1</span>
                       </div>
                    </div>

                    {/* Center: Placed Casino Chip or Dragon Icon */}
                    <div className="my-0.5 sm:my-1.5 flex items-center justify-center relative">
                       {activeConfirmedBet?.side === "DRAGON" ? (
                         <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-500 via-white to-red-600 border-2 border-red-900 shadow-[0_0_15px_rgba(239,68,68,0.9)] flex items-center justify-center font-black text-[8px] sm:text-[9px] text-neutral-950 font-mono animate-pulse">
                            {formatAmt(activeConfirmedBet.amount, true)}
                         </div>
                       ) : (
                         <span className="text-base sm:text-xl">🐉</span>
                       )}

                       {/* Mini Dealt Card Attached to Right of Dragon Tab */}
                       {currentRound?.dragonCard && (
                         <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white text-neutral-950 font-black px-1 py-0.5 rounded shadow text-[10px] sm:text-xs font-mono border border-neutral-300">
                            {currentRound.dragonCard.display}
                         </div>
                       )}
                    </div>

                    {/* Bottom: Title & Payout */}
                    <div className="flex items-center justify-between w-full">
                       <span className="text-[11px] sm:text-sm font-black tracking-wider uppercase">DRAGON</span>
                       <span className="text-[9px] sm:text-[10px] font-bold font-mono text-red-300">1:1</span>
                    </div>
                 </motion.button>

                 {/* TIE & SUITED TIE (Center 2 cols) */}
                 <div className="col-span-2 flex flex-col items-center justify-center gap-0.5 sm:gap-1 bg-gradient-to-b from-teal-800/80 to-teal-950/80 rounded-xl border border-teal-400/40 p-1 sm:p-1.5 shadow-inner select-none">
                    <div className="text-center leading-none">
                       <span className="text-[7px] sm:text-[8px] font-bold text-teal-300 font-mono">11:1</span>
                       <span className="text-[8px] sm:text-[9px] font-black text-teal-200 block uppercase">TIE</span>
                    </div>

                    {/* 0% Center Pill */}
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-teal-950 border border-teal-400/60 flex items-center justify-center text-[6px] sm:text-[7px] font-black text-teal-300">
                       0%
                    </div>

                    <div className="text-center leading-none">
                       <span className="text-[6px] sm:text-[7px] font-black text-teal-300 block uppercase">SUITED</span>
                       <span className="text-[7px] sm:text-[8px] font-bold text-teal-400 font-mono">50:1</span>
                    </div>
                 </div>

                 {/* TIGER TAB (5 cols) */}
                 <motion.button
                   whileHover={{ scale: 1.01 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => handleSelectSide("TIGER")}
                   className={`col-span-5 relative rounded-xl p-1.5 sm:p-3 flex flex-col justify-between border-2 transition-all cursor-pointer overflow-hidden select-none ${
                     selectedSide === "TIGER"
                       ? "bg-gradient-to-r from-amber-700 via-amber-800 to-yellow-900 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)] text-white"
                       : "bg-gradient-to-r from-amber-950/80 to-yellow-950/50 border-amber-700/40 text-amber-200 hover:border-amber-400"
                   }`}
                 >
                    {/* Top Stats Line: Percentage, Total Bet, Player count */}
                    <div className="flex items-center justify-between w-full text-[8px] sm:text-[9px] font-bold font-mono opacity-80">
                       <div className="flex items-center gap-1 sm:gap-2">
                          <span>🪙 {formatAmt(currentTigerPool, true)}</span>
                          <span className="hidden xs:inline">👤 0</span>
                       </div>
                       <span className="px-1 py-0.5 rounded bg-black/40 text-white text-[7px] sm:text-[8px]">0%</span>
                    </div>

                    {/* Center: Placed Casino Chip or Tiger Icon */}
                    <div className="my-0.5 sm:my-1.5 flex items-center justify-center relative">
                       {/* Mini Dealt Card Attached to Left of Tiger Tab */}
                       {currentRound?.tigerCard && (
                         <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-white text-neutral-950 font-black px-1 py-0.5 rounded shadow text-[10px] sm:text-xs font-mono border border-neutral-300">
                            {currentRound.tigerCard.display}
                         </div>
                       )}

                       {activeConfirmedBet?.side === "TIGER" ? (
                         <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 via-white to-yellow-600 border-2 border-amber-900 shadow-[0_0_15px_rgba(245,158,11,0.9)] flex items-center justify-center font-black text-[8px] sm:text-[9px] text-neutral-950 font-mono animate-pulse">
                            {formatAmt(activeConfirmedBet.amount, true)}
                         </div>
                       ) : (
                         <span className="text-base sm:text-xl">🐯</span>
                       )}
                    </div>

                    {/* Bottom: Title & Payout */}
                    <div className="flex items-center justify-between w-full">
                       <span className="text-[9px] sm:text-[10px] font-bold font-mono text-amber-300">1:1</span>
                       <span className="text-[11px] sm:text-sm font-black tracking-wider uppercase">TIGER</span>
                    </div>
                 </motion.button>

              </div>

              {/* LOWER SECTION: SIDE BETS ROW (8 Pill Buttons) */}
              <div className="grid grid-cols-8 gap-0.5 sm:gap-1 text-[7px] sm:text-[9px] font-black font-mono select-none">
                 {/* Dragon Side Bets */}
                 <button onClick={() => { setSelectedSide("DRAGON"); }} className="py-0.5 sm:py-1 px-0.5 rounded-md sm:rounded-lg bg-red-950/60 hover:bg-red-900/80 active:scale-95 border border-red-700/40 text-red-300 text-center uppercase tracking-tighter transition-transform">
                   EVEN <span className="block text-[6px] sm:text-[7px] font-normal opacity-80">1:1</span>
                 </button>
                 <button onClick={() => { setSelectedSide("DRAGON"); }} className="py-0.5 sm:py-1 px-0.5 rounded-md sm:rounded-lg bg-red-950/60 hover:bg-red-900/80 active:scale-95 border border-red-700/40 text-red-300 text-center uppercase tracking-tighter transition-transform">
                   ODD <span className="block text-[6px] sm:text-[7px] font-normal opacity-80">1:1</span>
                 </button>
                 <button onClick={() => { setSelectedSide("DRAGON"); }} className="py-0.5 sm:py-1 px-0.5 rounded-md sm:rounded-lg bg-red-950/60 hover:bg-red-900/80 active:scale-95 border border-red-700/40 text-red-300 text-center uppercase tracking-tighter transition-transform">
                   SML <span className="block text-[6px] sm:text-[7px] font-normal opacity-80">1:1</span>
                 </button>
                 <button onClick={() => { setSelectedSide("DRAGON"); }} className="py-0.5 sm:py-1 px-0.5 rounded-md sm:rounded-lg bg-red-950/60 hover:bg-red-900/80 active:scale-95 border border-red-700/40 text-red-300 text-center uppercase tracking-tighter transition-transform">
                   BIG <span className="block text-[6px] sm:text-[7px] font-normal opacity-80">1:1</span>
                 </button>

                 {/* Tiger Side Bets */}
                 <button onClick={() => { setSelectedSide("TIGER"); }} className="py-0.5 sm:py-1 px-0.5 rounded-md sm:rounded-lg bg-amber-950/60 hover:bg-amber-900/80 active:scale-95 border border-amber-700/40 text-amber-300 text-center uppercase tracking-tighter transition-transform">
                   BIG <span className="block text-[6px] sm:text-[7px] font-normal opacity-80">1:1</span>
                 </button>
                 <button onClick={() => { setSelectedSide("TIGER"); }} className="py-0.5 sm:py-1 px-0.5 rounded-md sm:rounded-lg bg-amber-950/60 hover:bg-amber-900/80 active:scale-95 border border-amber-700/40 text-amber-300 text-center uppercase tracking-tighter transition-transform">
                   SML <span className="block text-[6px] sm:text-[7px] font-normal opacity-80">1:1</span>
                 </button>
                 <button onClick={() => { setSelectedSide("TIGER"); }} className="py-0.5 sm:py-1 px-0.5 rounded-md sm:rounded-lg bg-amber-950/60 hover:bg-amber-900/80 active:scale-95 border border-amber-700/40 text-amber-300 text-center uppercase tracking-tighter transition-transform">
                   ODD <span className="block text-[6px] sm:text-[7px] font-normal opacity-80">1:1</span>
                 </button>
                 <button onClick={() => { setSelectedSide("TIGER"); }} className="py-0.5 sm:py-1 px-0.5 rounded-md sm:rounded-lg bg-amber-950/60 hover:bg-amber-900/80 active:scale-95 border border-amber-700/40 text-amber-300 text-center uppercase tracking-tighter transition-transform">
                   EVEN <span className="block text-[6px] sm:text-[7px] font-normal opacity-80">1:1</span>
                 </button>
              </div>

              {/* CHIP SELECTOR CAROUSEL & ACTION BUTTONS */}
              <div className="flex items-center justify-center gap-1 sm:gap-2 pt-0.5 sm:pt-1 overflow-x-auto no-scrollbar max-w-full px-0.5 select-none">
                 {/* Undo / Cancel Button */}
                 <button
                   onClick={handleCancelActiveBet}
                   className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center text-xs shadow active:scale-90 transition-transform cursor-pointer"
                   title="Undo / Cancel"
                 >
                   ↺
                 </button>

                 {/* Authentic Casino Chips Set (1, 5, 25, 100, 500, 2.5K) */}
                 <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {[
                      { val: 1, label: "1", bg: "from-emerald-500 to-green-600 border-white text-white" },
                      { val: 5, label: "5", bg: "from-orange-500 to-amber-600 border-white text-white" },
                      { val: 25, label: "25", bg: "from-pink-500 to-rose-600 border-white text-white" },
                      { val: 100, label: "100", bg: "from-red-600 via-white to-red-600 border-red-800 text-neutral-950" },
                      { val: 500, label: "500", bg: "from-purple-600 to-indigo-700 border-white text-white" },
                      { val: 2500, label: "2.5K", bg: "from-neutral-900 via-amber-500 to-black border-amber-400 text-amber-300" },
                    ].map((chip) => {
                      const chipAmount = chip.val / activeCurrency.rateFromBase;
                      const isSelected = selectedAmount === chipAmount;
                      return (
                        <motion.button
                          key={chip.val}
                          whileHover={{ y: -2, scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleChipSelect(chipAmount)}
                          className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center font-black text-[8px] sm:text-[9px] md:text-[10px] font-mono shadow-lg transition-transform border-2 cursor-pointer ${
                            chip.bg
                          } ${isSelected ? "ring-2 sm:ring-4 ring-amber-400 scale-105 sm:scale-110 shadow-[0_0_15px_rgba(251,191,36,0.8)]" : ""}`}
                        >
                          {chip.label}
                        </motion.button>
                      );
                    })}
                 </div>

                 {/* Double (x2) Button */}
                 <button
                   onClick={handleDoubleBet}
                   className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center text-[8px] sm:text-[10px] font-black font-mono shadow cursor-pointer active:scale-90 transition-transform"
                   title="Double Bet (x2)"
                 >
                   x2
                 </button>

                 {/* Repeat (↻) Button */}
                 <button
                   onClick={handleRepeatBet}
                   disabled={!lastPlacedBet}
                   className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-slate-900/90 hover:bg-slate-800 disabled:opacity-30 text-slate-300 border border-slate-700 flex items-center justify-center text-xs shadow cursor-pointer active:scale-90 transition-transform"
                   title="Repeat Previous Bet"
                 >
                   ↻
                 </button>
              </div>

           </div>

           {/* RIGHT: CHAT INPUT & FOOTER TELEMETRY */}
           <div className="w-full lg:w-[220px] xl:w-[250px] shrink-0 flex flex-col justify-between bg-black/60 p-1.5 sm:p-2 rounded-xl border border-white/10 gap-1 sm:gap-1.5">
              {/* Chat Input Pill */}
              <div className="flex items-center gap-1.5">
                 <div className="flex-1 flex items-center justify-between bg-neutral-900/90 border border-white/10 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs text-neutral-400">
                    <span className="text-[9px] sm:text-[10px]">Click to chat</span>
                    <button className="text-neutral-500 hover:text-white">↑</button>
                 </div>
                 <button 
                   onClick={() => sound.playWinFanfare()}
                   className="p-1 rounded-full bg-rose-600/30 border border-rose-500/40 text-rose-400 hover:scale-110 transition-transform cursor-pointer text-xs"
                   title="Send Love"
                 >
                   ❤️
                 </button>
              </div>

              {/* Bottom Telemetry Lines with BUILD_NUMBER */}
              <div className="flex flex-col gap-0.5 text-[8px] sm:text-[9px] font-mono text-neutral-400 pt-0.5 sm:pt-1 border-t border-white/10">
                 <div className="flex items-center justify-between text-neutral-500 text-[7px] sm:text-[8px]">
                   <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} {broadcastTime}</span>
                   <span className="text-amber-400 font-bold bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 text-[7px] sm:text-[8px]">
                     {BUILD_NUMBER}
                   </span>
                 </div>
                 <div className="flex items-center justify-between font-bold">
                    <span>Last win: <strong className="text-amber-400">{formatAmt(400)}</strong></span>
                    <span>Balance: <strong className="text-white">{formatAmt(activeBalance)}</strong></span>
                 </div>
              </div>
           </div>

        </div>

      </div>

      {/* Auto Bet Setup Modal */}
      <AnimatePresence>
        {showAutoBetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="smart-glass border-white/10 rounded-[40px] p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-8 shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Automation Engine</h3>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Configure Strategic Execution</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAutoBetModal(false)}
                  className="p-3 rounded-full hover:bg-white/5 text-neutral-500 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Strategy Selector */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] block ml-1">
                  System Strategy
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "FLAT", name: "FLAT BET", desc: "Static execution" },
                    { id: "MARTINGALE", name: "MARTINGALE", desc: "2X on loss" },
                    { id: "ANTI_MARTINGALE", name: "ANTI-MART", desc: "2X on win" },
                    { id: "STREAK_CHASER", name: "CHASER", desc: "Follow momentum" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setAutoBetConfig((p) => ({ ...p, strategy: st.id as AutoBetStrategy }))}
                      className={`p-4 rounded-3xl text-left border transition-all flex flex-col gap-1 ${
                        autoBetConfig.strategy === st.id
                          ? "bg-violet-500/10 border-violet-500/40 ring-1 ring-violet-500/20"
                          : "bg-white/5 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <span className={`text-[11px] font-black tracking-widest ${autoBetConfig.strategy === st.id ? "text-violet-400" : "text-neutral-400"}`}>{st.name}</span>
                      <span className="text-[9px] text-neutral-600 font-medium">{st.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Side & Base Amount */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] block ml-1">Initial Side</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAutoBetConfig((p) => ({ ...p, side: "DRAGON" }))}
                      className={`flex-1 py-3 rounded-2xl font-bold text-[10px] tracking-widest border transition-all ${
                        autoBetConfig.side === "DRAGON" ? "bg-violet-500 text-white border-violet-400" : "bg-white/5 border-white/5 text-neutral-500"
                      }`}
                    >
                      DRAGON
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoBetConfig((p) => ({ ...p, side: "TIGER" }))}
                      className={`flex-1 py-3 rounded-2xl font-bold text-[10px] tracking-widest border transition-all ${
                        autoBetConfig.side === "TIGER" ? "bg-cyan-500 text-white border-cyan-400" : "bg-white/5 border-white/5 text-neutral-500"
                      }`}
                    >
                      TIGER
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] block ml-1">Base Stake</label>
                  <div className="bg-black/40 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{formatAmt(autoBetConfig.baseAmount)}</span>
                    <button onClick={() => setAutoBetConfig(p => ({ ...p, baseAmount: activeLimits.chips[0], currentStake: activeLimits.chips[0] }))} className="text-[9px] font-bold text-violet-400 uppercase tracking-tighter">Reset</button>
                  </div>
                </div>
              </div>

              {/* Rounds Control */}
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Execution Rounds</label>
                  <span className="text-[10px] font-mono text-violet-400">{autoBetConfig.totalRounds === 9999 ? 'UNLIMITED' : `${autoBetConfig.totalRounds} ROUNDS`}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[10, 20, 50, 100, 9999].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAutoBetConfig((p) => ({ ...p, totalRounds: r, roundsRemaining: r }))}
                      className={`py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                        autoBetConfig.totalRounds === r ? "bg-white text-black border-white" : "bg-white/5 border-white/5 text-neutral-500 hover:border-white/10"
                      }`}
                    >
                      {r === 9999 ? "∞" : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Launch Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playButtonClick();
                    setAutoBetConfig((p) => ({
                      ...p,
                      isActive: true,
                      roundsRemaining: p.totalRounds,
                      roundsCompleted: 0,
                      totalWagered: 0,
                      totalProfitLoss: 0,
                      winsCount: 0,
                      lossesCount: 0,
                      currentStreak: 0,
                      currentStake: p.baseAmount,
                    }));
                    setShowAutoBetModal(false);
                  }}
                  className="w-full py-5 rounded-[24px] bg-white text-neutral-950 font-bold text-xs uppercase tracking-[0.3em] shadow-[0_12px_24px_rgba(255,255,255,0.1)] active:scale-95 transition-all"
                >
                  Initiate Cycle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
