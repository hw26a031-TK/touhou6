export type GameDifficulty = 'easy' | 'normal' | 'hard' | 'lunatic' | 'custom';

export interface DifficultyConfig {
  densityMultiplier: number; // 0.5 to 3.0
  speedMultiplier: number;   // 0.5 to 2.0
  bossHealthMultiplier: number;
  playerLives: number;
  playerBombs: number;
  grazeScoreValue: number;
}

export type ScreenState = 'boot' | 'title' | 'select' | 'game' | 'pause' | 'settings' | 'gameover' | 'victory';

export interface Player {
  x: number;
  y: number;
  radius: number; // visual radius
  hitboxRadius: number; // true hitbox
  speed: number;
  slowSpeed: number;
  character: 'reimu' | 'marisa';
  lives: number;
  bombs: number;
  power: number; // 1.0 to 4.0
  score: number;
  graze: number;
  invulnFrames: number;
  isFocused: boolean;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'ring' | 'star' | 'laser' | 'arrow' | 'rice' | 'crystal';
  isEnemy: boolean;
  damage?: number;
  grazed?: boolean;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  shootCooldown: number;
  patternTimer: number;
  behavior: 'basic' | 'sine' | 'stay_shoot' | 'boss';
  name?: string;
  isBoss: boolean;
  currentSpellCard?: string;
  phase?: number;
}

export interface SpellCard {
  name: string;
  bossHealthTrigger: number; // health remaining trigger
  timeLimit: number; // seconds
  densityMultiplier: number;
}

export const DIFFICULTY_PRESETS: Record<GameDifficulty, DifficultyConfig> = {
  easy: {
    densityMultiplier: 0.5,
    speedMultiplier: 0.8,
    bossHealthMultiplier: 0.7,
    playerLives: 5,
    playerBombs: 3,
    grazeScoreValue: 100,
  },
  normal: {
    densityMultiplier: 1.0,
    speedMultiplier: 1.0,
    bossHealthMultiplier: 1.0,
    playerLives: 3,
    playerBombs: 2,
    grazeScoreValue: 200,
  },
  hard: {
    densityMultiplier: 1.8,
    speedMultiplier: 1.2,
    bossHealthMultiplier: 1.3,
    playerLives: 2,
    playerBombs: 2,
    grazeScoreValue: 500,
  },
  lunatic: {
    densityMultiplier: 3.8,
    speedMultiplier: 1.7,
    bossHealthMultiplier: 2.2,
    playerLives: 1,
    playerBombs: 1,
    grazeScoreValue: 1500,
  },
  custom: {
    densityMultiplier: 1.2,
    speedMultiplier: 1.0,
    bossHealthMultiplier: 1.0,
    playerLives: 3,
    playerBombs: 2,
    grazeScoreValue: 250,
  }
};
