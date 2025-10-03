// Simple retro sound effects using Web Audio API

class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enemyMoveOscillator: OscillatorNode | null = null;
  private enemyMoveGain: GainNode | null = null;
  private moveFrequencyIndex = 0;
  private moveFrequencies = [220, 196, 175, 165]; // Descending tone pattern

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
    }
  }

  private playBeep(frequency: number, duration: number, type: OscillatorType = 'square') {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.value = 0.1;
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  startEnemyMove() {
    // Just reset the index, no constant oscillator
    this.moveFrequencyIndex = 0;
  }

  stepEnemyMove() {
    // Simple beep on each step
    this.moveFrequencyIndex = (this.moveFrequencyIndex + 1) % this.moveFrequencies.length;
    this.playBeep(this.moveFrequencies[this.moveFrequencyIndex], 0.08, 'square');
  }

  stopEnemyMove() {
    // Reset index
    this.moveFrequencyIndex = 0;
  }

  playerShoot() {
    // Quick ascending beep
    this.playBeep(200, 0.1, 'square');
    setTimeout(() => this.playBeep(400, 0.05, 'square'), 50);
  }

  barrierHit() {
    // Low thud sound
    this.playBeep(80, 0.1, 'sawtooth');
  }

  playerHit() {
    // Descending explosion sound
    if (!this.audioContext || !this.masterGain) return;
    
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playBeep(300 - i * 50, 0.15, 'sawtooth');
      }, i * 40);
    }
  }

  mothershipKilled() {
    // Warbling descending sound
    if (!this.audioContext || !this.masterGain) return;
    
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.playBeep(800 - i * 80, 0.08, 'sine');
      }, i * 30);
    }
  }

  enemyKilled() {
    // Quick pop
    this.playBeep(150, 0.08, 'square');
  }
}

export const soundManager = new SoundManager();
