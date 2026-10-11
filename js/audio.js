'use strict';
// ---------------------------------------------------------------------------
// Procedural folk music and ambient sound with the Web Audio API.
// Music is generated as AABB phrases over a I-IV-V progression in D major:
// a gentle waltz by day, a quick jig while a party is on.
// ---------------------------------------------------------------------------

const Sound = {
  ctx: null, master: null, musicBus: null, sfxBus: null, ambBus: null, enabled: false,
  step: 0, nextTime: 0, timer: null, phrase: null, phraseBar: 0, mode: 'waltz', rainNode: null, rainGain: null,
  volume: 0.5,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0; this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.55; this.musicBus.connect(this.master);
    this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 0.7; this.sfxBus.connect(this.master);
    this.ambBus = this.ctx.createGain(); this.ambBus.gain.value = 0.5; this.ambBus.connect(this.master);
    // a soft room reverb from a generated impulse
    const conv = this.ctx.createConvolver();
    const len = this.ctx.sampleRate * 1.6, buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5); }
    conv.buffer = buf;
    this.reverb = this.ctx.createGain(); this.reverb.gain.value = 0.25;
    this.reverb.connect(conv); conv.connect(this.master);
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 80);
  },

  setEnabled(on) {
    this.init();
    if (!this.ctx) return;
    this.enabled = on;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(on ? this.volume : 0, t, 0.3);
  },

  // All sound stops while the game's tab is hidden (the whole audio engine is
  // suspended, so the music, ambience and rain all pause where they are) and
  // picks up again on return, if sound is on.
  setHidden(hidden) {
    if (!this.ctx) return;
    if (hidden) this.ctx.suspend();
    else if (this.enabled) this.ctx.resume();
  },

  midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },

  tone(freq, t, dur, { type = 'triangle', vol = 0.15, attack = 0.01, vib = 0, bus = this.musicBus, rev = 0.3 } = {}) {
    const c = this.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    if (vib) {
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 5.5; lg.gain.value = freq * vib;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.1);
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(bus);
    if (rev) { const rg = c.createGain(); rg.gain.value = rev; g.connect(rg); rg.connect(this.reverb); }
    o.start(t); o.stop(t + dur + 0.05);
  },

  // ---- composition ----
  makePhrase(mode) {
    const SCALE = [62, 64, 66, 67, 69, 71, 73, 74, 76, 78, 79, 81];
    const CHORDS = { I: [62, 66, 69], IV: [67, 71, 74], V: [69, 73, 76], vi: [71, 74, 78] };
    const progA = ['I', 'IV', 'V', 'I', 'I', 'vi', 'V', 'I'];
    const progB = ['IV', 'I', 'V', 'vi', 'IV', 'I', 'V', 'I'];
    const beats = mode === 'jig' ? 6 : 3;
    const build = (prog) => {
      let idx = 5;
      return prog.map((ch, bar) => {
        const tones = CHORDS[ch];
        const notes = [];
        for (let b = 0; b < beats; b++) {
          const strong = b === 0 || (mode === 'jig' && b === 3);
          if (!strong && Math.random() < (mode === 'jig' ? 0.12 : 0.3)) { notes.push(null); continue; }
          if (strong) {
            // move to the nearest chord tone (any octave)
            let best = idx, bd = 99;
            SCALE.forEach((n, i) => { if (tones.some((t) => (n - t) % 12 === 0) && Math.abs(i - idx) < bd) { bd = Math.abs(i - idx); best = i; } });
            idx = best;
          } else {
            idx = clamp(idx + R.pick([-1, -1, 1, 1, 2, -2, 0]), 0, SCALE.length - 1);
          }
          notes.push(SCALE[idx]);
        }
        if (bar === prog.length - 1) { notes.fill(null); notes[0] = 74; }
        return { chord: ch, notes, tones };
      });
    };
    const A = build(progA), B = build(progB);
    return [...A, ...A, ...B, ...B];
  },

  schedule() {
    if (!this.ctx || !this.enabled) { if (this.ctx) this.nextTime = this.ctx.currentTime + 0.1; return; }
    const wantMode = Game.party.on ? 'jig' : 'waltz';
    if (!this.phrase || this.phraseBar >= this.phrase.length || (wantMode !== this.mode && this.step === 0)) {
      if (wantMode !== this.mode || !this.phrase || this.phraseBar >= this.phrase.length) {
        this.mode = wantMode; this.phrase = this.makePhrase(this.mode); this.phraseBar = 0;
      }
    }
    const night = Game.darkness > 0.4;
    const beatDur = this.mode === 'jig' ? 60 / 300 : 60 / (night ? 84 : World.season === 'winter' ? 88 : 100);
    const beats = this.mode === 'jig' ? 6 : 3;
    // if the timer fell behind (a throttled background tab), skip the missed
    // notes rather than playing them all at once
    if (this.nextTime < this.ctx.currentTime - 0.1) this.nextTime = this.ctx.currentTime + 0.05;
    while (this.nextTime < this.ctx.currentTime + 0.35) {
      const bar = this.phrase[this.phraseBar];
      const t = this.nextTime;
      const n = bar.notes[this.step];
      const quiet = night && !Game.party.on ? 0.6 : 1;
      if (n) this.tone(this.midi(n + 12), t, beatDur * 1.6, { type: 'sine', vol: 0.09 * quiet, attack: 0.03, vib: 0.006, rev: 0.4 });
      if (n && this.mode === 'jig') this.tone(this.midi(n + 12), t, beatDur * 1.2, { type: 'triangle', vol: 0.035, attack: 0.01 });
      if (this.step === 0) this.tone(this.midi(bar.tones[0] - 24), t, beatDur * beats * 0.9, { type: 'sine', vol: 0.12 * quiet, attack: 0.02, rev: 0.1 });
      const strum = this.mode === 'jig' ? (this.step % 3 === 0) : this.step > 0;
      if (strum) bar.tones.forEach((tn, i) => this.tone(this.midi(tn - 12), t + i * 0.012, beatDur * 1.1, { type: 'triangle', vol: 0.035 * quiet, attack: 0.005, rev: 0.2 }));
      if (this.mode === 'jig' && this.step % 3 === 0) this.drum(t);
      this.nextTime += beatDur;
      this.step++;
      if (this.step >= beats) { this.step = 0; this.phraseBar++; if (this.phraseBar >= this.phrase.length) { this.phrase = this.makePhrase(Game.party.on ? 'jig' : 'waltz'); this.mode = Game.party.on ? 'jig' : 'waltz'; this.phraseBar = 0; } }
    }
    this.ambient();
  },

  drum(t) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.12);
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + 0.2);
  },

  noiseBuf() {
    if (this._noise) return this._noise;
    const len = this.ctx.sampleRate * 2, b = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return (this._noise = b);
  },

  ambient() {
    const c = this.ctx, t = c.currentTime;
    const season = World.season;
    if (!Game.raining && Game.darkness < 0.3 && season !== 'winter' && Math.random() < (season === 'spring' ? 0.05 : 0.035)) {
      // bird chirps
      const base = R.f(2200, 3800), n = R.i(2, 4);
      for (let i = 0; i < n; i++) {
        const o = c.createOscillator(), g = c.createGain(), st = t + i * 0.11 + 0.05;
        o.type = 'sine'; o.frequency.setValueAtTime(base, st); o.frequency.exponentialRampToValueAtTime(base * R.f(1.2, 1.6), st + 0.07);
        g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(0.03, st + 0.01); g.gain.exponentialRampToValueAtTime(0.001, st + 0.09);
        o.connect(g); g.connect(this.ambBus); o.start(st); o.stop(st + 0.1);
      }
    }
    if (!Game.raining && Game.darkness > 0.4 && (season === 'summer' || season === 'spring') && Math.random() < 0.08) {
      const st = t + 0.05;
      for (let i = 0; i < 3; i++) {
        const o = c.createOscillator(), g = c.createGain(), s2 = st + i * 0.06;
        o.type = 'square'; o.frequency.value = 4400;
        g.gain.setValueAtTime(0, s2); g.gain.linearRampToValueAtTime(0.006, s2 + 0.01); g.gain.linearRampToValueAtTime(0, s2 + 0.04);
        o.connect(g); g.connect(this.ambBus); o.start(s2); o.stop(s2 + 0.05);
      }
    }
    // rain bed
    if (Game.raining && !this.rainNode) {
      const src = c.createBufferSource(); src.buffer = this.noiseBuf(); src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200;
      const g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.18, t, 1.5);
      src.connect(f); f.connect(g); g.connect(this.ambBus); src.start();
      this.rainNode = src; this.rainGain = g;
    } else if (!Game.raining && this.rainNode) {
      const src = this.rainNode;
      this.rainGain.gain.setTargetAtTime(0, t, 1.2);
      setTimeout(() => { try { src.stop(); } catch (e) { /* already stopped */ } }, 5000);
      this.rainNode = null;
    }
  },

  // ---- effects ----
  blip(f1, f2, dur = 0.12, type = 'square', vol = 0.06) {
    if (!this.enabled) return;
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.sfxBus); o.start(t); o.stop(t + dur + 0.02);
  },
  pat() { this.blip(600, 1200, 0.15, 'triangle', 0.12); setTimeout(() => this.blip(900, 1500, 0.12, 'triangle', 0.1), 90); },
  tut() { this.blip(300, 160, 0.2, 'square', 0.05); },
  click() { this.blip(800, 600, 0.05, 'triangle', 0.06); },
  drop() { this.blip(500, 300, 0.1, 'triangle', 0.1); },
  whoosh() {
    if (!this.enabled) return;
    const c = this.ctx, t = c.currentTime, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noiseBuf(); f.type = 'bandpass'; f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(3000, t + 0.6);
    g.gain.setValueAtTime(0.0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.1); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    src.connect(f); f.connect(g); g.connect(this.sfxBus); src.start(t); src.stop(t + 0.8);
  },
  thunder() {
    if (!this.enabled) return;
    const c = this.ctx, t = c.currentTime, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noiseBuf(); f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(60, t + 2.5);
    g.gain.setValueAtTime(0.0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.08); g.gain.exponentialRampToValueAtTime(0.001, t + 3);
    src.connect(f); f.connect(g); g.connect(this.sfxBus); src.start(t); src.stop(t + 3.1);
  },
  chime() { this.blip(880, 1320, 0.25, 'sine', 0.08); setTimeout(() => this.blip(1320, 1760, 0.3, 'sine', 0.07), 140); },
  boom() {
    if (!this.enabled) return;
    const c = this.ctx, t = c.currentTime, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noiseBuf(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(80, t + 0.8);
    g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    const rg = c.createGain(); rg.gain.value = 0.5; g.connect(rg); rg.connect(this.reverb);
    src.start(t); src.stop(t + 1.2);
    // crackle
    for (let i = 0; i < 8; i++) setTimeout(() => this.blip(R.f(2000, 4000), R.f(800, 1500), 0.03, 'square', 0.02), 300 + i * R.f(40, 90));
  },
};
