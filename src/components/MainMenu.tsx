import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Sliders, Info, SwatchBook, Swords, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { GameDifficulty, DIFFICULTY_PRESETS, DifficultyConfig } from '../types';
import { audio } from '../audio';

interface MainMenuProps {
  difficulty: GameDifficulty;
  config: DifficultyConfig;
  onStartGame: (character: 'reimu' | 'marisa', immediateBoss: boolean) => void;
  onOpenSettings: () => void;
  activeButtons?: Record<string, boolean>;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  difficulty,
  config,
  onStartGame,
  onOpenSettings,
  activeButtons = {},
}) => {
  const [menuState, setMenuState] = useState<'main' | 'charSelect' | 'manual'>('main');
  const [selectedCharacter, setSelectedCharacter] = useState<'reimu' | 'marisa'>('reimu');
  const [isImmediateBoss, setIsImmediateBoss] = useState(false);
  const [activeSelectIdx, setActiveSelectIdx] = useState<number>(0);

  const handleMenuClick = (action: string) => {
    audio.playGraze();
    
    if (action === 'start') {
      setIsImmediateBoss(false);
      setMenuState('charSelect');
    } else if (action === 'practice') {
      setIsImmediateBoss(true);
      setMenuState('charSelect');
    } else if (action === 'settings') {
      onOpenSettings();
    } else if (action === 'manual') {
      setMenuState('manual');
    }
  };

  const handleLaunchGame = () => {
    audio.playSpellCard();
    onStartGame(selectedCharacter, isImmediateBoss);
  };

  // Controller & Keyboard event routing
  const triggerAction = (action: 'up' | 'down' | 'left' | 'right' | 'A' | 'B') => {
    if (menuState === 'main') {
      if (action === 'up') {
        audio.playGraze();
        setActiveSelectIdx((prev) => (prev - 1 + 4) % 4);
      } else if (action === 'down') {
        audio.playGraze();
        setActiveSelectIdx((prev) => (prev + 1) % 4);
      } else if (action === 'left' || action === 'right') {
        // No horizontal action in main menu
      } else if (action === 'A') {
        audio.playSpellCard();
        if (activeSelectIdx === 0) {
          setIsImmediateBoss(false);
          setMenuState('charSelect');
        } else if (activeSelectIdx === 1) {
          setIsImmediateBoss(true);
          setMenuState('charSelect');
        } else if (activeSelectIdx === 2) {
          onOpenSettings();
        } else if (activeSelectIdx === 3) {
          setMenuState('manual');
        }
      }
    } else if (menuState === 'charSelect') {
      if (action === 'left') {
        audio.playGraze();
        setSelectedCharacter('reimu');
      } else if (action === 'right') {
        audio.playGraze();
        setSelectedCharacter('marisa');
      } else if (action === 'up' || action === 'down') {
        // Toggle character with up/down as well for accessibility
        audio.playGraze();
        setSelectedCharacter((prev) => (prev === 'reimu' ? 'marisa' : 'reimu'));
      } else if (action === 'A') {
        handleLaunchGame();
      } else if (action === 'B') {
        audio.playEnemyHit();
        setMenuState('main');
      }
    } else if (menuState === 'manual') {
      if (action === 'A' || action === 'B') {
        audio.playEnemyHit();
        setMenuState('main');
      }
    }
  };

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') {
        e.preventDefault();
        triggerAction('up');
      } else if (k === 'arrowdown' || k === 's') {
        e.preventDefault();
        triggerAction('down');
      } else if (k === 'arrowleft' || k === 'a') {
        e.preventDefault();
        triggerAction('left');
      } else if (k === 'arrowright' || k === 'd') {
        e.preventDefault();
        triggerAction('right');
      } else if (k === 'z' || k === 'enter') {
        e.preventDefault();
        triggerAction('A');
      } else if (k === 'x' || k === 'escape') {
        e.preventDefault();
        triggerAction('B');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuState, activeSelectIdx, selectedCharacter, isImmediateBoss]);

  // Virtual JoyCon (SwitchConsole) state edge-trigger detector
  const lastActiveButtons = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const justPressed = (btn: string) => {
      const isPressed = !!activeButtons[btn];
      const wasPressed = !!lastActiveButtons.current[btn];
      return isPressed && !wasPressed;
    };

    if (justPressed('up')) triggerAction('up');
    if (justPressed('down')) triggerAction('down');
    if (justPressed('left')) triggerAction('left');
    if (justPressed('right')) triggerAction('right');
    if (justPressed('A')) triggerAction('A');
    if (justPressed('B')) triggerAction('B');

    lastActiveButtons.current = { ...activeButtons };
  }, [activeButtons, menuState, activeSelectIdx, selectedCharacter, isImmediateBoss]);

  return (
    <div className="absolute inset-0 bg-neutral-950 border-2 border-red-500/10 rounded-lg flex flex-col justify-between p-4 sm:p-6 overflow-hidden relative select-none selection:bg-red-500 selection:text-white">
      {/* Scarlet Moon stylized decorative procedural graphics */}
      <div className="absolute top-1/2 left-1/2 -translate-x-[20%] -translate-y-[50%] w-96 h-96 rounded-full bg-red-900/15 filter blur-3xl pointer-events-none" />
      <div className="absolute top-4 right-10 w-24 h-24 rounded-full bg-rose-955 border border-red-650/40 text-[9px] text-red-500/30 flex items-center justify-center pointer-events-none select-none font-black font-serif uppercase tracking-widest leading-none text-center">
        <span>SCARLET<br />DEVIL<br />MOON</span>
      </div>

      {/* Header details */}
      <div className="z-10 flex justify-between items-start border-b border-neutral-800 pb-3">
        <div>
          <span className="text-[10px] text-red-500 font-mono tracking-widest font-black uppercase">
            TOUHOU STAGE ENGINE v4.2
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-rose-500 tracking-wider">
            東方紅魔郷
          </h1>
          <p className="text-[9px] text-neutral-400 capitalize">the Embodiment of Scarlet Devil</p>
        </div>
        
        {/* Short info bar representing chosen parameters */}
        <div className="text-right text-[10px] font-mono leading-tight bg-neutral-900/80 p-2 rounded-xl border border-neutral-800">
          <div>PRES: <span className="text-red-400 font-bold uppercase">{difficulty}</span></div>
          <div>DENSITY: <span className="text-yellow-400 font-bold">{config.densityMultiplier.toFixed(1)}x</span></div>
          <div>SPEED: <span className="text-sky-400 font-bold">{config.speedMultiplier.toFixed(1)}x</span></div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {menuState === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 flex flex-col justify-center space-y-2 max-w-sm mx-auto w-full z-10"
          >
            {/* START GAME */}
            <button
              onClick={() => handleMenuClick('start')}
              className={`py-3 px-4 bg-gradient-to-r transition-all rounded-xl border text-left flex items-center justify-between font-bold group shadow cursor-pointer ${
                activeSelectIdx === 0
                  ? 'from-red-600 via-rose-600 to-red-700 border-red-400 text-white scale-[1.03] shadow-[0_0_15px_rgba(239,68,68,0.45)]'
                  : 'from-red-600/15 via-red-650/20 to-rose-600/5 border-red-900/50 hover:from-red-600 hover:to-rose-600 text-neutral-200 hover:text-white'
              }`}
              id="menu-btn-start"
            >
              <span className="flex items-center gap-2.5">
                <Play size={14} className={`group-hover:scale-110 transition ${activeSelectIdx === 0 ? 'text-white' : 'text-red-500'}`} />
                ゲーム開始 (Stage Play)
              </span>
              <span className={`text-[9px] font-mono transition pr-1 ${activeSelectIdx === 0 ? 'text-red-200' : 'text-neutral-500'}`}>START_S1</span>
            </button>

            {/* SPELL CARD PRACTICE (Immediate Boss launch) */}
            <button
              onClick={() => handleMenuClick('practice')}
              className={`py-3 px-4 bg-gradient-to-r transition-all rounded-xl border text-left flex items-center justify-between font-bold group shadow cursor-pointer ${
                activeSelectIdx === 1
                  ? 'from-purple-600 via-fuchsia-600 to-purple-750 border-purple-400 text-white scale-[1.03] shadow-[0_0_15px_rgba(168,85,247,0.45)]'
                  : 'from-purple-600/10 via-purple-600/15 to-purple-800/5 border-purple-900/50 hover:from-purple-600 hover:to-purple-700 text-neutral-200 hover:text-white'
              }`}
              id="menu-btn-practice"
            >
              <span className="flex items-center gap-2.5">
                <Swords size={14} className={`group-hover:scale-110 transition ${activeSelectIdx === 1 ? 'text-white' : 'text-purple-400'}`} />
                スペルカード練習 (Boss Battle)
              </span>
              <span className={`text-[9px] font-mono transition pr-1 ${activeSelectIdx === 1 ? 'text-purple-200' : 'text-neutral-500'}`}>PRACTICE_RM</span>
            </button>

            {/* DIFFICULTY & BULLETS CONFIGURATION */}
            <button
              onClick={() => handleMenuClick('settings')}
              className={`py-3 px-4 bg-gradient-to-r transition-all rounded-xl border text-left flex items-center justify-between font-bold group shadow cursor-pointer ${
                activeSelectIdx === 2
                  ? 'from-neutral-750 via-neutral-700 to-neutral-800 border-yellow-500/60 text-white scale-[1.03] shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                  : 'from-neutral-800/80 to-neutral-900/40 border-neutral-700 hover:from-neutral-800 hover:to-neutral-900 text-neutral-200 hover:text-white'
              }`}
              id="menu-btn-settings"
            >
              <span className="flex items-center gap-2.5">
                <Sliders size={14} className={`transition-transform duration-300 ${activeSelectIdx === 2 ? 'text-yellow-400 rotate-45 scale-110' : 'text-yellow-500'}`} />
                弾幕密度・難易度設定
              </span>
              <span className={`text-[9px] font-mono transition pr-1 ${activeSelectIdx === 2 ? 'text-yellow-300' : 'text-neutral-500'}`}>BULLETS_CFG</span>
            </button>

            {/* HOW TO PLAY MANUAL */}
            <button
              onClick={() => handleMenuClick('manual')}
              className={`py-3 px-4 bg-gradient-to-r transition-all rounded-xl border text-left flex items-center justify-between font-bold group shadow cursor-pointer ${
                activeSelectIdx === 3
                  ? 'from-sky-700 via-sky-650 to-sky-800 border-sky-400 text-white scale-[1.03] shadow-[0_0_15px_rgba(14,165,233,0.35)]'
                  : 'from-neutral-800/80 to-neutral-900/40 border-neutral-700 hover:from-neutral-800 hover:to-neutral-900 text-neutral-200 hover:text-white'
              }`}
              id="menu-btn-manual"
            >
              <span className="flex items-center gap-2.5">
                <Info size={14} className={`transition ${activeSelectIdx === 3 ? 'text-white scale-110' : 'text-sky-400'}`} />
                遊び方マニュアル
              </span>
              <span className={`text-[9px] font-mono transition pr-1 ${activeSelectIdx === 3 ? 'text-sky-200' : 'text-neutral-500'}`}>GUIDELINES</span>
            </button>
          </motion.div>
        )}

        {menuState === 'charSelect' && (
          <motion.div
            key="charSelect"
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            className="flex-1 flex flex-col justify-between z-10"
          >
            <div className="my-auto">
              <h3 className="text-center font-bold text-xs text-neutral-400 mb-3 tracking-wider uppercase">
                自機キャラクターを選択してください (Select Player)
              </h3>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {/* REIMU HAKUREI CARD */}
                <button
                  onClick={() => { audio.playShoot(); setSelectedCharacter('reimu'); }}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-40 ${
                    selectedCharacter === 'reimu'
                      ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)] scale-102'
                      : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                  }`}
                  id="select-char-reimu"
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="py-0.5 px-2 bg-red-600 font-black text-[9px] text-white rounded">
                      博麗 霊夢
                    </span>
                    <Sparkles size={14} className={selectedCharacter === 'reimu' ? 'text-red-400 animate-pulse' : 'text-neutral-600'} />
                  </div>
                  
                  <div>
                    <h4 className="text-neutral-100 font-bold text-sm">夢想妙珠 & 護符</h4>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      誘導お札ショットが自動で敵を追尾します。回避に専念できるため初心者や高難度弾幕の練習に最適。
                    </p>
                  </div>

                  <div className="flex gap-2 text-[9px] text-neutral-400 font-mono border-t border-neutral-800/80 pt-2 w-full">
                    <span>SPD: 略速</span>
                    <span>HG-RNG: 極大</span>
                  </div>
                </button>

                {/* MARISA KIRISAME CARD */}
                <button
                  onClick={() => { audio.playShoot(); setSelectedCharacter('marisa'); }}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-40 ${
                    selectedCharacter === 'marisa'
                      ? 'bg-yellow-950/40 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)] scale-102'
                      : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                  }`}
                  id="select-char-marisa"
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="py-0.5 px-2 bg-yellow-600 font-black text-[9px] text-neutral-900 rounded">
                      霧雨 魔理沙
                    </span>
                    <Sparkles size={14} className={selectedCharacter === 'marisa' ? 'text-yellow-400 animate-pulse' : 'text-neutral-600'} />
                  </div>

                  <div>
                    <h4 className="text-neutral-100 font-bold text-sm">レーザー針 & ミニ八卦路</h4>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      前方に超高火力の真っ直ぐな貫通レーザーを射出します。ボスを素早く撃破可能ですが、精密エイムが必要。
                    </p>
                  </div>

                  <div className="flex gap-2 text-[9px] text-neutral-400 font-mono border-t border-neutral-800/80 pt-2 w-full">
                    <span>SPD: 高速</span>
                    <span>HG-RNG: 細長</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Back & Confirm launch */}
            <div className="flex justify-between items-center gap-4 mt-4 border-t border-neutral-850 pt-3">
              <button
                onClick={() => { audio.playEnemyHit(); setMenuState('main'); }}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl hover:bg-neutral-700 hover:text-white transition text-xs"
                id="btn-back-char-select"
              >
                戻る (Cancel)
              </button>

              <button
                onClick={handleLaunchGame}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 font-bold text-xs rounded-xl text-white border border-red-500 hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_16px_rgba(239,68,68,0.30)] flex items-center gap-1 cursor-pointer"
                id="btn-launch-game"
              >
                ステージへ出撃 ! [A]
              </button>
            </div>
          </motion.div>
        )}

        {menuState === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-between z-10 max-h-[220px] overflow-y-auto pr-1"
          >
            <div className="space-y-3 my-auto">
              <h3 className="font-bold text-neutral-200 text-sm border-b border-neutral-850 pb-1 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-green-400" />
                東方紅魔郷のお作法 (Instructions)
              </h3>
              
              <div className="space-y-2 text-[10px] text-neutral-300 leading-relaxed font-sans">
                <p>
                  １. <b className="text-red-400">かすり(Graze)システム</b> :
                  敵の弾幕にギリギリまで近づく（かすり判定になる）と、「キュッ！」という美味しいチャープ音が鳴り、スコアが大幅に稼げます。
                </p>
                <p>
                  ２. <b className="text-yellow-400">低速（精密）移動</b> :
                  キーボードなら <kbd className="bg-neutral-800 px-1 border border-neutral-750">Shift キー</kbd>（または仮想コントローラーの FOCUS ボタン）を押し続けることで、自機の移動速度が遅くなり、さらに<b className="text-red-500">自機の真の赤い極小当たり判定サークル</b>が白く光って表示されます。
                </p>
                <p>
                  ３. <b className="text-green-400">必殺ボム (霊撃符)</b> :
                  無数の弾幕に囲まれ被弾しそうなときは直ちにボムを発動しましょう。画面全体の敵弾幕を一掃し重い威力を与え、ボム作動中は無敵盾が展開されます！
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-850 mt-4">
              <button
                onClick={() => { audio.playEnemyHit(); setMenuState('main'); }}
                className="px-5 py-1.5 bg-neutral-800 hover:bg-neutral-700 transition rounded-xl text-neutral-200 text-xs"
                id="btn-back-manual"
              >
                了解 (Back)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer text */}
      <div className="z-10 text-[8px] text-neutral-600 text-center border-t border-neutral-900 pt-2 font-mono">
        © TEAM SHANGHAI ALICE • PORTED FOR PC EDITION PREVIEW 2026
      </div>
    </div>
  );
};
