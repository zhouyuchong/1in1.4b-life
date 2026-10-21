import React from 'react';
import { Coins, Heart, Brain, Smile, RotateCcw, Play, Pause, MapPin } from 'lucide-react';

export default function Header({ character, isAutoPlaying, onToggleAutoPlay, onRestart }) {
  if (!character) return null;

  const { age, city, householdType, familyClass, wealth, health, knowledge, sanity, tags } = character;

  // 年龄阶段描述
  let lifeStage = '幼儿启蒙';
  if (age >= 7 && age <= 12) lifeStage = '小学做题';
  else if (age >= 13 && age <= 15) lifeStage = '初中分流';
  else if (age >= 16 && age <= 18) lifeStage = '高中备考';
  else if (age >= 19 && age <= 22) lifeStage = '象牙塔期';
  else if (age >= 23 && age <= 35) lifeStage = '入世沉浮';
  else if (age >= 36 && age <= 50) lifeStage = '中年夹心';
  else if (age >= 51 && age <= 60) lifeStage = '退坡准备';
  else if (age > 60) lifeStage = '银发晚年';

  const attributes = [
    { label: '财富', value: wealth, icon: Coins, color: 'text-amber-600', barBg: 'bg-amber-500' },
    { label: '健康', value: health, icon: Heart, color: 'text-rose-600', barBg: 'bg-rose-500' },
    { label: '认知', value: knowledge, icon: Brain, color: 'text-blue-600', barBg: 'bg-blue-500' },
    { label: '心力', value: sanity, icon: Smile, color: 'text-emerald-600', barBg: 'bg-emerald-500' },
  ];

  return (
    <header className="bg-white/90 backdrop-blur border-b border-stone-200 sticky top-0 z-20 shadow-xs">
      <div className="max-w-3xl mx-auto px-4 py-3">
        {/* Top bar: title & operations */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-stone-900 tracking-tight">
              十四亿分之一
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
              {lifeStage}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAutoPlay}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                isAutoPlaying
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
              }`}
              title={isAutoPlaying ? '暂停自动推进' : '开启自动推进'}
            >
              {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoPlaying ? (character?.pendingChoice ? '自动等待中' : '暂停') : '自动推进'}</span>
            </button>

            <button
              onClick={onRestart}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition cursor-pointer"
              title="重新投胎"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重开</span>
            </button>
          </div>
        </div>

        {/* Origin and Age Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-3 rounded-lg bg-stone-50 border border-stone-200/80 text-xs mb-3">
          <div className="flex items-center gap-1.5 text-stone-700">
            <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className="font-medium text-stone-900">{city.province} · {city.name}</span>
            <span className="text-stone-400">|</span>
            <span>{householdType}</span>
            <span className="text-stone-400">|</span>
            <span>{familyClass}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">当前岁数:</span>
            <span className="font-bold text-red-700 font-serif text-sm">{age} 岁</span>
          </div>
        </div>

        {/* 4 Core Attributes Progress */}
        <div className="grid grid-cols-4 gap-2">
          {attributes.map((attr) => {
            const Icon = attr.icon;
            return (
              <div key={attr.label} className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1 text-stone-600">
                    <Icon className={`w-3.5 h-3.5 ${attr.color}`} />
                    <span className="hidden sm:inline">{attr.label}</span>
                  </span>
                  <span className="font-semibold text-stone-800">{attr.value}</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${attr.barBg}`}
                    style={{ width: `${Math.min(100, Math.max(0, attr.value))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
