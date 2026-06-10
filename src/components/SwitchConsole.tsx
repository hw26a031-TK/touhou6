import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, Info, Keyboard, MonitorPlay, X, GamepadIcon } from 'lucide-react';
import { audio } from '../audio';

interface SwitchConsoleProps {
  children: React.ReactNode;
  onButtonPress?: (btn: string) => void;
  onButtonRelease?: (btn: string) => void;
  isConsoleMode: boolean; // repurposed as isFullscreen
  setIsConsoleMode: (mode: boolean) => void;
}

export const SwitchConsole: React.FC<SwitchConsoleProps> = ({
  children,
  onButtonPress,
  onButtonRelease,
  isConsoleMode: isFullscreen,
  setIsConsoleMode: setIsFullscreen,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showKeyHelp, setShowKeyHelp] = useState(true);
  const [showVirtualPad, setShowVirtualPad] = useState(false);

  // Auto-detect touch devices to show virtual pad optionally by default
  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (hasTouch) {
      setShowVirtualPad(true);
    }
  }, []);

  const toggleSound = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  const handlePress = (btn: string) => {
    audio.init();
    if (onButtonPress) onButtonPress(btn);
  };

  const handleRelease = (btn: string) => {
    if (onButtonRelease) onButtonRelease(btn);
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white font-sans ${isFullscreen ? 'p-0' : 'p-2 sm:p-6'} overflow-hidden relative selection:bg-red-500 selection:text-white`}>
      {/* Scarlet mist background grid effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.07)_0%,rgba(0,0,0,0.85)_80%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.25)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

      {/* WINDOW CONTROLS AND TOP BAR (Rendered in Windowed Mode only) */}
      {!isFullscreen && (
        <div className="w-full max-w-5xl flex items-center justify-between mb-4 px-4 py-2 bg-gradient-to-r from-neutral-900/90 to-neutral-950/90 border border-red-950/50 rounded-2xl backdrop-blur-md z-10 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <h1 className="text-xs sm:text-sm font-black tracking-widest text-neutral-100 font-mono">
              東方紅魔郷 〜 Embodiment of Scarlet Devil <span className="text-[10px] px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-900 rounded">PC EDITION</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyHelp(!showKeyHelp)}
              className={`p-2 rounded-xl transition-all ${
                showKeyHelp ? 'bg-red-950/40 text-yellow-400 border border-red-900/30' : 'text-neutral-400 hover:bg-neutral-900/60'
              }`}
              title="操作説明を表示 (Toggle Controls Help)"
              id="toggle-help-btn"
            >
              <Keyboard size={15} />
            </button>

            <button
              onClick={() => setShowVirtualPad(!showVirtualPad)}
              className={`p-2 rounded-xl transition-all ${
                showVirtualPad ? 'bg-red-950/40 text-red-400 border border-red-900/30' : 'text-neutral-400 hover:bg-neutral-900/60'
              }`}
              title="仮想コントローラー表示 (Toggle Virtual Pads)"
              id="toggle-vpad-btn"
            >
              <GamepadIcon size={15} />
            </button>
            
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl transition-all ${
                isMuted ? 'bg-red-950/60 text-red-500 border border-red-900/50' : 'text-neutral-400 hover:bg-neutral-900/60'
              }`}
              title="消音切り替え (Mute Audio)"
              id="toggle-mute-btn"
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-900/40 bg-red-950/20 text-xs text-red-400 hover:text-white hover:bg-red-650 hover:border-red-500 transition shadow-[0_0_10px_rgba(220,38,38,0.15)] font-bold"
              id="toggle-console-mode"
            >
              <Maximize2 size={13} />
              <span className="hidden sm:inline">フルスクリーン</span>
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN CONTAINER */}
      <div 
        className={`transition-all duration-300 flex flex-col items-center justify-center relative ${
          isFullscreen 
            ? 'w-screen h-screen max-w-none max-h-none p-0 m-0 z-40 fixed inset-0 bg-black' 
            : 'w-full max-w-5xl aspect-[16/9.5] sm:aspect-[16/9.2] border-2 sm:border-4 border-red-900/40 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden bg-black'
        }`}
      >
        {/* Mock Title Header nested ONLY inside Windowed Client */}
        {!isFullscreen && (
          <div className="w-full bg-neutral-900/90 border-b border-red-950/50 px-4 py-1.5 flex items-center justify-between text-[11px] text-neutral-400 select-none font-mono">
            <div className="flex items-center gap-1.5">
              <span>🗎</span>
              <span>TOUHOU_PC_CLIENT_06.EXE</span>
            </div>
            <div className="flex items-center gap-2 opacity-60">
              <span>_</span>
              <span className="cursor-pointer hover:text-red-500" onClick={() => setIsFullscreen(true)}>⛶</span>
              <span className="cursor-pointer hover:text-red-500">✕</span>
            </div>
          </div>
        )}

        {/* Floating exit-fullscreen button */}
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-50 p-2 sm:p-2.5 bg-black/60 hover:bg-red-650 text-white rounded-full transition shadow-lg border border-neutral-800 flex items-center gap-1.5 text-xs font-mono font-bold select-none group"
            title="フルスクリーンを終了"
            id="exit-fullscreen-floating"
          >
            <Minimize2 size={14} className="group-hover:scale-110 transition" />
            <span className="hidden sm:inline">ウィンドウモードに戻る</span>
          </button>
        )}

        {/* Content Node Frame */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-neutral-950 flex flex-col justify-stretch">
          {children}
        </div>

        {/* Visual Bezel Status at bottom of screen wrapper */}
        {!isFullscreen && (
          <div className="w-full h-5 bg-neutral-900 flex justify-between items-center px-4 py-1 text-[8.5px] text-neutral-500 font-mono select-none border-t border-red-950/20">
            <span className="flex items-center gap-1 uppercase">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              CLIENT ENGINE READY
            </span>
            <span className="tracking-widest">© TEAM SHANGHAI ALICE • PORTED BY PC EMULATOR</span>
            <span>MEMORY_STABLE_100%</span>
          </div>
        )}
      </div>

      {/* RESPONSIVE VIRTUAL CONTROLLER FOR LAPTOPS, ON-SCREEN PLAYERS, OR MOBILE */}
      {showVirtualPad && (
        <div className="w-full max-w-5xl px-3 py-3 mt-4 bg-neutral-900/80 border border-red-950/30 rounded-2xl text-xs backdrop-blur-md z-15 shadow-2xl relative transition-all animate-fade-in select-none">
          <div className="font-bold mb-3 text-center text-rose-400 font-mono tracking-wider flex items-center justify-between px-2">
            <div className="flex items-center gap-1.5 text-[11px]">
              <GamepadIcon size={14} className="text-rose-500" />
              <span>VIRTUAL GAMEPAD DECK</span>
            </div>
            <button 
              onClick={() => setShowVirtualPad(false)} 
              className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-white transition"
              title="とじる"
            >
              <X size={12} />
            </button>
          </div>

          <div className="flex flex-row justify-between items-center gap-4 px-2 sm:px-6">
            
            {/* VIRTUAL D-PAD */}
            <div className="flex flex-col items-center">
              <div className="grid grid-cols-3 gap-1 rotate-0">
                <div />
                <button
                  onMouseDown={() => handlePress('up')}
                  onMouseUp={() => handleRelease('up')}
                  onTouchStart={() => handlePress('up')}
                  onTouchEnd={() => handleRelease('up')}
                  className="w-10 h-10 bg-neutral-800 hover:bg-red-950 active:bg-red-700 active:scale-90 border border-neutral-700/60 rounded-xl flex items-center justify-center transition shadow-lg text-lg font-bold text-neutral-300"
                  id="vpad-up"
                >
                  ▲
                </button>
                <div />

                <button
                  onMouseDown={() => handlePress('left')}
                  onMouseUp={() => handleRelease('left')}
                  onTouchStart={() => handlePress('left')}
                  onTouchEnd={() => handleRelease('left')}
                  className="w-10 h-10 bg-neutral-800 hover:bg-red-950 active:bg-red-700 active:scale-90 border border-neutral-700/60 rounded-xl flex items-center justify-center transition shadow-lg text-lg font-bold text-neutral-300"
                  id="vpad-left"
                >
                  ◀
                </button>
                <div className="w-10 h-10 bg-neutral-950/45 border border-red-950/20 rounded-xl flex items-center justify-center text-neutral-600 font-bold font-mono text-[9px]">
                  PAD
                </div>
                <button
                  onMouseDown={() => handlePress('right')}
                  onMouseUp={() => handleRelease('right')}
                  onTouchStart={() => handlePress('right')}
                  onTouchEnd={() => handleRelease('right')}
                  className="w-10 h-10 bg-neutral-800 hover:bg-red-950 active:bg-red-700 active:scale-90 border border-neutral-700/60 rounded-xl flex items-center justify-center transition shadow-lg text-lg font-bold text-neutral-300"
                  id="vpad-right"
                >
                  ▶
                </button>

                <div />
                <button
                  onMouseDown={() => handlePress('down')}
                  onMouseUp={() => handleRelease('down')}
                  onTouchStart={() => handlePress('down')}
                  onTouchEnd={() => handleRelease('down')}
                  className="w-10 h-10 bg-neutral-800 hover:bg-red-950 active:bg-red-700 active:scale-90 border border-neutral-700/60 rounded-xl flex items-center justify-center transition shadow-lg text-lg font-bold text-neutral-300"
                  id="vpad-down"
                >
                  ▼
                </button>
                <div />
              </div>
            </div>

            {/* PAUSE SYSTEM BUTTON */}
            <div className="flex flex-col items-center justify-center gap-1">
              <button
                onMouseDown={() => handlePress('plus')}
                onMouseUp={() => handleRelease('plus')}
                onTouchStart={() => handlePress('plus')}
                onTouchEnd={() => handleRelease('plus')}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-red-950 active:bg-red-700 text-[10px] font-bold tracking-widest border border-neutral-700 rounded-lg shadow uppercase transition-all"
                id="vpad-pause"
              >
                ⏸ PAUSE (ESC)
              </button>
              <span className="text-[8px] text-neutral-500 font-mono tracking-tight text-center block mt-1">
                MOUSE CLICK / TAP TO COMMAND
              </span>
            </div>

            {/* ACTION BUTTONS (Z / X / SHIFT equivalent buttons) */}
            <div className="flex items-center gap-2.5">
              
              {/* SLOW FOCUS BUTTON */}
              <button
                onMouseDown={() => handlePress('X')}
                onMouseUp={() => handleRelease('X')}
                onTouchStart={() => handlePress('X')}
                onTouchEnd={() => handleRelease('X')}
                className="w-12 h-12 bg-purple-900/60 hover:bg-purple-800 active:bg-purple-650 border border-purple-500/50 rounded-full flex flex-col items-center justify-center transition shadow-lg active:scale-90"
                title="低速移動"
                id="vpad-focus"
              >
                <span className="text-[9px] font-mono font-bold leading-3 text-purple-200">FOCUS</span>
                <span className="text-[8px] opacity-70 font-mono">Shift</span>
              </button>

              {/* BOMB BUTTON */}
              <button
                onMouseDown={() => handlePress('B')}
                onMouseUp={() => handleRelease('B')}
                onTouchStart={() => handlePress('B')}
                onTouchEnd={() => handleRelease('B')}
                className="w-12 h-12 bg-red-900-60 bg-red-900/90 hover:bg-red-800 active:bg-red-700 border border-red-550/60 rounded-full flex flex-col items-center justify-center transition shadow-lg active:scale-90"
                title="ボム"
                id="vpad-bomb"
              >
                <span className="text-[10px] font-bold text-white leading-3">BOMB</span>
                <span className="text-[8.5px] text-rose-300 font-mono">X キー</span>
              </button>

              {/* SHOOT BUTTON */}
              <button
                onMouseDown={() => handlePress('A')}
                onMouseUp={() => handleRelease('A')}
                onTouchStart={() => handlePress('A')}
                onTouchEnd={() => handleRelease('A')}
                className="w-14 h-14 bg-emerald-700/90 hover:bg-emerald-600 active:bg-emerald-500 border border-emerald-400 rounded-full flex flex-col items-center justify-center transition shadow-2xl active:scale-90 animate-pulse hover:animate-none"
                title="ショット"
                id="vpad-shoot"
              >
                <span className="text-xs font-black tracking-wide text-white leading-4">SHOOT</span>
                <span className="text-[9px] text-emerald-100 font-mono">Z キー</span>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* INTENTIONAL CONTROLS MANUAL */}
      {showKeyHelp && (
        <div className="w-full max-w-2xl px-4 py-3 mt-4 bg-neutral-900/80 border border-neutral-800/80 rounded-2xl text-xs text-neutral-300 backdrop-blur-md z-10 shadow-lg select-auto">
          <div className="font-bold mb-1.5 text-center text-neutral-100 flex items-center justify-center gap-1.5">
            <Info size={14} className="text-rose-500" />
            PCキーボード & アーケード操作一覧
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-center md:text-left mt-2.5 border-t border-red-950/20 pt-2.5 font-mono text-[11px]">
            <div><span className="text-rose-400 font-bold">↑ ↓ ← →</span> または <span className="text-rose-400 font-bold">W A S D</span> : 自機の移動</div>
            <div><span className="text-rose-400 font-bold">Z キー</span> : ショット発射 (決定)</div>
            <div><span className="text-rose-400 font-bold">X キー</span> : スペルカード・ボム (キャンセル)</div>
            <div><span className="text-rose-400 font-bold">Shift キー</span> : 低速（精密避・当たり判定表示）</div>
          </div>
          <p className="text-[9.5px] text-neutral-500 text-center mt-2.5">
            ※画面右上の ⛶ フルスクリーン で画面を大きく覆い尽くせます。モバイルの時は「仮想コントローラー」もお使い頂けます。
          </p>
        </div>
      )}
    </div>
  );
};
