// Sound Effects and Procedural Chiptune Music using Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmIntervalId: any = null;
  private activeBgmOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private currentTrack: 'septette' | 'unowen' | null = null;

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      if (this.currentTrack) {
        this.playBGM(this.currentTrack);
      }
    }
    return this.isMuted;
  }

  getMutedState(): boolean {
    return this.isMuted;
  }

  private createOscillator(type: OscillatorType, frequency: number, duration: number, gainStart: number): { osc: OscillatorNode; gainNode: GainNode } | null {
    if (!this.ctx || this.isMuted) return null;
    this.init();

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    gainNode.gain.setValueAtTime(gainStart, this.ctx.currentTime);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    return { osc, gainNode };
  }

  // --- Sound Effects ---

  playShoot() {
    const s = this.createOscillator('square', 880, 0.08, 0.05);
    if (!s || !this.ctx) return;
    s.osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.08);
    s.gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    s.osc.start();
    s.osc.stop(this.ctx.currentTime + 0.08);
  }

  playGraze() {
    const s = this.createOscillator('triangle', 3000, 0.05, 0.12);
    if (!s || !this.ctx) return;
    s.osc.frequency.setValueAtTime(3200, this.ctx.currentTime + 0.02);
    s.gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime + 0.02);
    s.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    s.osc.start();
    s.osc.stop(this.ctx.currentTime + 0.05);
  }

  playEnemyHit() {
    const s = this.createOscillator('sine', 440, 0.04, 0.04);
    if (!s || !this.ctx) return;
    s.osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.04);
    s.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    s.osc.start();
    s.osc.stop(this.ctx.currentTime + 0.04);
  }

  playEnemyDefeat() {
    // Noise simulation for explosion
    if (!this.ctx || this.isMuted) return;
    this.init();

    const bufferSize = this.ctx.sampleRate * 0.15; // 0.15 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  playPlayerHit() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    // Deep frequency explosion
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();

    // Additional synthesizer tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.4);
    oscGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    oscGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playBomb() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    // sweeping epic synthesizer noise
    const duration = 1.5;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.5);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + duration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(100, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.6);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);
    filter.Q.setValueAtTime(5, this.ctx.currentTime);

    gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playSpellCard() {
    const duration = 1.2;
    const osc1 = this.createOscillator('sawtooth', 220, duration, 0.08);
    const osc2 = this.createOscillator('square', 330, duration, 0.06);

    if (!osc1 || !osc2 || !this.ctx) return;

    osc1.osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.8);
    osc1.gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc2.osc.frequency.exponentialRampToValueAtTime(2640, this.ctx.currentTime + 0.8);
    osc2.gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc1.osc.start();
    osc1.osc.stop(this.ctx.currentTime + duration);
    osc2.osc.start();
    osc2.osc.stop(this.ctx.currentTime + duration);
  }

  // --- Background Music Sequences ---
  // Simple retro polyphonic chiptune sequence.
  // Plays iconic "Septette for the Dead Princess" or "U.N. Owen Was Her?" bassline & melody.

  playBGM(track: 'septette' | 'unowen') {
    this.currentTrack = track;
    if (this.isMuted) return;
    this.stopBGM();
    this.init();

    if (!this.ctx) return;

    // Define sequences in arrays of frequencies and relative beat durations.
    // Time per beat (approx 140 BPM => 1 beat = 0.428s, 16th note = 0.107s)
    const stepDuration = 0.11; 

    // Septette theme (Remilia's theme): A minor / D minor feeling
    // Melody notes mapped to semitones above mid C (C4=0)
    // Mel: E4, G#4, A4, B4, C5, B4, A4, G#4, F4, G#4, A4...
    const septetteMelody = [
      9, 11, 12, 11,  9, 11, 12, 14,
      12, 11, 9, 8,   9, 11, 12, 11,
      9, 11, 12, 11,  9, 11, 12, 14,
      16, 14, 12, 11, 12, 14, 16, 17,
      16, 14, 12, 11, 12, 11, 9, 8,
      9, 9, 11, 12,   11, 9, 8, 5,
      9, 11, 12, 11,  9, 11, 12, 14,
      12, 14, 16, 17, 19, 17, 16, 14
    ];

    // Simple bass notes (usually root notes)
    const septetteBass = [
      -12, -12, -12, -12, -12, -12, -12, -12,
      -15, -15, -15, -15, -15, -15, -15, -15,
      -12, -12, -12, -12, -12, -12, -12, -12,
      -7,  -7,  -7,  -7,  -8,  -8,  -10, -10,
      -12, -12, -12, -12, -12, -12, -12, -12,
      -15, -15, -15, -15, -15, -15, -15, -15,
      -12, -12, -12, -12, -12, -12, -12, -12,
      -7,  -7,  -5,  -5,  -7,  -7,  -12, -12
    ];

    // U.N. Owen Was Her? (Flandre's theme): E minor, very bouncy, fast
    // Mel: E5, B4, G4, B4, E5, B4, G4, B4 ...
    const unowenMelody = [
      12, 7, 3, 7,  12, 7, 3, 7,
      14, 7, 3, 7,  14, 7, 3, 7,
      15, 10, 7, 10, 15, 10, 7, 10,
      14, 9, 5, 9,   14, 9, 11, 12,
      12, 7, 3, 7,  12, 7, 3, 7,
      14, 7, 5, 7,  14, 7, 5, 7,
      15, 12, 8, 12, 17, 12, 8, 12,
      19, 14, 11, 14, 19, 14, 11, 7
    ];

    const unowenBass = [
      -24, -24, -24, -24, -21, -21, -21, -21,
      -20, -20, -20, -20, -19, -19, -17, -15,
      -24, -24, -24, -24, -12, -12, -12, -12,
      -15, -15, -15, -15, -14, -14, -13, -12,
      -24, -24, -12, -12, -24, -24, -12, -12,
      -22, -22, -10, -10, -22, -22, -10, -10,
      -20, -20, -8,  -8,  -20, -20, -8,  -8,
      -19, -19, -19, -19, -17, -17, -15, -12
    ];

    const melody = track === 'septette' ? septetteMelody : unowenMelody;
    const bass = track === 'septette' ? septetteBass : unowenBass;

    let step = 0;

    const playStep = () => {
      if (this.isMuted || !this.ctx) return;

      const time = this.ctx.currentTime;

      // Note helper
      const mToFreq = (m: number) => 261.63 * Math.pow(2, m / 12);

      // Play Melody (Pulse / Triangle wave for soft flute-like feel)
      const melNote = melody[step % melody.length];
      if (melNote !== null) {
        // Melodic note
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.type = track === 'unowen' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(mToFreq(melNote), time);
        
        // Envelope
        gainNode.gain.setValueAtTime(0.04, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 0.9);

        osc.start(time);
        osc.stop(time + stepDuration * 0.9);

        // Keep tracker to stop them if needed
        this.activeBgmOscillators.push({ osc, gain: gainNode });
      }

      // Play Bass (Square wave for heavy synthetic punch)
      const bassNote = bass[step % bass.length];
      if (bassNote !== null && step % 2 === 0) {
        const oscBass = this.ctx.createOscillator();
        const gainBass = this.ctx.createGain();
        oscBass.connect(gainBass);
        gainBass.connect(this.ctx.destination);

        oscBass.type = 'triangle'; // triangle is pleasant as bass
        oscBass.frequency.setValueAtTime(mToFreq(bassNote), time);

        gainBass.gain.setValueAtTime(0.03, time);
        gainBass.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 1.8);

        oscBass.start(time);
        oscBass.stop(time + stepDuration * 1.8);

        this.activeBgmOscillators.push({ osc: oscBass, gain: gainBass });
      }

      // Cleanup finished oscillators to prevent leaks
      if (this.activeBgmOscillators.length > 50) {
        this.activeBgmOscillators.splice(0, 20);
      }

      step++;
    };

    // run sequencer
    this.bgmIntervalId = setInterval(playStep, stepDuration * 1000);
  }

  stopBGM() {
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    // Stop all playing oscillators immediately
    this.activeBgmOscillators.forEach(({ osc, gain }) => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.activeBgmOscillators = [];
  }
}

export const audio = new SoundManager();
