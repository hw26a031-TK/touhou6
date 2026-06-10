import React, { useEffect, useRef, useState } from 'react';
import { GameDifficulty, DifficultyConfig, Player, Bullet, Enemy, SpellCard } from '../types';
import { audio } from '../audio';
import { Sparkles, Star, RefreshCw, VolumeX, ShieldAlert, Award } from 'lucide-react';

interface GameCanvasProps {
  difficulty: GameDifficulty;
  config: DifficultyConfig;
  character: 'reimu' | 'marisa';
  onBackToMenu: () => void;
  activeButtons: Record<string, boolean>; // Button states from virtual Switch Console
}

// Fixed dimensions for the arcade play zone (internal resolution)
const GAME_WIDTH = 440;
const GAME_HEIGHT = 600;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  difficulty,
  config,
  character,
  onBackToMenu,
  activeButtons,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // High score tracking
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('touhou_switch_high_score') || '100000', 10);
  });

  // Game metrics displayed in React overlays/panels
  const [gameState, setGameState] = useState<{
    score: number;
    lives: number;
    bombs: number;
    graze: number;
    power: number;
    bossHealth: number;
    bossMaxHealth: number;
    bossName: string | null;
    activeSpellCard: string | null;
    spellCardTimer: number;
    message: string | null;
    isOver: boolean;
    isVictorious: boolean;
  }>({
    score: 0,
    lives: config.playerLives,
    bombs: config.playerBombs,
    graze: 0,
    power: 1.0,
    bossHealth: 0,
    bossMaxHealth: 0,
    bossName: null,
    activeSpellCard: null,
    spellCardTimer: 0,
    message: null,
    isOver: false,
    isVictorious: false,
  });

  const [paused, setPaused] = useState(false);
  const [sessionId, setSessionId] = useState(0);
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Refs for real-time game loop state (avoiding React re-render lag)
  const playerRef = useRef<Player>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 80,
    radius: 12,
    hitboxRadius: 2.2,
    speed: 4.8,
    slowSpeed: 2.1,
    character: character,
    lives: config.playerLives,
    bombs: config.playerBombs,
    power: 1.0,
    score: 0,
    graze: 0,
    invulnFrames: 60, // starting shield
    isFocused: false,
  });

  const keysPressed = useRef<Record<string, boolean>>({});
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; life: number; maxLife: number; size: number }[]>([]);
  const scoreItemsRef = useRef<{ x: number; y: number; type: 'power' | 'score'; vy: number }[]>([]);
  const bgParticlesRef = useRef<{ x: number; y: number; speed: number; size: number; alpha: number }[]>([]);
  const isGameOverTriggeredRef = useRef(false);

  // BGM looping
  useEffect(() => {
    // Start BGM based on stage progress or bosses
    audio.playBGM(difficulty === 'lunatic' || difficulty === 'hard' ? 'unowen' : 'septette');
    return () => {
      audio.stopBGM();
    };
  }, [difficulty]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysPressed.current[k] = true;
      if (e.key === 'Shift') keysPressed.current['shift'] = true;

      // Prevent window scrolling when playing the game of shooting daggers
      const scrollPreventKeys = [
        'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 
        'w', 's', 'a', 'd', 'z', 'x', ' ', 'shift', 'escape'
      ];
      if (scrollPreventKeys.includes(k) || scrollPreventKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      if (e.key === 'Escape') {
        keysPressed.current['escape'] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysPressed.current[k] = false;
      if (e.key === 'Shift') keysPressed.current['shift'] = false;
      
      const scrollPreventKeys = [
        'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 
        'w', 's', 'a', 'd', 'z', 'x', ' ', 'shift', 'escape'
      ];
      if (scrollPreventKeys.includes(k) || scrollPreventKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });

    // Initialize background nebulas/starfield particles
    const bgs = [];
    for (let i = 0; i < 40; i++) {
      bgs.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        speed: Math.random() * 1.5 + 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.4 + 0.2,
      });
    }
    bgParticlesRef.current = bgs;

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Sync virtual Switch Buttons from props to loop
  useEffect(() => {
    keysPressed.current['w'] = activeButtons['up'] || activeButtons['L'];
    keysPressed.current['arrowup'] = activeButtons['up'];
    
    keysPressed.current['s'] = activeButtons['down'];
    keysPressed.current['arrowdown'] = activeButtons['down'];

    keysPressed.current['a'] = activeButtons['left'];
    keysPressed.current['arrowleft'] = activeButtons['left'];

    keysPressed.current['d'] = activeButtons['right'];
    keysPressed.current['arrowright'] = activeButtons['right'];

    // Shoot
    keysPressed.current['z'] = activeButtons['A'];
    
    // Bomb button active edge setter
    if (activeButtons['B']) {
      keysPressed.current['b_btn'] = true;
    } else {
      keysPressed.current['b_btn'] = false;
    }
    // Focus slow-speed
    keysPressed.current['shift'] = activeButtons['X'];

    // Pause plus
    if (activeButtons['plus']) {
      keysPressed.current['plus_btn'] = true;
    }
  }, [activeButtons]);

  // Bomb triggers
  const triggerPlayerBomb = () => {
    const player = playerRef.current;
    if (player.bombs > 0 && !gameState.isOver) {
      audio.playBomb();
      player.bombs--;
      player.invulnFrames = 150; // invincible during massive bomb storm

      // Bullet erase on entire screen + damage
      bulletsRef.current = [];
      enemiesRef.current.forEach(e => {
        e.health -= 450; // heavy blast damage
      });

      // Spawn large sweeping circular bomb particles on rendering
      for (let i = 0; i < 120; i++) {
        const angle = (Math.PI * 2 * i) / 120;
        particlesRef.current.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(angle) * 7.5,
          vy: Math.sin(angle) * 7.5,
          color: 'rgba(239, 68, 68, 0.8)',
          life: 55,
          maxLife: 55,
          size: Math.random() * 5 + 3,
        });
      }

      setGameState(s => ({ ...s, bombs: player.bombs }));
    }
  };

  const handleShootKey = () => {
    const player = playerRef.current;
    // Launch character-specific projectiles
    const idSeed = Date.now() + Math.random();

    if (player.character === 'reimu') {
      audio.playShoot();
      // Forward paper amulets
      bulletsRef.current.push({
        id: idSeed + 0.1,
        x: player.x - 8,
        y: player.y - 15,
        vx: 0,
        vy: -12,
        radius: 4,
        color: '#ff4d4d',
        type: 'rice',
        isEnemy: false,
        damage: 15,
      });
      bulletsRef.current.push({
        id: idSeed + 0.2,
        x: player.x + 8,
        y: player.y - 15,
        vx: 0,
        vy: -12,
        radius: 4,
        color: '#ff4d4d',
        type: 'rice',
        isEnemy: false,
        damage: 15,
      });

      // Medium Level Homing amulates based on power level
      if (player.power >= 1.0) {
        // Initial spread upward-left and upward-right for a beautiful fan-out look
        const angle1 = -Math.PI / 2 - 0.25; // slightly left
        const angle2 = -Math.PI / 2 + 0.25; // slightly right

        bulletsRef.current.push({
          id: idSeed + 0.3,
          x: player.x - 20,
          y: player.y,
          vx: Math.cos(angle1) * 8,
          vy: Math.sin(angle1) * 8,
          radius: 5,
          color: '#ff8080',
          type: 'ring',
          isEnemy: false,
          damage: 10,
        });

        const angle3 = Math.atan2(-10, -50); // placeholder logic removed, keeping clean target structure
        bulletsRef.current.push({
          id: idSeed + 0.4,
          x: player.x + 20,
          y: player.y,
          vx: Math.cos(angle2) * 8,
          vy: Math.sin(angle2) * 8,
          radius: 5,
          color: '#ff8080',
          type: 'ring',
          isEnemy: false,
          damage: 10,
        });
      }
    } else { // MARISA
      audio.playShoot();
      // Heavy high speed magic needle lasers
      bulletsRef.current.push({
        id: idSeed + 0.1,
        x: player.x - 4,
        y: player.y - 20,
        vx: 0,
        vy: -18,
        radius: 2.5,
        color: '#ffff33',
        type: 'laser',
        isEnemy: false,
        damage: 25,
      });
      bulletsRef.current.push({
        id: idSeed + 0.2,
        x: player.x + 4,
        y: player.y - 20,
        vx: 0,
        vy: -18,
        radius: 2.5,
        color: '#ffff33',
        type: 'laser',
        isEnemy: false,
        damage: 25,
      });

      if (player.power >= 1.0) {
        // Angled side rockets
        bulletsRef.current.push({
          id: idSeed + 0.3,
          x: player.x - 16,
          y: player.y,
          vx: -1,
          vy: -16,
          radius: 3,
          color: '#ffbb33',
          type: 'star',
          isEnemy: false,
          damage: 15,
        });
        bulletsRef.current.push({
          id: idSeed + 0.4,
          x: player.x + 16,
          y: player.y,
          vx: 1,
          vy: -16,
          radius: 3,
          color: '#ffbb33',
          type: 'star',
          isEnemy: false,
          damage: 15,
         });
      }
    }
  };

  // Main Canvas game Loop
  useEffect(() => {
    let animationId: number;
    let shootInterval = 0;
    let stageTimer = 0;
    let bossSpawning = false;
    let victoryTriggered = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset loop data
    playerRef.current = {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 80,
      radius: 12,
      hitboxRadius: 2.2,
      speed: 4.8,
      slowSpeed: 2.1,
      character: character,
      lives: config.playerLives,
      bombs: config.playerBombs,
      power: 1.0,
      score: 0,
      graze: 0,
      invulnFrames: 80,
      isFocused: false,
    };
    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    scoreItemsRef.current = [];

    // Trigger Initial sound
    audio.playSpellCard();

    const loop = () => {
      // Check Plus button or Escape key for pause safely within loop
      if (keysPressed.current['plus_btn'] || keysPressed.current['escape']) {
        audio.playEnemyHit();
        setPaused((p) => !p);
        keysPressed.current['plus_btn'] = false;
        keysPressed.current['escape'] = false;
      }

      if (pausedRef.current) {
        drawPauseScreen();
        animationId = requestAnimationFrame(loop);
        return;
      }

      // Check Bomb trigger safely (B button or X key)
      if (keysPressed.current['b_btn'] || keysPressed.current['x']) {
        triggerPlayerBomb();
        keysPressed.current['b_btn'] = false;
        keysPressed.current['x'] = false;
      }

      stageTimer++;

      // 1. UPDATE LOGIC
      updatePlayerMovement();
      updateProjectiles();
      updateEnemies(stageTimer);
      updateCollisions();
      updateScoreItems();
      updateBackgroundAndParticles();

      // Spawn periodic Stage enemies beforehand
      if (stageTimer < 650 && stageTimer % 75 === 0 && !bossSpawning) {
        spawnWave();
      }

      // Spawn Boss: Remilia Scarlet!
      if (stageTimer >= 750 && !bossSpawning && enemiesRef.current.filter(e => e.isBoss).length === 0) {
        bossSpawning = true;
        spawnBoss();
      }

      // Check shoot rates (automatic rapid fire when hold Z/A)
      if (keysPressed.current['z'] || keysPressed.current['a']) {
        shootInterval++;
        if (shootInterval % 6 === 0) {
          handleShootKey();
        }
      }

      // 2. RENDERING LOGIC
      renderCanvas(ctx);

      // 3. CHECK ENDGAME STATS
      if (playerRef.current.lives < 0 && !isGameOverTriggeredRef.current) {
        isGameOverTriggeredRef.current = true;
        triggerGameOver();
      }

      animationId = requestAnimationFrame(loop);
    };

    const drawPauseScreen = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.font = '28px "Space Grotesk", sans-serif';
      ctx.fillText('PAUSE', GAME_WIDTH / 2, GAME_HEIGHT / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('PRESS ESC / PLUS TO RESUME', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
    };

    // Spawn minor fairy minions
    const spawnWave = () => {
      const type = Math.random() > 0.5 ? 'sine' : 'stay_shoot';
      const side = Math.random() > 0.5;
      const count = 3 + Math.floor(Math.random() * 3);

      for (let i = 0; i < count; i++) {
        enemiesRef.current.push({
          id: Date.now() + i * 100,
          x: side ? 40 + i * 50 : GAME_WIDTH - 40 - i * 50,
          y: -40 - i * 30,
          vx: side ? 1 : -1,
          vy: 2.2,
          width: 25,
          height: 25,
          health: 45,
          maxHealth: 45,
          shootCooldown: 40 + Math.random() * 50,
          patternTimer: 0,
          behavior: type,
          isBoss: false,
        });
      }
    };

    // Spawn Stage Boss: Remilia Scarlet (レミリア・スカーレット)
    const spawnBoss = () => {
      audio.playSpellCard();
      const bossHealth = 8500 * config.bossHealthMultiplier;
      enemiesRef.current.push({
        id: 99999,
        x: GAME_WIDTH / 2,
        y: -100, // scrolling down from screen top
        vx: 0,
        vy: 1.5,
        width: 60,
        height: 60,
        health: bossHealth,
        maxHealth: bossHealth,
        shootCooldown: 45,
        patternTimer: 0,
        behavior: 'boss',
        name: 'レミリア・スカーレット',
        isBoss: true,
        currentSpellCard: '神術「エリュシオン幻夢」',
        phase: 1,
      });

      setGameState(s => ({
        ...s,
        bossName: 'Remilia Scarlet',
        bossHealth: bossHealth,
        bossMaxHealth: bossHealth,
        activeSpellCard: '紅魔「スカーレット・シュート」',
        spellCardTimer: 60,
        message: 'WARNING! BOSS INCOMING!',
      }));

      // clear message shortly
      setTimeout(() => {
        setGameState(s => ({ ...s, message: null }));
      }, 3500);
    };

    const triggerGameOver = () => {
      setGameState(s => ({ ...s, isOver: true }));
      // Save highscore
      if (playerRef.current.score > highScore) {
        setHighScore(playerRef.current.score);
        localStorage.setItem('touhou_switch_high_score', playerRef.current.score.toString());
      }
    };

    animationId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [sessionId, config, character]);

  // Update position of Reimu based on key maps
  const updatePlayerMovement = () => {
    const player = playerRef.current;
    if (gameState.isOver) return;

    let dx = 0;
    let dy = 0;

    // Movement checking
    if (keysPressed.current['w'] || keysPressed.current['arrowup']) dy = -1;
    if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dy = 1;
    if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx = -1;
    if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx = 1;

    // Focus slows down players for micro dodging
    const focused = keysPressed.current['shift'];
    player.isFocused = focused;
    const currentSpeed = focused ? player.slowSpeed : player.speed;

    // Diagonal Speed Normalization
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx = dx / length;
      dy = dy / length;
    }

    player.x += dx * currentSpeed;
    player.y += dy * currentSpeed;

    // Outer Boundary Constraints
    if (player.x < 15) player.x = 15;
    if (player.x > GAME_WIDTH - 15) player.x = GAME_WIDTH - 15;
    if (player.y < 30) player.y = 30;
    if (player.y > GAME_HEIGHT - 30) player.y = GAME_HEIGHT - 30;

    // Invulnerability Frames
    if (player.invulnFrames > 0) player.invulnFrames--;
  };

  const updateProjectiles = () => {
    const bullets = bulletsRef.current;

    // Movement + filter outbound
    bulletsRef.current = bullets.filter((b) => {
      if (!b.isEnemy && b.type === 'ring') {
        // Homing logic: find closest active enemy on screen
        let closestEnemy: Enemy | null = null;
        let minDist = 999999;
        
        enemiesRef.current.forEach((e) => {
          if (e.y > -30 && e.y < GAME_HEIGHT) {
            const dist = Math.hypot(e.x - b.x, e.y - b.y);
            if (dist < minDist) {
              minDist = dist;
              closestEnemy = e;
            }
          }
        });

        if (closestEnemy) {
          const target: Enemy = closestEnemy;
          const angle = Math.atan2(target.y - b.y, target.x - b.x);
          const speed = 9.5; // Satisfying homing bullet speed
          const curAngle = Math.atan2(b.vy, b.vx);
          
          let diff = angle - curAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          
          // Satisfying rotation angular velocity per frame
          const rotSpeed = 0.16;
          const newAngle = curAngle + Math.max(-rotSpeed, Math.min(rotSpeed, diff));
          
          b.vx = Math.cos(newAngle) * speed;
          b.vy = Math.sin(newAngle) * speed;
        } else {
          // If no living enemies, guide smoothly upward
          const speed = 9.5;
          const curAngle = Math.atan2(b.vy, b.vx);
          let diff = -Math.PI / 2 - curAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          const newAngle = curAngle + diff * 0.1;
          b.vx = Math.cos(newAngle) * speed;
          b.vy = Math.sin(newAngle) * speed;
        }
      }

      b.x += b.vx;
      b.y += b.vy;

      // check boundaries with slight buffer
      return b.x >= -30 && b.x <= GAME_WIDTH + 30 && b.y >= -30 && b.y <= GAME_HEIGHT + 30;
    });
  };

  // Minor enemy behaviors & Boss bullet cascades
  const updateEnemies = (stageTimer: number) => {
    const enemies = enemiesRef.current;

    enemies.forEach((enemy) => {
      enemy.patternTimer++;

      if (enemy.isBoss) {
        // Boss Movement patterns: floating left and right smoothly
        if (enemy.y < 120) {
          enemy.y += enemy.vy; // scrolling sequence
        } else {
          // Floating sinusoidal
          enemy.x = GAME_WIDTH / 2 + Math.sin(stageTimer / 50) * 110;
          enemy.y = 120 + Math.cos(stageTimer / 70) * 20;

          // BOSS SHOOT BULLET PATTERNS (The Danmaku logic adjusted by user config.densityMultiplier)
          enemy.shootCooldown--;
          if (enemy.shootCooldown <= 0) {
            triggerBossDanmaku(enemy);
          }
        }
      } else {
        // Normal Fairy minions
        if (enemy.behavior === 'sine') {
          enemy.y += enemy.vy;
          enemy.x += Math.sin(enemy.patternTimer / 15) * 2.5;
        } else if (enemy.behavior === 'stay_shoot') {
          if (enemy.y < 150) {
            enemy.y += enemy.vy;
          } else {
            enemy.x += enemy.vx * 0.5;
          }
        }

        // normal bullet trigger
        enemy.shootCooldown--;
        if (enemy.shootCooldown <= 0) {
          triggerNormalDanmaku(enemy);
          enemy.shootCooldown = 60 + Math.random() * 40;
        }
      }
    });

    // Clean dead enemies or outbound
    enemiesRef.current = enemies.filter((e) => {
      if (e.health <= 0) {
        audio.playEnemyDefeat();
        // Give score
        playerRef.current.score += e.isBoss ? 50000 : 500;
        setGameState(s => ({ ...s, score: playerRef.current.score }));

        // Spawn bonus visual items
        scoreItemsRef.current.push({
          x: e.x,
          y: e.y,
          type: Math.random() > 0.4 ? 'score' : 'power',
          vy: 2.0,
        });

        // Explode visual particles
        for (let i = 0; i < 15; i++) {
          particlesRef.current.push({
            x: e.x,
            y: e.y,
            vx: (Math.random() * 2 - 1) * 3,
            vy: (Math.random() * 2 - 1) * 3,
            color: '#ff6666',
            life: 30,
            maxLife: 30,
            size: Math.random() * 3 + 1,
          });
        }

        if (e.isBoss) {
          triggerVictory();
        }
        return false;
      }

      // screen limit check
      return e.y < GAME_HEIGHT + 50;
    });
  };

  const triggerVictory = () => {
    audio.playSpellCard();
    setGameState(s => ({ ...s, isVictorious: true, isOver: true }));
    // Save highscore
    if (playerRef.current.score > highScore) {
      setHighScore(playerRef.current.score);
      localStorage.setItem('touhou_switch_high_score', playerRef.current.score.toString());
    }
  };

  // Normal bullet spawns
  const triggerNormalDanmaku = (enemy: Enemy) => {
    const idSeed = Date.now() + Math.random();
    // Targeted single or ring bullet
    const player = playerRef.current;
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    
    // adjust bullet density by user config
    const baseDensity = Math.round(3 * config.densityMultiplier);
    const bulletsCount = Math.max(1, baseDensity);

    if (bulletsCount === 1) {
      // standard single aim shot
      bulletsRef.current.push({
        id: idSeed,
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * (3.5 * config.speedMultiplier),
        vy: Math.sin(angle) * (3.5 * config.speedMultiplier),
        radius: 6,
        color: '#ff4444',
        type: 'ring',
        isEnemy: true,
      });
    } else {
      // Small arc spread
      for (let i = 0; i < bulletsCount; i++) {
        const spreadAngle = angle + (i - (bulletsCount - 1) / 2) * 0.25;
        bulletsRef.current.push({
          id: idSeed + i * 0.1,
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(spreadAngle) * (3.0 * config.speedMultiplier),
          vy: Math.sin(spreadAngle) * (3.0 * config.speedMultiplier),
          radius: 5,
          color: '#e244ff',
          type: 'rice',
          isEnemy: true,
        });
      }
    }
  };

  // Dynamic Beautiful Spell Card pattern generator!
  const triggerBossDanmaku = (boss: Enemy) => {
    const idSeed = Date.now() + Math.random();
    const player = playerRef.current;
    
    // Base amount of bullets around circle or stars
    const totalLines = Math.max(6, Math.round(20 * config.densityMultiplier));
    const speed = 2.4 * config.speedMultiplier;

    // Pattern change based on boss current phase/health ratio
    const healthRatio = boss.health / boss.maxHealth;

    if (healthRatio > 0.65) {
      // Phase 1: Swirling Colorful Ring storm
      audio.playEnemyHit();
      const patternRotation = (boss.patternTimer / 25) * Math.PI;
      for (let i = 0; i < totalLines; i++) {
        const theta = (Math.PI * 2 * i) / totalLines + patternRotation;
        bulletsRef.current.push({
          id: idSeed + i * 0.01,
          x: boss.x,
          y: boss.y,
          vx: Math.cos(theta) * speed,
          vy: Math.sin(theta) * speed,
          radius: 5,
          color: i % 2 === 0 ? '#ff3333' : '#ff9900',
          type: 'ring',
          isEnemy: true,
        });
      }

      // If Lunatic, also spawn counter-rotating rings!
      if (difficulty === 'lunatic') {
        const patternRotationCCW = -(boss.patternTimer / 25) * Math.PI;
        for (let i = 0; i < totalLines; i++) {
          const theta = (Math.PI * 2 * i) / totalLines + patternRotationCCW;
          bulletsRef.current.push({
            id: idSeed + i * 0.01 + 500,
            x: boss.x,
            y: boss.y,
            vx: Math.cos(theta) * speed * 0.85,
            vy: Math.sin(theta) * speed * 0.85,
            radius: 5,
            color: '#33ccff',
            type: 'ring',
            isEnemy: true,
          });
        }
      }

      boss.shootCooldown = 15; // fast rapid circles
    } else if (healthRatio > 0.3) {
      // Phase 2: Double Spiral Cross + Homing stars!
      audio.playEnemyHit();
      if (boss.patternTimer % 4 === 0) {
        // Spiral arms (2 normally, 4 if Lunatic)
        const armCount = difficulty === 'lunatic' ? 4 : 2;
        for (let a = 0; a < armCount; a++) {
          const theta = (boss.patternTimer / 12) + (Math.PI * 2 * a) / armCount;
          bulletsRef.current.push({
            id: idSeed + 1 + a,
            x: boss.x,
            y: boss.y,
            vx: Math.cos(theta) * speed * 1.1,
            vy: Math.sin(theta) * speed * 1.1,
            radius: 7,
            color: a % 2 === 0 ? '#3399ff' : '#cc33ff',
            type: 'star',
            isEnemy: true,
          });
        }
      }

      // Every 60 ticks launch dynamic targeted ring spread
      if (boss.patternTimer % 60 === 0) {
        audio.playSpellCard();
        const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
        const fanCount = Math.max(3, Math.round(7 * config.densityMultiplier));
        for (let j = 0; j < fanCount; j++) {
          const arc = angle + (j - (fanCount - 1) / 2) * 0.15;
          bulletsRef.current.push({
            id: idSeed + 5 + j,
            x: boss.x,
            y: boss.y,
            vx: Math.cos(arc) * (speed * 1.3),
            vy: Math.sin(arc) * (speed * 1.3),
            radius: 8,
            color: '#ffffff',
            type: 'crystal',
            isEnemy: true,
          });
        }
      }
      boss.shootCooldown = 6;
    } else {
      // Phase 3 (FINAL SPELL CARD): Red Magic "Scarlet Devil Canopy"
      // Beautiful massive sunflower chaotic orbits
      audio.playShoot();
      const waveCount = Math.max(12, Math.round(32 * config.densityMultiplier));
      const rotationStep = Math.sin(boss.patternTimer / 80) * 1.5;

      for (let i = 0; i < waveCount; i++) {
        const theta = (Math.PI * 2 * i) / waveCount + rotationStep;
        bulletsRef.current.push({
          id: idSeed + i * 0.005,
          x: boss.x,
          y: boss.y,
          vx: Math.cos(theta) * (speed * 0.85),
          vy: Math.sin(theta) * (speed * 0.85),
          radius: 4.5,
          color: '#ff2255',
          type: 'arrow',
          isEnemy: true,
        });
      }

      // Periodically on Lunatic, fire high-speed targeted yellow daggers/crystals directly at the player
      if (difficulty === 'lunatic' && boss.patternTimer % 20 === 0) {
        audio.playSpellCard();
        const angleToPlayer = Math.atan2(player.y - boss.y, player.x - boss.x);
        const fanCount = 3;
        for (let k = 0; k < fanCount; k++) {
          const arc = angleToPlayer + (k - 1) * 0.11;
          bulletsRef.current.push({
            id: idSeed + 900 + k,
            x: boss.x,
            y: boss.y,
            vx: Math.cos(arc) * speed * 1.6,
            vy: Math.sin(arc) * speed * 1.6,
            radius: 5,
            color: '#ffff33',
            type: 'crystal',
            isEnemy: true,
          });
        }
      }

      boss.shootCooldown = 22; // dense pulsating waves
    }

    // Sync boss health values back to screen
    setGameState(s => ({
      ...s,
      bossHealth: boss.health,
      bossMaxHealth: boss.maxHealth,
    }));
  };

  // Core collisions checking
  const updateCollisions = () => {
    const player = playerRef.current;
    if (gameState.isOver) return;

    const bullets = bulletsRef.current;
    const enemies = enemiesRef.current;

    // A. Player projectiles hitting Enemies
    bullets.forEach((bullet) => {
      if (bullet.isEnemy) return; // skip if enemy bullet

      enemies.forEach((enemy) => {
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // hit check
        if (dist < (bullet.radius + Math.max(enemy.width, enemy.height) / 2)) {
          // Deal damage
          enemy.health -= bullet.damage || 10;
          bullet.y = -999; // mark to delete
          audio.playEnemyHit();

          // small hit spark
          for (let i = 0; i < 3; i++) {
            particlesRef.current.push({
              x: bullet.x,
              y: bullet.y,
              vx: (Math.random() * 2 - 1) * 2,
              vy: -2,
              color: '#cccccc',
              life: 15,
              maxLife: 15,
              size: Math.random() * 2 + 1,
            });
          }
        }
      });
    });

    // B. Enemy bullet hitting Player or Graze system!
    bullets.forEach((bullet) => {
      if (!bullet.isEnemy) return;

      const dx = bullet.x - player.x;
      const dy = bullet.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Grave (Bullet bypasses physical borders very closely!)
      const grazeThreshold = bullet.radius + 18; 
      if (dist < grazeThreshold && dist >= (bullet.radius + player.hitboxRadius)) {
        if (!bullet.grazed) {
          bullet.grazed = true;
          player.graze++;
          player.score += config.grazeScoreValue;
          audio.playGraze();

          setGameState(s => ({
            ...s,
            graze: player.graze,
            score: player.score,
          }));

          // Spawn a brief small sparkly pink "graze particle"
          particlesRef.current.push({
            x: player.x + (Math.random() * 20 - 10),
            y: player.y + (Math.random() * 20 - 10),
            vx: 0,
            vy: -1.5,
            color: '#ffff66',
            life: 20,
            maxLife: 20,
            size: 2,
          });
        }
      }

      // Physical absolute hitbox hit!
      const hitboxThreshold = bullet.radius + player.hitboxRadius;
      if (dist < hitboxThreshold) {
        if (player.invulnFrames <= 0) {
          // Play HIT!
          audio.playPlayerHit();
          player.lives--;
          player.invulnFrames = 100; // grant long invisible protection
          player.bombs = config.playerBombs; // replenish bomber kits

          // Explode beautiful particle rings
          for (let i = 0; i < 35; i++) {
            const angle = (Math.PI * 2 * i) / 35;
            particlesRef.current.push({
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * 4.5,
              vy: Math.sin(angle) * 4.5,
              color: '#ffffff',
              life: 60,
              maxLife: 60,
              size: Math.random() * 4 + 2,
            });
          }

          // Delete all bullets on hit to clear screen
          bulletsRef.current = [];

          setGameState(s => ({
            ...s,
            lives: player.lives,
            bombs: player.bombs,
          }));
        }
      }
    });

    // C. Player crashing directly into Enemy
    enemies.forEach((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < (player.radius + Math.max(enemy.width, enemy.height) / 2)) {
        if (player.invulnFrames <= 0) {
          player.lives--;
          player.invulnFrames = 100;
          bulletsRef.current = []; // Wipe bullets
          audio.playPlayerHit();

          setGameState(s => ({
            ...s,
            lives: player.lives,
          }));
        }
      }
    });
  };

  const updateScoreItems = () => {
    const player = playerRef.current;
    const items = scoreItemsRef.current;

    items.forEach((item) => {
      // items float down
      item.y += item.vy;

      // Vacuum items to player center when close
      const dx = player.x - item.x;
      const dy = player.y - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 120) {
        // accelerate pulls
        const force = (120 - dist) / 10;
        item.x += (dx / dist) * force;
        item.y += (dy / dist) * force;
      }

      // Collection checking
      if (dist < (player.radius + 15)) {
        item.y = 9999; // mark delete
        audio.playGraze();

        if (item.type === 'power') {
          player.power = Math.min(4.0, player.power + 0.1);
          player.score += 800;
          setGameState(s => ({
            ...s,
            power: player.power,
            score: player.score,
          }));
        } else {
          player.score += 5000;
          setGameState(s => ({
            ...s,
            score: player.score,
          }));
        }
      }
    });

    // clean collected or outbound items
    scoreItemsRef.current = items.filter((i) => i.y < GAME_HEIGHT + 20);
  };

  const updateBackgroundAndParticles = () => {
    // A. 2.5D background starfield loop
    const bgs = bgParticlesRef.current;
    bgs.forEach((bg) => {
      bg.y += bg.speed;
      if (bg.y > GAME_HEIGHT) {
        bg.y = -10;
        bg.x = Math.random() * GAME_WIDTH;
      }
    });

    // B. Temporary visual blast particles update
    const pts = particlesRef.current;
    pts.forEach((pt) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
    });

    particlesRef.current = pts.filter((pt) => pt.life > 0);
  };

  // Rendering onto Canvas element context
  const renderCanvas = (ctx: CanvasRenderingContext2D) => {
    // A. Clear and paint black/scarlet velvet background
    ctx.fillStyle = '#080108'; // very deep dark gothic purple
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw scrolling foggy mist backdrop
    ctx.fillStyle = 'rgba(128, 0, 32, 0.1)'; 
    bgParticlesRef.current.forEach((bg) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(220, 38, 38, ${bg.alpha})`;
      ctx.arc(bg.x, bg.y, bg.size * 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw little white star dust
    ctx.fillStyle = '#ffffff';
    bgParticlesRef.current.forEach((bg) => {
      ctx.fillRect(bg.x, bg.y, bg.size, bg.size);
    });

    // B. Draw Collectable floating Items
    scoreItemsRef.current.forEach((item) => {
      ctx.beginPath();
      if (item.type === 'power') {
        ctx.fillStyle = '#ff3333';
        ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', item.x, item.y);
      } else {
        ctx.fillStyle = '#4488ff';
        ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('点', item.x, item.y); // Score character in Kanji
      }
    });

    // C. Draw Enemies
    enemiesRef.current.forEach((enemy) => {
      ctx.save();
      if (enemy.isBoss) {
        // Draw boss red aura ring
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 3;
        ctx.arc(enemy.x, enemy.y, 45, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Boss Sprite representing silhouette
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        // Wings
        ctx.moveTo(enemy.x - 30, enemy.y - 10);
        ctx.lineTo(enemy.x - 65, enemy.y - 25);
        ctx.lineTo(enemy.x - 20, enemy.y + 10);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(enemy.x + 30, enemy.y - 10);
        ctx.lineTo(enemy.x + 65, enemy.y - 25);
        ctx.lineTo(enemy.x + 20, enemy.y + 10);
        ctx.fill();

        // core dress
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 16, 0, Math.PI * 2);
        ctx.fill();

        // head cap
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 12, 10, Math.PI, 0);
        ctx.fill();

        // Health bar indicator around boss center
        ctx.beginPath();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.arc(enemy.x, enemy.y, 50, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (enemy.health / enemy.maxHealth)));
        ctx.stroke();

      } else {
        // Draw little floating fairies with light wings
        ctx.fillStyle = '#38bdf8';
        // Wings
        ctx.fillRect(enemy.x - 14, enemy.y - 5, 8, 6);
        ctx.fillRect(enemy.x + 6, enemy.y - 5, 8, 6);

        // Core body
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // D. Draw Player (Reimu Hakurei or Marisa Kirisame)
    const player = playerRef.current;
    if (!gameState.isOver) {
      ctx.save();
      // Invulnerable flashing
      if (player.invulnFrames === 0 || Math.floor(player.invulnFrames / 4) % 2 === 0) {
        
        // Render simple elegant player model (Silhouette dress)
        ctx.fillStyle = player.character === 'reimu' ? '#ef4444' : '#eab308';
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - 15);
        ctx.lineTo(player.x - 12, player.y + 12);
        ctx.lineTo(player.x + 12, player.y + 12);
        ctx.closePath();
        ctx.fill();

        // Ribbon / Hair accent
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(player.x, player.y - 8, 5, 0, Math.PI * 2);
        ctx.fill();

        // Red hair bow for Reimu
        if (player.character === 'reimu') {
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(player.x - 10, player.y - 16, 20, 4);
        }

        // Draw micro pixel precision Hitbox indicator ONLY if user is holding Focus/Shift!
        if (player.isFocused) {
          ctx.beginPath();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.arc(player.x, player.y, 16, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.fillStyle = '#ff2222';
          ctx.arc(player.x, player.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // E. Draw Projectiles & Bullets
    bulletsRef.current.forEach((bullet) => {
      ctx.save();
      if (bullet.isEnemy) {
        // Gorgeous outer glows for enemy bullet hell rings
        ctx.shadowBlur = 6;
        ctx.shadowColor = bullet.color;

        ctx.fillStyle = bullet.color;
        
        ctx.beginPath();
        if (bullet.type === 'star') {
          // Draw neat star polygon
          const points = 5;
          const outerR = bullet.radius * 1.5;
          const innerR = bullet.radius * 0.6;
          for (let p = 0; p < points * 2; p++) {
            const rx = (p % 2 === 0 ? outerR : innerR);
            const angle = (Math.PI / points) * p;
            ctx.lineTo(bullet.x + Math.cos(angle) * rx, bullet.y + Math.sin(angle) * rx);
          }
          ctx.closePath();
          ctx.fill();
        } else if (bullet.type === 'slice' || bullet.type === 'rice') {
          // elongated oval rice bullet
          ctx.ellipse(bullet.x, bullet.y, bullet.radius * 0.6, bullet.radius * 2.0, Math.atan2(bullet.vy, bullet.vx), 0, Math.PI * 2);
          ctx.fill();
        } else {
          // standard perfect glowing glass circle
          ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
          ctx.fill();

          // small shiny inner core
          ctx.beginPath();
          ctx.fillStyle = '#ffffff';
          ctx.arc(bullet.x - bullet.radius * 0.25, bullet.y - bullet.radius * 0.25, bullet.radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Player projectiles: sleek blue or yellow needles of light!
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x - bullet.radius, bullet.y - 8, bullet.radius * 2, 16);
      }
      ctx.restore();
    });

    // F. Draw Bomb & explosion floating particles
    particlesRef.current.forEach((pt) => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      // scale size by lingering life
      const size = pt.size * (pt.life / pt.maxLife);
      ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const resetGame = () => {
    isGameOverTriggeredRef.current = false;
    setGameState({
      score: 0,
      lives: config.playerLives,
      bombs: config.playerBombs,
      graze: 0,
      power: 1.0,
      bossHealth: 0,
      bossMaxHealth: 0,
      bossName: null,
      activeSpellCard: null,
      spellCardTimer: 0,
      message: 'RESTARTING STAGE...',
      isOver: false,
      isVictorious: false,
    });
    setPaused(false);
    setSessionId((prev) => prev + 1); // Trigger complete game loop and setup reset
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 bg-neutral-900 rounded-lg flex flex-row items-stretch"
    >
      
      {/* LEFT: MAIN GAME BOARD WRAPPERS */}
      <div className="relative w-[65%] sm:w-[70%] h-full bg-black flex items-center justify-center">
        
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="w-full h-full max-w-full max-h-full object-contain aspect-[11/15] bg-[#0c020c]"
        />

        {/* Dynamic game message labels (e.g. READY/SPELL DECLARED) */}
        {gameState.message && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] pointer-events-none select-none animate-fade-in z-30">
            <div className="text-center px-6 py-4 bg-red-950/80 border border-red-800 rounded-2xl shadow-xl max-w-xs animate-bounce">
              <p className="text-red-400 text-[10px] font-mono tracking-widest uppercase">STORY ALERTS</p>
              <h4 className="text-lg font-bold text-red-100 mt-1 uppercase tracking-wider">{gameState.message}</h4>
            </div>
          </div>
        )}

        {/* GameOver Overlay */}
        {gameState.isOver && (
          <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30">
            <Award className="text-yellow-400 w-16 h-16 animate-pulse mb-2" />
            <h2 className="text-2xl font-black text-red-400 tracking-widest">
              {gameState.isVictorious ? 'STAGE CLEAR' : 'GAME OVER'}
            </h2>
            <p className="text-neutral-300 text-xs mt-1">終末の紅魔郷 〜 妖しい緋色の奇跡</p>
            
            <div className="bg-black/40 border border-neutral-800 p-4 rounded-xl w-48 text-center my-4">
              <span className="text-[9px] text-neutral-400 uppercase font-mono Block">YOUR FINAL SCORE</span>
              <p className="text-xl font-mono font-bold text-yellow-400 mt-1">{gameState.score}</p>
              <span className="text-[9px] text-neutral-400 block mt-2">GRAZED: <b className="text-white">{gameState.graze}</b></span>
            </div>

            <div className="flex gap-2 w-full max-w-xs">
              <button
                onClick={resetGame}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 rounded-xl font-bold text-xs hover:brightness-110 active:scale-95 transition text-white border border-red-500 flex items-center justify-center gap-1.5"
                id="btn-restart-game"
              >
                <RefreshCw size={14} />
                再挑戦
              </button>
              <button
                onClick={onBackToMenu}
                className="flex-1 py-2.5 bg-neutral-800 rounded-xl font-bold text-xs hover:bg-neutral-700 active:scale-95 transition text-neutral-300 border border-neutral-700"
                id="btn-back-menu-gameover"
              >
                メニューに戻る
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: ARCADE STYLE HUD PANEL */}
      <div className="w-[35%] sm:w-[30%] h-full bg-neutral-900 border-l border-neutral-800 flex flex-col justify-between p-2 sm:p-4 text-xs select-none">
        <div>
          {/* Difficulty badge */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-neutral-500 font-mono">STAGE 1</span>
            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
              difficulty === 'easy' ? 'bg-green-950 text-green-300 border-green-800' :
              difficulty === 'normal' ? 'bg-blue-950 text-blue-300 border-blue-800' :
              difficulty === 'hard' ? 'bg-orange-950 text-orange-300 border-orange-850' :
              difficulty === 'lunatic' ? 'bg-purple-950 text-purple-300 border-purple-800' :
              'bg-red-950 text-red-300 border-red-800'
            }`}>
              {difficulty}
            </span>
          </div>

          {/* Scores Panel */}
          <div className="space-y-3 mb-5 border-b border-neutral-800 pb-3">
            <div>
              <span className="text-[9px] text-neutral-500 font-bold block">HI-SCORE</span>
              <p className="font-mono text-base font-black text-neutral-300 leading-tight">
                {highScore.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[9px] text-red-400 font-bold block">SCORE</span>
              <p className="font-mono text-lg font-black text-yellow-400 leading-tight">
                {gameState.score.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Player stats */}
          <div className="space-y-4">
            {/* Lives */}
            <div>
              <span className="text-[9px] text-neutral-500 font-bold block mb-1">PLAYER (残機)</span>
              <div className="flex gap-1">
                {gameState.lives >= 0 ? (
                  Array.from({ length: Math.min(8, gameState.lives) }).map((_, i) => (
                    <span key={i} className="text-rose-500 text-sm animate-pulse">♥</span>
                  ))
                ) : (
                  <span className="text-red-500 text-[10px] uppercase font-bold">DOWN</span>
                )}
                {gameState.lives > 8 && <span className="text-xs text-rose-400 font-bold ml-1">+{gameState.lives - 8}</span>}
              </div>
            </div>

            {/* Bombs */}
            <div>
              <span className="text-[9px] text-neutral-500 font-bold block mb-1">BOMBS (霊撃符)</span>
              <div className="flex gap-1">
                {gameState.bombs > 0 ? (
                  Array.from({ length: gameState.bombs }).map((_, i) => (
                    <span key={i} className="text-green-400 text-sm">★</span>
                  ))
                ) : (
                  <span className="text-neutral-600 text-[10px] uppercase font-bold">EMPTY</span>
                )}
              </div>
            </div>

            {/* Power level */}
            <div className="grid grid-cols-2 gap-2 border-t border-neutral-850 pt-3">
              <div>
                <span className="text-[8px] text-neutral-500 font-bold block">POWER</span>
                <span className="font-mono text-sm font-bold text-sky-400">{gameState.power.toFixed(2)} / 4.00</span>
              </div>
              <div>
                <span className="text-[8px] text-neutral-500 font-bold block">GRAZE (かすり)</span>
                <span className="font-mono text-sm font-bold text-yellow-500">{gameState.graze}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom character layout card */}
        <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs ${
              character === 'reimu' ? 'bg-red-950 border-red-500/50 text-red-300' : 'bg-yellow-950 border-yellow-500/50 text-yellow-300'
            }`}>
              {character === 'reimu' ? '霊' : '魔'}
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-200">
                {character === 'reimu' ? '博麗 霊夢' : '霧雨 魔理沙'}
              </p>
              <p className="text-[8px] text-neutral-500">
                {character === 'reimu' ? '誘導アミュレット' : '連射レーザーストーム'}
              </p>
            </div>
          </div>

          <div className="mt-2 border-t border-neutral-850 pt-2 flex justify-between items-center text-[9px]">
            <button
              onClick={onBackToMenu}
              className="text-neutral-500 hover:text-neutral-300 transition underline underline-offset-2"
              id="btn-quit-game"
            >
              試合終了 (Menu)
            </button>
            <div className="flex items-center gap-1.5 text-neutral-500">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
              <span>BGM演奏中</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
