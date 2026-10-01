import React, { useState, useEffect } from "react";
import { Shield, Sparkles, ArrowRight, User, KeyRound, Eye, EyeOff, Gift } from "lucide-react";
import { UserWallet } from "../types";
import { sound } from "../utils/audio";
import { BUILD_NUMBER } from "../config/version";

interface LoginScreenProps {
  onLoginSuccess: (user: UserWallet) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref");
    if (refParam) {
      setRefCode(refParam.toUpperCase());
      setMode("signup");
    }
  }, []);

  const handleInstantLogin = async () => {
    sound.playButtonClick();
    setError("");
    setLoading(true);

    try {
      const studioUsername = "VIP_HighRoller_Guest";
      let res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: studioUsername,
          password: "studio_dev_password_2026",
        }),
      });
      let data = await res.json();

      if (!data.success) {
        res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: studioUsername,
            password: "studio_dev_password_2026",
            refCode: refCode.trim() || undefined,
          }),
        });
        data = await res.json();
      }

      if (data.success && data.user) {
        sound.playWinFanfare();
        sound.speak(`Welcome, ${data.user.username}!`);
        onLoginSuccess(data.user);
      } else {
        setError("Failed to initialize session.");
      }
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playButtonClick();
    setError("");

    if (!username.trim() || username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!password || password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setLoading(true);
    const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          refCode: mode === "signup" && refCode.trim() ? refCode.trim().toUpperCase() : undefined,
        }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        sound.playWinFanfare();
        sound.speak(`Welcome, ${data.user.username}!`);
        onLoginSuccess(data.user);
      } else {
        sound.playLossSound();
        setError(data.error || "Authentication failed.");
      }
    } catch {
      setError("Network connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-full bg-[#070a12] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.12),rgba(0,0,0,0))] flex flex-col justify-between p-2.5 sm:p-4 relative overflow-hidden text-neutral-100 select-none">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full mx-auto my-auto relative z-10 py-1 sm:py-2">
        {/* Brand Header */}
        <div className="text-center mb-2.5 sm:mb-4">
          <div className="inline-flex w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-red-600 to-amber-700 p-0.5 shadow-xl shadow-amber-600/20 mb-1.5 items-center justify-center">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
            DRAGON TIGER ARENA
          </h1>
          <p className="text-[10px] sm:text-xs text-neutral-400 mt-1">
            Secure P2P Live Casino &amp; Escrow Platform
          </p>
        </div>

        <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-3.5 sm:p-5 shadow-2xl">
          {/* Instant Play Button */}
          <button
            type="button"
            onClick={handleInstantLogin}
            disabled={loading}
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-3 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-950" />
            <span>⚡ Instant Guest Play (1-Click)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="relative flex py-0.5 items-center mb-3">
            <div className="flex-grow border-t border-neutral-800"></div>
            <span className="flex-shrink mx-2.5 text-[9px] uppercase font-bold text-neutral-500">
              Or Use Credentials
            </span>
            <div className="flex-grow border-t border-neutral-800"></div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 mb-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                sound.playButtonClick();
                setMode("signup");
                setError("");
              }}
              className={`py-1.5 rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-amber-500 text-neutral-950 font-black shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playButtonClick();
                setMode("signin");
                setError("");
              }}
              className={`py-1.5 rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-amber-500 text-neutral-950 font-black shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter username"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-white placeholder-neutral-600 text-xs focus:outline-none transition-colors"
                  maxLength={24}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl pl-9 pr-9 py-2 text-white placeholder-neutral-600 text-xs focus:outline-none transition-colors"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Referral Code (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <input
                    type="text"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                    placeholder="e.g. APEX777"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-white placeholder-neutral-600 text-xs focus:outline-none transition-colors font-mono uppercase"
                    maxLength={32}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-2 bg-red-500/15 border border-red-500/30 rounded-xl text-[11px] text-red-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-100 hover:bg-white text-neutral-950 font-black py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
            >
              <span>{loading ? "Processing..." : mode === "signup" ? "Create Account" : "Sign In"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-3 pt-2.5 border-t border-neutral-800 flex items-center justify-center gap-2 text-[10px] text-neutral-500">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Encrypted &amp; Secure P2P Escrow</span>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-neutral-500 py-1 relative z-10 flex flex-col items-center justify-center gap-1">
        <div>© 2026 Dragon Tiger Arena. All rights reserved.</div>
        <div className="inline-flex items-center gap-1.5 font-mono text-[9px] text-amber-400/90 bg-neutral-900/90 border border-neutral-800 px-2.5 py-0.5 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="tracking-wide">Build: {BUILD_NUMBER}</span>
        </div>
      </div>
    </div>
  );
};
