export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  score: number;
  lives: number;
  level: number;
  playerX: number;
  enemies: Enemy[];
  bullets: Bullet[];
  enemyBullets: Bullet[];
  barriers: Barrier[];
  mothership: Mothership | null;
  particles: Particle[];
  lastHitTime: number;
}

export interface Enemy {
  x: number;
  y: number;
  type: number;
  isAlive: boolean;
  speed: number;
  phase?: number;
}

export interface Bullet {
  x: number;
  y: number;
  speed: number;
  isActive: boolean;
}

export interface Barrier {
  x: number;
  y: number;
  health: number;
  segments: boolean[][];
  segmentSize: number;
}

export interface Mothership {
  x: number;
  y: number;
  speed: number;
  isAlive: boolean;
  points: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface GameMetrics {
  shotsAttempted: number;
  shotsHit: number;
  reactionTimes: number[];
  survivalTime: number;
  enemiesKilled: number;
  levelStartTime: number;
}

export interface DifficultySettings {
  enemySpeed: number;
  enemyFireRate: number;
  enemySpawnPattern: 'normal' | 'wave' | 'random' | 'strategic';
  enemyBehavior: 'static' | 'aggressive' | 'evasive';
}