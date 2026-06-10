import React from 'react';
import { Sliders, RefreshCw, Volume2, ShieldAlert, Zap, Info, LifeBuoy } from 'lucide-react';
import { GameDifficulty, DifficultyConfig, DIFFICULTY_PRESETS } from '../types';
import { audio } from '../audio';

interface SettingsScreenProps {
  difficulty: GameDifficulty;
  onDifficultyChange: (diff: GameDifficulty) => void;
  customConfig: DifficultyConfig;
  onCustomConfigChange: (config: DifficultyConfig) => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  difficulty,
  onDifficultyChange,
  customConfig,
  onCustomConfigChange,
  onBack,
}) => {
  
  const handleSelectPreset = (preset: GameDifficulty) => {
    audio.playEnemyHit();
    onDifficultyChange(preset);
    if (preset !== 'custom') {
      onCustomConfigChange({ ...DIFFICULTY_PRESETS[preset] });
    }
  };

  const handleSliderChange = (key: keyof DifficultyConfig, val: number) => {
    audio.playGraze();
    onDifficultyChange('custom');
    onCustomConfigChange({
      ...customConfig,
      [key]: val,
    });
  };

  const resetToDefault = () => {
    audio.playEnemyDefeat();
    onDifficultyChange('normal');
    onCustomConfigChange({ ...DIFFICULTY_PRESETS['normal'] });
  };

  const activeConfig = difficulty === 'custom' ? customConfig : DIFFICULTY_PRESETS[difficulty];

  return (
    <div className="absolute inset-0 bg-neutral-900 border-2 border-red-500/10 rounded-lg flex flex-col justify-between p-4 sm:p-6 overflow-y-auto selection:bg-red-500 selection:text-white-100 text-neutral-100">
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
        <Sliders className="text-red-500 w-6 h-6 animate-pulse" />
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-wider text-red-500">難易度＆弾幕密度 設定</h2>
          <p className="text-[10px] text-neutral-400">弾幕の密度や速度、自機の生命力を自由に調整できます。</p>
        </div>
      </div>

      {/* Preset Selection Grid */}
      <div className="mt-4">
        <h3 className="text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wide">難易度プリセット</h3>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {(['easy', 'normal', 'hard', 'lunatic', 'custom'] as GameDifficulty[]).map((p) => (
            <button
              key={p}
              id={`preset-btn-${p}`}
              onClick={() => handleSelectPreset(p)}
              className={`py-2 px-1 text-center font-bold text-xs rounded-xl border transition-all uppercase ${
                difficulty === p
                  ? 'bg-red-600/25 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)] scale-102'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white'
              }`}
            >
              {p === 'easy' && 'Easy (甘口)'}
              {p === 'normal' && 'Normal (普通)'}
              {p === 'hard' && 'Hard (難関)'}
              {p === 'lunatic' && 'Lunatic (狂気)'}
              {p === 'custom' && 'Custom (調整)'}
            </button>
          ))}
        </div>
      </div>

      {/* sliders block */}
      <div className="flex-1 mt-4 space-y-4 max-h-[220px] overflow-y-auto pr-1">
        
        {/* Bullets Density Slider */}
        <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold flex items-center gap-1.5 text-neutral-200">
              <Zap size={14} className="text-yellow-400 animate-pulse" />
              弾幕密度倍率 (Bullet Density)
            </span>
            <span className="text-yellow-400 font-mono font-bold bg-neutral-900 px-1.5 py-0.5 rounded text-sm">
              {activeConfig.densityMultiplier.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.5"
            step="0.1"
            value={activeConfig.densityMultiplier}
            onChange={(e) => handleSliderChange('densityMultiplier', parseFloat(e.target.value))}
            className="w-full accent-red-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg outline-none"
            id="density-slider"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 px-0.5 font-mono">
            <span>0.2x (極小)</span>
            <span>1.0x (標準)</span>
            <span>2.0x (高密度)</span>
            <span>3.5x (東方極限)</span>
          </div>
        </div>

        {/* Bullets Speed Slider */}
        <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold flex items-center gap-1.5 text-neutral-200">
              <LifeBuoy size={14} className="text-sky-400" />
              弾幕速度倍率 (Bullet Speed)
            </span>
            <span className="text-sky-400 font-mono font-bold bg-neutral-900 px-1.5 py-0.5 rounded text-sm">
              {activeConfig.speedMultiplier.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.4"
            max="2.0"
            step="0.1"
            value={activeConfig.speedMultiplier}
            onChange={(e) => handleSliderChange('speedMultiplier', parseFloat(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg outline-none"
            id="speed-slider"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 px-0.5 font-mono">
            <span>0.4x (超スロー)</span>
            <span>1.0x (通常)</span>
            <span>2.0x (超高速弾)</span>
          </div>
        </div>

        {/* Lives / Bombs Controls */}
        <div className="grid grid-cols-2 gap-3">
          
          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 flex flex-col justify-between gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-neutral-300">初期プレイヤー残機</span>
              <span className="text-rose-400 font-bold font-mono">♥ {activeConfig.playerLives}</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={activeConfig.playerLives}
              onChange={(e) => handleSliderChange('playerLives', parseInt(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg outline-none"
              id="lives-slider"
            />
          </div>

          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 flex flex-col justify-between gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-neutral-300">初期ボムストック</span>
              <span className="text-green-400 font-bold font-mono">★ {activeConfig.playerBombs}</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={activeConfig.playerBombs}
              onChange={(e) => handleSliderChange('playerBombs', parseInt(e.target.value))}
              className="w-full accent-green-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg outline-none"
              id="bombs-slider"
            />
          </div>

        </div>

      </div>

      {/* Footer Info Box and Back buttons */}
      <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-between items-center gap-4">
        <button
          onClick={resetToDefault}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-800 text-[10px] text-neutral-400 hover:text-white hover:border-neutral-700 hover:bg-neutral-800/50 transition"
          id="btn-reset-settings"
        >
          <RefreshCw size={12} />
          標準設定に戻す
        </button>

        <button
          onClick={onBack}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs rounded-xl border border-red-500 hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_16px_rgba(239,68,68,0.3)] cursor-pointer"
          id="btn-back-settings"
        >
          保存してメニューに戻る
        </button>
      </div>
    </div>
  );
};
