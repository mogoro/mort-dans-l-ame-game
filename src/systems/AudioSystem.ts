// Audio procédural Web Audio (pas de fichier, libre de droits)
// Style ambient lo-fi sombre + SFX courts type Inscryption

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private convolver: ConvolverNode | null = null;
  private reverbSend: GainNode | null = null;
  private currentLoopTimer: ReturnType<typeof setTimeout> | null = null;
  private currentPhaseGain: GainNode | null = null;
  private fadingOut: GainNode | null = null;
  private noteHandles: { osc: OscillatorNode; gain: GainNode }[] = [];

  enabled = false;
  volume = 0.5;
  currentPhase = "";

  init(): void {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume * 0.18;

      this.lowpass = this.ctx.createBiquadFilter();
      this.lowpass.type = "lowpass";
      this.lowpass.frequency.value = 2000;
      this.lowpass.Q.value = 0.7;

      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = this.makeImpulseResponse(3.5, 4.0);
      this.reverbSend = this.ctx.createGain();
      this.reverbSend.gain.value = 1.0;
      const reverbReturn = this.ctx.createGain();
      reverbReturn.gain.value = 0.55;
      this.reverbSend.connect(this.convolver);
      this.convolver.connect(reverbReturn);

      this.lowpass.connect(this.masterGain);
      reverbReturn.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      const persisted = localStorage.getItem("mortdansl-audio-volume");
      if (persisted != null) this.setVolume(parseFloat(persisted));
    } catch (e) {
      console.warn("Web Audio non disponible :", e);
    }
  }

  private makeImpulseResponse(duration: number, decay: number): AudioBuffer {
    if (!this.ctx) throw new Error("ctx null");
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const noise = (Math.random() * 2 - 1) * 0.5;
        data[i] = noise * Math.pow(1 - i / length, decay);
      }
    }
    return buffer;
  }

  toggle(): boolean {
    this.init();
    this.enabled = !this.enabled;
    localStorage.setItem("mortdansl-audio-enabled", this.enabled ? "1" : "0");
    if (this.enabled) {
      if (this.ctx?.state === "suspended") this.ctx.resume();
      this.playPhase(this.currentPhase || "ambient");
    } else {
      this.stopAll();
    }
    return this.enabled;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.volume * 0.18,
        this.ctx.currentTime + 0.2
      );
    }
    localStorage.setItem("mortdansl-audio-volume", String(this.volume));
  }

  playPhase(phase: string): void {
    if (this.currentPhase === phase && this.currentLoopTimer) return;
    const previousPhase = this.currentPhase;
    this.currentPhase = phase;
    if (!this.enabled || !this.ctx) return;

    const cfg = this.getPhaseCfg(phase);
    if (this.lowpass) {
      this.lowpass.frequency.linearRampToValueAtTime(cfg.lp, this.ctx.currentTime + 1.5);
    }

    if (previousPhase && this.currentPhaseGain) {
      this.crossfade(phase);
    } else {
      this.startPhase(phase, true);
    }
  }

  private getPhaseCfg(phase: string) {
    const cfgs: Record<string, { tempo: number; key: number; scale: number[]; lp: number; reverb: number }> = {
      ambient: { tempo: 60, key: 60, scale: [0, 3, 5, 7, 10], lp: 1800, reverb: 0.85 },
      life:    { tempo: 70, key: 64, scale: [0, 2, 4, 7, 9], lp: 2400, reverb: 0.7 },
      death:   { tempo: 42, key: 48, scale: [0, 3, 7, 10], lp: 1200, reverb: 1.0 },
      combat:  { tempo: 72, key: 50, scale: [0, 1, 4, 6, 10], lp: 1800, reverb: 0.85 },
      victory: { tempo: 80, key: 60, scale: [0, 4, 7, 11], lp: 2200, reverb: 0.6 },
      defeat:  { tempo: 38, key: 48, scale: [0, 1, 6, 8], lp: 1100, reverb: 1.0 },
    };
    return cfgs[phase] || cfgs.ambient;
  }

  private startPhase(phase: string, fadeIn: boolean): void {
    if (!this.ctx) return;
    this.stopAll();
    const cfg = this.getPhaseCfg(phase);

    this.currentPhaseGain = this.ctx.createGain();
    this.currentPhaseGain.gain.value = fadeIn ? 0 : 1;
    this.currentPhaseGain.connect(this.lowpass!);
    if (fadeIn) {
      this.currentPhaseGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 2.5);
    }
    this.scheduleLoop(cfg);
  }

  private crossfade(newPhase: string): void {
    if (!this.ctx) return;
    this.fadingOut = this.currentPhaseGain;
    if (this.fadingOut) {
      this.fadingOut.gain.cancelScheduledValues(this.ctx.currentTime);
      this.fadingOut.gain.setValueAtTime(this.fadingOut.gain.value, this.ctx.currentTime);
      this.fadingOut.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2.5);
    }
    if (this.currentLoopTimer) {
      clearTimeout(this.currentLoopTimer);
      this.currentLoopTimer = null;
    }
    const oldNotes = this.noteHandles.slice();
    this.noteHandles = [];
    setTimeout(() => {
      oldNotes.forEach((h) => {
        try { h.osc.stop(); h.osc.disconnect(); h.gain.disconnect(); } catch (e) {}
      });
      this.fadingOut?.disconnect();
      this.fadingOut = null;
    }, 2700);
    this.startPhase(newPhase, true);
  }

  stopAll(): void {
    this.noteHandles.forEach((h) => {
      try { h.osc.stop(); h.osc.disconnect(); h.gain.disconnect(); } catch (e) {}
    });
    this.noteHandles = [];
    if (this.currentLoopTimer) {
      clearTimeout(this.currentLoopTimer);
      this.currentLoopTimer = null;
    }
  }

  private scheduleLoop(cfg: { tempo: number; key: number; scale: number[]; reverb: number }): void {
    if (!this.enabled || !this.ctx) return;
    const beatDur = 60 / cfg.tempo;
    const measureBeats = 4;

    // Bass note longue
    this.playNote(cfg.key - 12, 0, beatDur * 4, 0.45, "triangle", cfg.reverb);
    // Pad accord 3 notes
    [cfg.scale[0], cfg.scale[2], cfg.scale[3]].forEach((interval, i) => {
      this.playNote(cfg.key + (interval || 0), 0, beatDur * 4, 0.18 + i * 0.04, "sine", cfg.reverb);
    });
    // Lead notes éparses (2-3 par mesure)
    for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.78) {
        const noteIdx = Math.floor(Math.random() * cfg.scale.length);
        const octave = Math.random() < 0.6 ? 12 : 0;
        const t = (i / 3) * measureBeats * beatDur + Math.random() * beatDur * 0.4;
        this.playNote(cfg.key + cfg.scale[noteIdx] + octave, t, beatDur * 1.5, 0.22, "sine", cfg.reverb);
      }
    }

    const measureMs = beatDur * measureBeats * 1000;
    this.currentLoopTimer = setTimeout(() => this.scheduleLoop(cfg), measureMs);
  }

  private playNote(midi: number, delay: number, duration: number, vel: number, wave: OscillatorType, reverbAmt: number): void {
    if (!this.ctx || !this.currentPhaseGain) return;
    const startT = this.ctx.currentTime + delay;
    const endT = startT + duration;
    const baseHz = 440 * Math.pow(2, (midi - 69) / 12);

    // 2 oscillators détune pour chorus subtle
    [-3, 3].forEach((detune) => {
      const osc = this.ctx!.createOscillator();
      osc.type = wave;
      osc.frequency.value = baseHz * Math.pow(2, detune / 1200);

      const gain = this.ctx!.createGain();
      const peak = vel * 0.4;
      gain.gain.setValueAtTime(0, startT);
      gain.gain.linearRampToValueAtTime(peak, startT + 0.04);
      gain.gain.linearRampToValueAtTime(peak * 0.85, startT + 0.25);
      gain.gain.setValueAtTime(peak * 0.85, Math.max(startT + 0.25, endT - 0.4));
      gain.gain.linearRampToValueAtTime(0, endT + 0.2);

      osc.connect(gain);
      gain.connect(this.currentPhaseGain!);

      if (reverbAmt > 0 && this.reverbSend) {
        const r = this.ctx!.createGain();
        r.gain.value = reverbAmt * 0.55;
        gain.connect(r);
        r.connect(this.reverbSend);
      }

      osc.start(startT);
      osc.stop(endT + 0.5);
      this.noteHandles.push({ osc, gain });
    });
  }

  // SFX courts
  sfx(name: "click" | "card_play" | "card_destroy" | "damage" | "heal" | "block" | "bell" | "victory" | "defeat" | "draw"): void {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;

    const cfg: Record<string, { freq: number; freqEnd: number; dur: number; vel: number; wave: OscillatorType }> = {
      click:        { freq: 600,  freqEnd: 600,  dur: 0.06, vel: 0.3, wave: "sine" },
      card_play:    { freq: 400,  freqEnd: 700,  dur: 0.15, vel: 0.35, wave: "triangle" },
      card_destroy: { freq: 200,  freqEnd: 80,   dur: 0.4, vel: 0.45, wave: "sawtooth" },
      damage:       { freq: 200,  freqEnd: 80,   dur: 0.18, vel: 0.5, wave: "sine" },
      heal:         { freq: 600,  freqEnd: 900,  dur: 0.4, vel: 0.3, wave: "sine" },
      block:        { freq: 350,  freqEnd: 350,  dur: 0.12, vel: 0.35, wave: "triangle" },
      bell:         { freq: 1200, freqEnd: 600,  dur: 1.4, vel: 0.4, wave: "sine" },
      victory:      { freq: 523,  freqEnd: 784,  dur: 0.6, vel: 0.45, wave: "sine" },
      defeat:       { freq: 200,  freqEnd: 60,   dur: 1.2, vel: 0.5, wave: "sine" },
      draw:         { freq: 800,  freqEnd: 1000, dur: 0.08, vel: 0.25, wave: "sine" },
    };
    const c = cfg[name];

    const osc = this.ctx.createOscillator();
    osc.type = c.wave;
    osc.frequency.setValueAtTime(c.freq, t);
    if (c.freqEnd !== c.freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, c.freqEnd), t + c.dur);
    }
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(c.vel, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + c.dur);
    osc.connect(g);
    g.connect(this.lowpass || this.masterGain!);

    // Send reverb pour la cloche
    if (name === "bell" && this.reverbSend) {
      const r = this.ctx.createGain();
      r.gain.value = 0.7;
      g.connect(r);
      r.connect(this.reverbSend);
    }
    osc.start(t);
    osc.stop(t + c.dur + 0.05);
  }
}

export const audio = new AudioEngine();

// Init au load + bouton toggle
window.addEventListener("DOMContentLoaded", () => {
  const persisted = localStorage.getItem("mortdansl-audio-enabled");
  if (persisted === "1") {
    audio.init();
    audio.enabled = true;
  }
});
