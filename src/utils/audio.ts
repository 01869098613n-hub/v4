// Live Casino Sound & Voice Audio Engine
// Web Audio API Synthesis + Web Speech API Dealer Voice

class CasinoAudioEngine {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  public voiceEnabled: boolean = true;
  public dealerVoiceVol: number = 1.0;
  public sfxVol: number = 0.8;
  public bgmVol: number = 0.5;
  public masterMute: boolean = false;
  private voice: SpeechSynthesisVoice | null = null;
  private voicesLoaded: boolean = false;
  private bgmGainNode: GainNode | null = null;
  private bgmOscs: OscillatorNode[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.initVoice();
      try {
        const stored = localStorage.getItem("apex_audio_mixer");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.dealerVoice !== undefined) this.dealerVoiceVol = parsed.dealerVoice / 100;
          if (parsed.sfx !== undefined) this.sfxVol = parsed.sfx / 100;
          if (parsed.bgm !== undefined) this.bgmVol = parsed.bgm / 100;
          if (parsed.masterMute !== undefined) this.masterMute = parsed.masterMute;
        }
      } catch {}
    }
  }

  public setMixerVolumes(config: { dealerVoice: number; sfx: number; bgm: number; masterMute: boolean }) {
    this.dealerVoiceVol = config.dealerVoice;
    this.sfxVol = config.sfx;
    this.bgmVol = config.bgm;
    this.masterMute = config.masterMute;

    if (this.bgmGainNode && this.ctx) {
      this.bgmGainNode.gain.setValueAtTime(this.masterMute ? 0 : this.bgmVol * 0.1, this.ctx.currentTime);
    }
  }

  public toggleBgm(play: boolean) {
    if (!play || this.masterMute) {
      this.stopBgm();
      return;
    }
    this.startBgm();
  }

  public startBgm() {
    this.stopBgm();
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      this.bgmGainNode = ctx.createGain();
      this.bgmGainNode.gain.setValueAtTime(this.masterMute ? 0 : this.bgmVol * 0.1, ctx.currentTime);
      this.bgmGainNode.connect(ctx.destination);

      // Create a smooth ambient chord pad (C minor 9)
      const freqs = [130.81, 155.56, 196.00, 246.94]; // C3, Eb3, G3, B3
      this.bgmOscs = freqs.map((freq) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.connect(this.bgmGainNode!);
        osc.start();
        return osc;
      });
    } catch {}
  }

  public stopBgm() {
    this.bgmOscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.bgmOscs = [];
  }

  private getContext(): AudioContext | null {
    if (!this.sfxEnabled) return null;
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private initVoice() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        this.voicesLoaded = true;
        // Find best English croupier voice (prioritize UK or natural US female/male dealer voices)
        const preferred =
          voices.find((v) => v.lang.startsWith("en") && (v.name.includes("UK") || v.name.includes("British") || v.name.includes("Female") || v.name.includes("Samantha") || v.name.includes("Natural"))) ||
          voices.find((v) => v.lang.startsWith("en")) ||
          voices[0];
        if (preferred) this.voice = preferred;
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  // ==========================================================================
  // LIVE CASINO CROUPIER VOICE ANNOUNCEMENTS
  // ==========================================================================
  public speak(text: string, force = false) {
    if (!this.voiceEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      if (force) {
        window.speechSynthesis.cancel();
      }
      const utter = new SpeechSynthesisUtterance(text);
      if (this.voice) utter.voice = this.voice;
      utter.pitch = 1.08; // Professional, bright croupier pitch
      utter.rate = 1.04;  // Crisp, fast casino pacing
      utter.volume = this.masterMute ? 0 : Math.max(0, Math.min(1, this.dealerVoiceVol));
      if (utter.volume > 0) {
        window.speechSynthesis.speak(utter);
      }
    } catch {
      // Speech blocked by browser
    }
  }

  public announcePlaceBets() {
    const lines = [
      "Place your bets please!",
      "New round started, make your wagers!",
      "Place your stakes on Dragon or Tiger!",
    ];
    this.speak(lines[Math.floor(Math.random() * lines.length)], true);
  }

  public announceLastBets() {
    this.speak("Final bets! Five seconds remaining!", true);
  }

  public announceBetsClosed() {
    this.speak("Bets are closed! Dealing the cards now.", true);
  }

  public announceWinner(winner: "DRAGON" | "TIGER" | "TIE") {
    if (winner === "DRAGON") {
      this.speak("Dragon wins.", true);
    } else if (winner === "TIGER") {
      this.speak("Tiger wins.", true);
    } else {
      this.speak("It's a tie.", true);
    }
  }

  public announcePlayerWin(amount: number) {
    setTimeout(() => {
      const phrases = [
        `Congratulations! You've won ${amount.toLocaleString()}!`,
        `Amazing win! ${amount.toLocaleString()} credited to your balance.`,
        `A sensational victory! Payout of ${amount.toLocaleString()} is yours!`,
      ];
      this.speak(phrases[Math.floor(Math.random() * phrases.length)]);
    }, 1500);
  }

  public announcePlayerLoss(amount?: number) {
    setTimeout(() => {
      const phrases = [
        "Unlucky this time. Better luck in the next round!",
        "Tiger takes it. Let's try again!",
        "Dragon takes it. Don't give up!",
      ];
      this.speak(phrases[Math.floor(Math.random() * phrases.length)]);
    }, 1500);
  }

  public announcePlayerBet(amount: number, side: string) {
    this.speak(`Bet confirmed! Total bet amount: ${amount.toLocaleString()} Taka on ${side}.`, true);
  }

  public announceTotalBet(totalStaged: number, side: string) {
    this.speak(`Total bet amount: ${totalStaged.toLocaleString()} Taka on ${side}.`, true);
  }

  public announceMatchingPhase(dragonPool: number, tigerPool: number, matchedAmount: number, returnedAmount: number) {
    if (returnedAmount > 0) {
      this.speak(`Matching complete! Total matched bet amount: ${matchedAmount.toLocaleString()} Taka. Unmatched ${returnedAmount.toLocaleString()} Taka returned to players.`);
    } else {
      this.speak(`All bets fully matched! Total matched amount: ${matchedAmount.toLocaleString()} Taka.`);
    }
  }

  public announceUserRefund(refundAmount: number) {
    this.speak(`Unmatched refund! ${refundAmount.toLocaleString()} Taka returned to your balance.`, true);
  }

  public announceTieRefund(refundAmount: number) {
    this.speak(`It is a Tie! 50% refund of ${refundAmount.toLocaleString()} Taka returned to your wallet. 50% retained in company fund.`, true);
  }

  public announceWinStreak(streak: number) {
    if (streak >= 7) {
      this.speak(`Unstoppable! Legendary ${streak} round win streak! You are on fire!`, true);
    } else if (streak >= 5) {
      this.speak(`Incredible! ${streak} round win streak! Phenomenal gameplay!`, true);
    } else if (streak >= 3) {
      this.speak(`Hot streak! ${streak} wins in a row! Keep the fire burning!`, true);
    }
  }

  public announceDetailedCardsAndResult(
    winner: "DRAGON" | "TIGER" | "TIE",
    dragonRank: string,
    tigerRank: string,
    userPayout?: number,
    tieRefund?: number
  ) {
    let msg = `Dragon ${dragonRank}. Tiger ${tigerRank}. ${winner === "TIE" ? "Tie." : `${winner} wins!`}`;
    if (userPayout && userPayout > 0) {
      msg += ` Congratulations!`;
    }
    this.speak(msg, true);
  }

  // ==========================================================================
  // ADDICTIVE CASINO SOUND EFFECTS (SYNTHESIZED HARMONICS & REVERB)
  // ==========================================================================

  // Ambient Crowd Noise Audio Nodes
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGainNode: GainNode | null = null;
  public isAmbientCrowdPlaying: boolean = false;
  private ambientCrowdVolume: number = 0.22;

  public startAmbientCrowdNoise() {
    if (this.isAmbientCrowdPlaying) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Generate 4 seconds of realistic casino room ambiance (pink noise + room resonance)
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
      const ch0 = buffer.getChannelData(0);
      const ch1 = buffer.getChannelData(1);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filter algorithm
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = (b0 + b1 + b2 + b3 + b4 + b5 + white * 0.5362) * 0.07;
        // Stereo decorrelation for spacious room acoustics
        ch0[i] = pink * (0.8 + 0.2 * Math.sin((i / bufferSize) * Math.PI * 6));
        ch1[i] = pink * (0.8 + 0.2 * Math.cos((i / bufferSize) * Math.PI * 5));
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Bandpass around human vocal murmur range (200Hz - 1800Hz)
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(1400, ctx.currentTime);

      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.setValueAtTime(180, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this.ambientCrowdVolume, ctx.currentTime + 1.2);

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);

      source.start();
      this.ambientSource = source;
      this.ambientGainNode = gain;
      this.isAmbientCrowdPlaying = true;
    } catch {
      // Audio context error
    }
  }

  public stopAmbientCrowdNoise() {
    if (!this.isAmbientCrowdPlaying) return;
    const ctx = this.getContext();
    if (this.ambientGainNode && ctx) {
      try {
        this.ambientGainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        setTimeout(() => {
          if (this.ambientSource) {
            try {
              this.ambientSource.stop();
              this.ambientSource.disconnect();
            } catch {}
            this.ambientSource = null;
          }
          this.isAmbientCrowdPlaying = false;
        }, 450);
      } catch {
        this.isAmbientCrowdPlaying = false;
      }
    } else {
      this.isAmbientCrowdPlaying = false;
    }
  }

  public setAmbientVolume(volume: number) {
    this.ambientCrowdVolume = Math.max(0, Math.min(1, volume));
    if (this.ambientGainNode && this.ctx) {
      this.ambientGainNode.gain.setValueAtTime(this.ambientCrowdVolume, this.ctx.currentTime);
    }
  }

  // Realistic metallic casino coins clinking
  public playCoinsClinking() {
    const ctx = this.getContext();
    if (!ctx) return;

    // 4 quick metallic clinks with rich ring frequencies
    const clinks = [
      { f1: 3200, f2: 4400, delay: 0 },
      { f1: 2900, f2: 3950, delay: 0.05 },
      { f1: 3500, f2: 4800, delay: 0.11 },
      { f1: 3100, f2: 4200, delay: 0.18 },
    ];

    clinks.forEach((c) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(c.f1, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(c.f1 * 1.15, ctx.currentTime + 0.08);

          osc2.type = "triangle";
          osc2.frequency.setValueAtTime(c.f2, ctx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(c.f2 * 0.9, ctx.currentTime + 0.06);

          gain.gain.setValueAtTime(0.18, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

          osc.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc2.start();
          osc.stop(ctx.currentTime + 0.09);
          osc2.stop(ctx.currentTime + 0.09);
        } catch {}
      }, c.delay * 1000);
    });
  }

  // 1. Ceramic Casino Chip Click with realistic acoustic body resonance
  public playChip(multiplier = 1) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const baseFreq = 1600 + Math.random() * 400;
      const osc = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, ctx.currentTime + 0.04);

      oscHarmonic.type = "triangle";
      oscHarmonic.frequency.setValueAtTime(baseFreq * 2.2, ctx.currentTime);
      oscHarmonic.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.22 * Math.min(1.5, multiplier), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      oscHarmonic.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      oscHarmonic.start();
      osc.stop(ctx.currentTime + 0.06);
      oscHarmonic.stop(ctx.currentTime + 0.06);
    } catch {
      // Audio context error ignored
    }
  }

  // 2. Chip Stacking Cascade (rapid 3-clink cluster)
  public playChipStack() {
    this.playChip(1.0);
    setTimeout(() => this.playChip(1.2), 40);
    setTimeout(() => this.playChip(0.9), 90);
  }

  // 3. Card sliding from shoe
  public playCardSlide() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      // White noise burst filtered like sliding felt
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.12);
      filter.Q.setValueAtTime(2.0, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch {}
  }

  // 4. Card Snap on Felt
  public playCardSnap() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.09);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {}
  }

  // 5. Addictive Coin Cascade / Payout Drop (Slot machine style shower)
  public playCoinCascade() {
    const ctx = this.getContext();
    if (!ctx) return;

    const coinCount = 16;
    for (let i = 0; i < coinCount; i++) {
      const delay = i * 0.06 + Math.random() * 0.03;
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const freq = 1800 + Math.random() * 1600;

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.08);

          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.09);
        } catch {}
      }, delay * 1000);
    }
  }

  // 6. Win Fanfare (Harmonic C-Major 9th chord + Bell Shimmer)
  public playWinFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const frequencies = [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51]; // C5, E5, G5, B5, D6, E6
      frequencies.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.08;

        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(f, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.55);
      });

      // Coin shower alongside fanfare
      setTimeout(() => this.playCoinCascade(), 250);
    } catch {}
  }

  // 7. Big Win Celebration (Dramatic 8-note crescendo + coin rain)
  public playBigWin() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const arpeggio = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      arpeggio.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.07;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });

      this.playCoinCascade();
      setTimeout(() => this.playCoinCascade(), 600);
    } catch {}
  }

  // 8. Loss Sound Effect (Subtle, classy descending transition with gentle sub-bass)
  public playLossSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const chords = [392.0, 329.63, 261.63]; // G4, E4, C4 minor descent
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.12;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.9, startTime + 0.35);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });

      // Low whoosh
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = "sine";
      sub.frequency.setValueAtTime(95, ctx.currentTime);
      sub.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.4);
      subGain.gain.setValueAtTime(0.15, ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start();
      sub.stop(ctx.currentTime + 0.4);
    } catch {}
  }

  // 9. Countdown Tension Tick & Heartbeat Thump
  public playCountdownTick(secondsLeft: number) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // High click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const pitch = secondsLeft <= 3 ? 1600 : 1200;
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);

      gain.gain.setValueAtTime(secondsLeft <= 3 ? 0.2 : 0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);

      // Low sub-bass heartbeat thump when under 5s
      if (secondsLeft <= 5) {
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = "sine";
        sub.frequency.setValueAtTime(75, ctx.currentTime);
        sub.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.12);

        subGain.gain.setValueAtTime(0.25, ctx.currentTime);
        subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

        sub.connect(subGain);
        subGain.connect(ctx.destination);

        sub.start();
        sub.stop(ctx.currentTime + 0.12);
      }
    } catch {}
  }

  // 10. Deep Bronze Gong / Bell for Round Start
  public playRoundStartGong() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc1.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 1.2);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5 chime
      osc2.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    } catch {}
  }

  // 11. Tactile UI Click
  public playButtonClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  }

  // Compatibility proxies
  public playCardFlip() {
    this.playCardSlide();
    setTimeout(() => this.playCardSnap(), 60);
  }

  public playWin() {
    this.playWinFanfare();
  }

  public playTick() {
    this.playCountdownTick(5);
  }
}

export const sound = new CasinoAudioEngine();
