import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameDifficulty, DifficultyConfig, DIFFICULTY_PRESETS, ScreenState } from './types';
import { audio } from './audio';
import { SwitchConsole } from './components/SwitchConsole';
import { MainMenu } from './components/MainMenu';
import { SettingsScreen } from './components/SettingsScreen';
import { GameCanvas } from './components/GameCanvas';
import { Gamepad, Sparkles } from 'lucide-react';

export default function App() {
  const [isConsoleMode, setIsConsoleMode] = useState(false); // Default to clean windowed PC style
  const [screen, setScreen] = useState<ScreenState>('boot');
  
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [customConfig, setCustomConfig] = useState<DifficultyConfig>({ ...DIFFICULTY_PRESETS['normal'] });
  
  const [character, setCharacter] = useState<'reimu' | 'marisa'>('reimu');
  const [immediateBoss, setImmediateBoss] = useState(false);

  // Tracks virtual Switch controller button holds
  const [activeButtons, setActiveButtons] = useState<Record<string, boolean>>({});

  // Trigger boot sequence automatic timeout
  useEffect(() => {
    if (screen === 'boot') {
      const t = setTimeout(() => {
        // Play logo click sound
        audio.init();
        audio.playGraze();
        setScreen('title');
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [screen]);

  // Handle virtual Switch controller press events
  const handleButtonPress = (btn: string) => {
    setActiveButtons((prev) => ({ ...prev, [btn]: true }));

    // Global action shortcuts
    if (btn === 'home') {
      audio.playEnemyDefeat();
      setScreen('title');
      return;
    }

    if (screen === 'title') {
      // clicking any primary button advances to menu
      if (btn === 'A' || btn === 'plus' || btn === 'up' || btn === 'down' || btn === 'left' || btn === 'right') {
        audio.playSpellCard();
        setScreen('select');
      }
    }
  };

  const handleButtonRelease = (btn: string) => {
    setActiveButtons((prev) => ({ ...prev, [btn]: false }));
  };

  // Resolve config based on chosen difficulty preset or custom
  const currentConfig = difficulty === 'custom' ? customConfig : DIFFICULTY_PRESETS[difficulty];

  return (
    <div className="w-full min-h-screen bg-neutral-950 flex items-center justify-center">
      <SwitchConsole
        isConsoleMode={isConsoleMode}
        setIsConsoleMode={setIsConsoleMode}
        onButtonPress={handleButtonPress}
        onButtonRelease={handleButtonRelease}
      >
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: THE PC GAME ENGINE BOOT SEQUENCE */}
          {screen === 'boot' && (
            <motion.div
              key="boot"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center gap-6 text-white select-none pointer-events-none p-8"
            >
              {/* Crimson Full-moon Crest / Team Shanghai Alice style Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
                className="relative flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-[0_0_25px_rgba(239,68,68,0.5)] flex items-center justify-center mb-3">
                  <span className="font-serif text-2xl font-black text-rose-100 italic">紅</span>
                </div>
                <h3 className="text-sm font-serif tracking-[0.25em] text-neutral-100 font-bold">上海アリス幻樂団</h3>
                <span className="text-[9px] font-mono tracking-wider text-rose-500 uppercase mt-1">TEAM SHANGHAI ALICE</span>
              </motion.div>

              <div className="flex flex-col items-center gap-1 max-w-xs w-full text-left bg-neutral-900/50 p-3 rounded-lg border border-neutral-950 font-mono text-[8px] text-neutral-500">
                <div>SCARLET CORE ENGINE v4.0.26 INITIALIZED</div>
                <div>GRAPHICS RENDER FRAMEBUFFER: GL_RGBA8 [OK]</div>
                <div>AUDIO SYNTHESIZER: BUILTIN FM S1 CHIP [OK]</div>
                <div className="flex items-center gap-1.5 text-rose-450/80 animate-pulse mt-1">
                  <span>●</span> LOADING ENGINE ASSETS...
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: GAME TITLE BANNER */}
          {screen === 'title' && (
            <motion.div
              key="title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0c010c] flex flex-col items-center justify-center p-6 select-none cursor-pointer"
              onClick={() => {
                audio.playSpellCard();
                setScreen('select');
              }}
            >
              {/* Scarlet Full-moon Background backdrop */}
              <div className="absolute w-72 h-72 rounded-full bg-red-600/10 filter blur-3xl" />
              
              <div className="z-10 text-center space-y-4">
                <div className="flex justify-center flex-col items-center gap-1">
                  <span className="py-0.5 px-2.5 bg-red-600 text-white font-mono text-[9px] font-bold rounded-full tracking-widest flex items-center gap-1 animate-pulse">
                    <Sparkles size={8} /> TOUCH SCREEN
                  </span>
                  <p className="text-[10px] text-red-500 font-mono tracking-widest uppercase mt-1">
                    TOUHOU EMBODIMENT OF SCARLET DEVIL
                  </p>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-100 tracking-wider">
                  東方紅魔郷
                </h1>
                <p className="text-xs text-neutral-400 tracking-widest italic font-serif">
                  ~ the Embodiment of Scarlet Devil [PC EDITION]
                </p>

                <div className="pt-8">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                    className="text-xs text-red-400 font-bold tracking-widest font-mono uppercase bg-red-950/40 px-4 py-1.5 border border-red-900/60 rounded-xl"
                  >
                    Z キー または 画面クリック でスタート !
                  </motion.div>
                </div>
              </div>

              <div className="absolute bottom-4 text-center text-[9.5px] text-neutral-600 font-mono">
                PRESS ANY KEY TO PLAY INTERACTIVE DEMO STAGE
              </div>
            </motion.div>
          )}

          {/* SCREEN 3: CHARACTER SELECT / MAIN SELECTIONS MENU */}
          {screen === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <MainMenu
                difficulty={difficulty}
                config={currentConfig}
                onStartGame={(char, bossMode) => {
                  setCharacter(char);
                  setImmediateBoss(bossMode);
                  setScreen('game');
                }}
                onOpenSettings={() => setScreen('settings')}
                activeButtons={activeButtons}
              />
            </motion.div>
          )}

          {/* SCREEN 4: INTENSE DIFFICULTY DANMAKU SETTINGS */}
          {screen === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <SettingsScreen
                difficulty={difficulty}
                onDifficultyChange={setDifficulty}
                customConfig={customConfig}
                onCustomConfigChange={setCustomConfig}
                onBack={() => setScreen('select')}
              />
            </motion.div>
          )}

          {/* SCREEN 5: CORE PLAYABLE GAMEPLAY STAGE */}
          {screen === 'game' && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {/* If immediateBoss is toggled, it injects presets skipping minor fairies */}
              <GameCanvas
                difficulty={difficulty}
                config={immediateBoss ? { ...currentConfig, densityMultiplier: currentConfig.densityMultiplier * 1.3 } : currentConfig}
                character={character}
                activeButtons={activeButtons}
                onBackToMenu={() => {
                  audio.playShoot();
                  setScreen('select');
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </SwitchConsole>
    </div>
  );
}
