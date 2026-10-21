import React, { useState, useEffect, useRef } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import LifeActions from './components/LifeActions';
import ActionDialog from './components/ActionDialog';
import Header from './components/Header';
import ChoiceCard from './components/ChoiceCard';
import TimelineLog from './components/TimelineLog';
import SettlementModal from './components/SettlementModal';
import { createNewLife, stepNextYear, resolveChoice, startLifeAction } from './services/lifeEngine';
import { ArrowRight, Play, Pause, RotateCcw } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState('welcome'); // 'welcome' | 'playing'
  const [character, setCharacter] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isStepping, setIsStepping] = useState(false);
  const autoPlayRef = useRef(null);
  const lifeGeneration = useRef(0);
  const stepLock = useRef(false);

  // 开始新人生
  const handleStartLife = () => {
    lifeGeneration.current++;
    stepLock.current = false;
    setIsStepping(false);
    const newLife = createNewLife();
    setCharacter(newLife);
    setScreen('playing');
    setIsAutoPlaying(false);
  };

  // 推进下一年
  const handleNextYear = async () => {
    if (!character || character.isGameOver || character.pendingChoice || stepLock.current) {
      return;
    }
    stepLock.current = true;
    const generation = lifeGeneration.current;
    setIsStepping(true);
    try {
      const nextCharacter = await stepNextYear(character);
      if (generation === lifeGeneration.current) setCharacter(nextCharacter);
      // 保持用户的自动播放意图：当出现抉择时，定时器会因 pendingChoice 自动挂起等待玩家选择；
      // 玩家做出选择后将无缝恢复自动推进。无需强行关闭 isAutoPlaying。
    } finally {
      if (generation === lifeGeneration.current) {
        stepLock.current = false;
        setIsStepping(false);
      }
    }
  };

  // 玩家做出重大抉择
  const handleSelectOption = (option) => {
    if (!character || !character.pendingChoice) return;
    const nextCharacter = resolveChoice(character, option);
    setCharacter(nextCharacter);
  };

  const handleAction = (id) => {
    if (stepLock.current) return;
    setIsAutoPlaying(false);
    setCharacter(current => startLifeAction(current, id));
  };

  // 切换自动播放
  const handleToggleAutoPlay = () => {
    setIsAutoPlaying((prev) => !prev);
  };

  // 监听空格键推进
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.closest?.('button, input, textarea, select, [contenteditable]')) return;
      if (screen === 'playing' && e.code === 'Space' && !character?.pendingChoice && !character?.isGameOver) {
        e.preventDefault();
        handleNextYear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, character, isStepping]);

  // 自动播放定时器
  useEffect(() => {
    if (isAutoPlaying && !character?.pendingChoice && !character?.isGameOver) {
      autoPlayRef.current = setTimeout(() => {
        handleNextYear();
      }, 1000);
    } else {
      clearTimeout(autoPlayRef.current);
    }
    return () => clearTimeout(autoPlayRef.current);
  }, [isAutoPlaying, character]);

  if (screen === 'welcome') {
    return <WelcomeScreen onStart={handleStartLife} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f6f0] text-stone-900 flex flex-col pb-24">
      {/* Top sticky attribute bar */}
      <Header
        character={character}
        isAutoPlaying={isAutoPlaying}
        onToggleAutoPlay={handleToggleAutoPlay}
        onRestart={handleStartLife}
      />

      {/* Main content container */}
      <main className="max-w-3xl w-full mx-auto px-4 py-4 flex-1">
        {/* If pending choice exists, show prominent choice dilemma */}
        {character?.pendingChoice && character.pendingChoice.mode !== 'action' && (
          <ChoiceCard
            pendingChoice={character.pendingChoice}
            character={character}
            onSelectOption={handleSelectOption}
          />
        )}

        {character?.pendingChoice?.mode === 'action' && <ActionDialog character={character} onSelectOption={handleSelectOption} />}
        <LifeActions character={character} disabled={isStepping} onAction={handleAction} />

        {/* Life timeline history */}
        <div className="mt-4">
          <div className="text-xs font-serif text-stone-500 mb-3 px-1 flex items-center justify-between">
            <span>人生编年史 · 最近一年在上</span>
            <span className="text-[11px] text-stone-400">支持按空格键快速步进</span>
          </div>
          <TimelineLog history={character?.history} />
        </div>
      </main>

      {/* Bottom Floating Control Bar */}
      {!character?.isGameOver && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-stone-200 py-3 px-4 z-30 shadow-lg">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <button
              onClick={handleToggleAutoPlay}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-medium border flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                isAutoPlaying
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200'
              }`}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isAutoPlaying ? (character?.pendingChoice ? '自动等待选择' : '暂停') : '自动 (1秒/年)'}</span>
            </button>

            <button
              onClick={handleNextYear}
              disabled={Boolean(character?.pendingChoice) || isStepping}
              className={`flex-1 py-3 px-5 rounded-xl font-medium text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                character?.pendingChoice || isStepping
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                  : 'bg-red-700 hover:bg-red-800 active:bg-red-900 text-white shadow-red-700/25'
              }`}
            >
              {character?.pendingChoice ? (
                <span>请先在上方的重大转折中做出抉择</span>
              ) : (
                <>
                  <span>度过下一年 ({character?.age + 1} 岁)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Final Life Settlement Modal */}
      {character?.isGameOver && (
        <SettlementModal
          character={character}
          onRestart={handleStartLife}
        />
      )}
    </div>
  );
}
