import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles } from "lucide-react";

interface PlayingCardProps {
  card: {
    rank: string;
    suit: string;
    value: number;
    display: string;
  } | null;
  side: "DRAGON" | "TIGER";
  isWinner?: boolean;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({ card, side, isWinner = false }) => {
  const [flipped, setFlipped] = useState<boolean>(false);

  // Trigger flip animation 180ms after card is dealt
  useEffect(() => {
    if (card) {
      const timer = setTimeout(() => {
        setFlipped(true);
      }, 180);
      return () => clearTimeout(timer);
    } else {
      setFlipped(false);
    }
  }, [card]);

  const isRed = card?.suit === "♥" || card?.suit === "♦";

  return (
    <motion.div
      initial={{
        y: -40,
        x: side === "DRAGON" ? -15 : 15,
        rotate: side === "DRAGON" ? -10 : 10,
        opacity: 0,
        scale: 0.85,
      }}
      animate={{
        y: 0,
        x: 0,
        rotate: 0,
        opacity: 1,
        scale: isWinner ? [1, 1.06, 1] : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 22,
        scale: isWinner
          ? { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
          : { duration: 0.3 },
      }}
      className="relative w-16 h-22 sm:w-18 sm:h-26 perspective-[1000px] select-none"
    >
      {/* CSS 3D Card Animation Styles */}
      <style>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* Floating Winner Crown & Badge */}
      <AnimatePresence>
        {isWinner && flipped && (
          <motion.div
            initial={{ scale: 0, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: -14, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="absolute -top-1 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-neutral-950 font-black text-[9px] shadow-lg shadow-amber-500/50 whitespace-nowrap"
          >
            <Crown className="w-2.5 h-2.5 fill-neutral-950" />
            <span>WIN</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`w-full h-full duration-700 preserve-3d transition-all ${
          flipped ? "rotate-y-180" : ""
        }`}
      >
        {/* CARD BACK (Sleek Minimalist Pattern) */}
        <div className="absolute inset-0 w-full h-full rounded-xl bg-[#0a0a0a] border border-white/10 shadow-2xl flex flex-col items-center justify-center p-1 backface-hidden overflow-hidden">
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <div className="w-full h-full rounded-lg border border-white/5 flex flex-col items-center justify-center relative bg-gradient-to-br from-neutral-900 to-black">
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-neutral-500"
            >
              <Sparkles className="w-6 h-6 text-violet-500/40" />
            </motion.div>
          </div>
        </div>

        {/* CARD FRONT (Minimalist Revealed) */}
        <div
          className={`absolute inset-0 w-full h-full rounded-xl bg-white border shadow-2xl flex flex-col justify-between p-2 sm:p-2.5 rotate-y-180 backface-hidden transition-all duration-500 ${
            isWinner
              ? side === "DRAGON"
                ? "border-red-500 ring-4 ring-red-500/40 shadow-[0_0_35px_rgba(239,68,68,0.8)]"
                : "border-amber-400 ring-4 ring-amber-400/40 shadow-[0_0_35px_rgba(251,191,36,0.85)]"
              : "border-neutral-200"
          }`}
        >
          {/* Subtle Pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
          {/* Top Rank + Suit */}
          <div className="flex flex-col items-start leading-none">
            <span className={`text-xs sm:text-sm font-black ${isRed ? "text-red-600" : "text-neutral-900"}`}>
              {card?.rank}
            </span>
            <span className={`text-xs sm:text-sm ${isRed ? "text-red-600" : "text-neutral-900"}`}>
              {card?.suit}
            </span>
          </div>

          {/* Large Center Suit Graphic with 3D Pop */}
          <div className="self-center flex items-center justify-center relative">
            <span
              className={`text-2xl sm:text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] ${
                isRed ? "text-red-600" : "text-neutral-900"
              }`}
            >
              {card?.suit}
            </span>
          </div>

          {/* Bottom Rank + Suit (Inverted) */}
          <div className="flex flex-col items-end leading-none transform rotate-180">
            <span className={`text-xs sm:text-sm font-black ${isRed ? "text-red-600" : "text-neutral-900"}`}>
              {card?.rank}
            </span>
            <span className={`text-xs sm:text-sm ${isRed ? "text-red-600" : "text-neutral-900"}`}>
              {card?.suit}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
