// Web Audio API Synthesizer for Infinite Chop
// Synthesizes retro 8-bit sound effects and loops procedural background music.

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private musicVolume: GainNode | null = null;
  private sfxVolume: GainNode | null = null;
  
  private isMuted: boolean = false;
  private currentVolumeLevel: number = 0.5; // 0 to 1
  private currentMusicLevel: number = 0.4;
  private currentSfxLevel: number = 0.6;
  
  // Music sequencer state
  private schedulerInterval: any = null;
  private currentBpm: number = 110;
  private currentStep: number = 0;
  private nextNoteTime: number = 0.0;
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // seconds
  private activeMusicWorld: string = '';
  private isPlayingMusic: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      // Node tree: Master Volume -> Destination
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolumeLevel, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);

      // Music Node -> Master Volume
      this.musicVolume = this.ctx.createGain();
      this.musicVolume.gain.setValueAtTime(this.currentMusicLevel, this.ctx.currentTime);
      this.musicVolume.connect(this.masterVolume);

      // SFX Node -> Master Volume
      this.sfxVolume = this.ctx.createGain();
      this.sfxVolume.gain.setValueAtTime(this.currentSfxLevel, this.ctx.currentTime);
      this.sfxVolume.connect(this.masterVolume);
    } catch (e) {
      console.warn("Web Audio API not supported in this browser", e);
    }
  }

  // --- Controls ---

  public setMute(mute: boolean) {
    this.isMuted = mute;
    this.init();
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setValueAtTime(mute ? 0 : this.currentVolumeLevel, this.ctx.currentTime);
    }
  }

  public setMasterVolume(volume: number) {
    this.currentVolumeLevel = Math.max(0, Math.min(1, volume));
    this.init();
    if (this.masterVolume && this.ctx && !this.isMuted) {
      this.masterVolume.gain.setValueAtTime(this.currentVolumeLevel, this.ctx.currentTime);
    }
  }

  public setMusicVolume(volume: number) {
    this.currentMusicLevel = Math.max(0, Math.min(1, volume));
    this.init();
    if (this.musicVolume && this.ctx) {
      this.musicVolume.gain.setValueAtTime(this.currentMusicLevel, this.ctx.currentTime);
    }
  }

  public setSfxVolume(volume: number) {
    this.currentSfxLevel = Math.max(0, Math.min(1, volume));
    this.init();
    if (this.sfxVolume && this.ctx) {
      this.sfxVolume.gain.setValueAtTime(this.currentSfxLevel, this.ctx.currentTime);
    }
  }

  public getVolumeSettings() {
    return {
      muted: this.isMuted,
      master: this.currentVolumeLevel,
      music: this.currentMusicLevel,
      sfx: this.currentSfxLevel,
    };
  }

  // --- Sound Effects Synthesizers ---

  // 1. Chop sound (low pitch wood thud + brief white noise pop)
  public playChop(weaponType: string = 'axe') {
    this.init();
    if (!this.ctx || !this.sfxVolume) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    
    // Wood chop tone (oscillator sweep)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxVolume);

    if (weaponType === 'laser') {
      // High pitch sci-fi zap
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (weaponType === 'chainsaw') {
      // Gritty saw buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(160, now + 0.05);
      osc.frequency.linearRampToValueAtTime(90, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (weaponType === 'hammer') {
      // Deep heavy metallic impact
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      
      // Metallic ring
      const ringOsc = this.ctx.createOscillator();
      const ringGain = this.ctx.createGain();
      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(440, now);
      ringOsc.connect(ringGain);
      ringGain.connect(this.sfxVolume);
      ringGain.gain.setValueAtTime(0.1, now);
      ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      ringOsc.start(now);
      ringOsc.stop(now + 0.1);
    } else {
      // Standard Wood Axe chop
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
      
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      osc.start(now);
      osc.stop(now + 0.08);

      // White noise click for impact splinter
      const bufferSize = this.ctx.sampleRate * 0.02; // 20ms noise
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(1000, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxVolume);
      
      noise.start(now);
      noise.stop(now + 0.02);
    }
  }

  // 2. Coin pickup (two tone pleasant chime)
  public playCoin() {
    this.init();
    if (!this.ctx || !this.sfxVolume) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5 note
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6 note

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.setValueAtTime(0.12, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  // 3. Diamond/Chest pickup (arpeggio upward sweep)
  public playChest() {
    this.init();
    if (!this.ctx || !this.sfxVolume) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const stepDuration = 0.06;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * stepDuration);
      
      gain.gain.setValueAtTime(0.15, now + idx * stepDuration);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * stepDuration + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxVolume!);
      
      osc.start(now + idx * stepDuration);
      osc.stop(now + idx * stepDuration + 0.15);
    });
  }

  // 4. Hit obstacle / Death (heavy crash + frequency drop)
  public playHit() {
    this.init();
    if (!this.ctx || !this.sfxVolume) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;

    // Bass growl
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.45);
    
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxVolume);
    osc.start(now);
    osc.stop(now + 0.5);

    // Crash noise
    const bufferSize = this.ctx.sampleRate * 0.4; // 400ms crash
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxVolume);

    noise.start(now);
    noise.stop(now + 0.4);
  }

  // 5. Combo sound (rising laser sound)
  public playComboUp(comboLevel: number) {
    this.init();
    if (!this.ctx || !this.sfxVolume) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = 200 + comboLevel * 50;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // 6. Game Over screen transition sound (melancholic downscale)
  public playGameOver() {
    this.init();
    if (!this.ctx || !this.sfxVolume) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const notes = [330.00, 293.66, 261.63, 196.00]; // E4, D4, C4, G3
    const stepDuration = 0.18;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * stepDuration);
      
      gain.gain.setValueAtTime(0.15, now + idx * stepDuration);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * stepDuration + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxVolume!);
      
      osc.start(now + idx * stepDuration);
      osc.stop(now + idx * stepDuration + 0.25);
    });
  }

  // --- Procedural Chiptune Music Sequencer ---

  private scheduleNextNote() {
    const secondsPerBeat = 60.0 / this.currentBpm;
    const stepDuration = secondsPerBeat / 4; // 16th notes
    
    while (this.nextNoteTime < this.ctx!.currentTime + this.scheduleAheadTime) {
      this.playSequencerStep(this.currentStep, this.nextNoteTime);
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 16;
    }
  }

  private playSequencerStep(step: number, time: number) {
    if (!this.ctx || !this.musicVolume) return;

    // Procedural musical patterns for each world
    let bassNotes: number[] = [];
    let leadNotes: number[] = [];
    let noiseTrigger: boolean = false; // hi-hat simulation
    
    const C2=65.41, D2=73.42, E2=82.41, F2=87.31, G2=98.00, A2=110.00, B2=123.47;
    const C3=130.81, D3=146.83, E3=164.81, G3=196.00, A3=220.00;
    const C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, C5=523.25, D5=587.33, E5=659.25, G5=783.99, A5=880.00, B5=987.77;

    if (this.activeMusicWorld === 'cyber') {
      this.currentBpm = 125;
      // Dark synthwave: Driving minor scale bass
      const rootPattern = [A2, A2, C3, A2, G2, G2, A2, E2, F2, F2, A2, F2, G2, G2, B2, G2];
      bassNotes = [rootPattern[step]];
      
      // Cyber lead beeps on specific steps
      const leadPattern = [0, 0, E4, 0, G4, 0, A4, 0, 0, G4, E4, 0, D4, 0, A4, 0];
      if (leadPattern[step] > 0) leadNotes = [leadPattern[step]];
      
      // Cyber drums: noisy hat on odd steps, snare on 4 and 12
      noiseTrigger = (step % 2 === 1) || (step === 4 || step === 12);
    } else if (this.activeMusicWorld === 'ice') {
      this.currentBpm = 95;
      // Chill crystalline music: slow, arpeggiated high pitches
      const baseBass = [C2, 0, G2, 0, E2, 0, B2, 0, F2, 0, C3, 0, G2, 0, B2, 0];
      if (baseBass[step] > 0) bassNotes = [baseBass[step]];
      
      // Glacial bell tones
      const crystalBells = [C5, E5, G5, B5, A5, G5, E5, D5, C5, 0, 0, 0, 0, 0, 0, 0];
      const transposedStep = (step + 4) % 16;
      if (step % 4 === 0 && crystalBells[transposedStep] > 0) {
        leadNotes = [crystalBells[transposedStep] * 1.5]; // transpose higher
      }
      noiseTrigger = (step === 0 || step === 8); // minimal drumbeat
    } else if (this.activeMusicWorld === 'city') {
      this.currentBpm = 115;
      // Jazz/Upbeat pop: walking bass line
      const walk = [F2, A2, C3, D3, G2, B2, D3, E3, C3, E3, G3, A3, F2, C3, A2, G2];
      bassNotes = [walk[step]];
      
      const cityTheme = [A4, 0, C5, A4, G4, 0, F4, D4, E4, 0, G4, 0, C4, 0, 0, 0];
      if (cityTheme[step] > 0) leadNotes = [cityTheme[step]];
      
      noiseTrigger = (step % 4 === 2); // hi-hat swing
    } else {
      // DEFAULT / FOREST WORLD: Sweet pentatonic acoustic feel
      this.currentBpm = 105;
      // Placid, harmonic bass
      const forestBass = [C2, C2, G2, C2, F2, F2, C2, G2, A2, A2, E2, A2, G2, G2, D2, G2];
      bassNotes = [forestBass[step]];

      // Forest whistle melody
      const forestWhistle = [E4, G4, A4, C5, A4, G4, E4, D4, C4, E4, G4, A4, G4, 0, 0, 0];
      if (step % 2 === 0 && forestWhistle[step / 2] > 0) {
        leadNotes = [forestWhistle[step / 2]];
      }
      
      noiseTrigger = (step % 4 === 0);
    }

    // Play synthesized bass note
    if (bassNotes.length > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle'; // Smooth bass
      osc.frequency.setValueAtTime(bassNotes[0], time);
      
      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
      
      osc.connect(gain);
      gain.connect(this.musicVolume);
      osc.start(time);
      osc.stop(time + 0.25);
    }

    // Play synthesized melody/lead note
    if (leadNotes.length > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = this.activeMusicWorld === 'cyber' ? 'square' : 'sine'; // Retro lead vs clean chime
      osc.frequency.setValueAtTime(leadNotes[0], time);
      
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      
      osc.connect(gain);
      gain.connect(this.musicVolume);
      osc.start(time);
      osc.stop(time + 0.18);
    }

    // Play synthesized drum (noise hat / snare)
    if (noiseTrigger) {
      const bufferSize = this.ctx.sampleRate * 0.015; // 15ms hit
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      // cyber snare has lower cut-off, standard hats have high cut-off
      filter.frequency.setValueAtTime((step === 4 || step === 12) && this.activeMusicWorld === 'cyber' ? 1000 : 7000, time);
      
      const gain = this.ctx.createGain();
      const vol = (step === 4 || step === 12) && this.activeMusicWorld === 'cyber' ? 0.08 : 0.02;
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicVolume);
      
      source.start(time);
      source.stop(time + 0.015);
    }
  }

  public startMusic(worldName: string = 'forest') {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.activeMusicWorld = worldName;
    if (this.isPlayingMusic) return; // Already running

    this.isPlayingMusic = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime;
    
    // Scheduler loop
    const scheduler = () => {
      if (!this.isPlayingMusic) return;
      this.scheduleNextNote();
      this.schedulerInterval = setTimeout(scheduler, this.lookahead);
    };
    
    scheduler();
  }

  public stopMusic() {
    this.isPlayingMusic = false;
    if (this.schedulerInterval) {
      clearTimeout(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    this.activeMusicWorld = '';
  }

  public switchMusicWorld(worldName: string) {
    if (this.activeMusicWorld === worldName) return;
    if (this.isPlayingMusic) {
      this.activeMusicWorld = worldName;
      this.currentStep = 0; // reset bar rhythm
    } else {
      this.startMusic(worldName);
    }
  }
}

export const sound = new AudioEngine();
