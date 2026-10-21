import React from 'react';
import { Tag, Sparkles } from 'lucide-react';

export default function TimelineLog({ history }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="space-y-3">
      {history.map((item, idx) => {
        const isLatest = idx === 0;
        const isChoice = item.isChoice;

        return (
          <div
            key={idx}
            className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
              isChoice
                ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                : isLatest
                ? 'bg-white border-stone-300 shadow-xs'
                : 'bg-white/70 border-stone-200 text-stone-700'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {/* Age pill */}
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono font-bold shrink-0 ${
                  isChoice
                    ? 'bg-amber-200 text-amber-900'
                    : isLatest
                    ? 'bg-red-700 text-white'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {item.age} 岁
              </span>

              {/* Event Content */}
              <div className="flex-1 text-sm leading-relaxed font-serif">
                <span className={isChoice ? 'font-medium text-stone-900' : 'text-stone-800'}>
                  {item.text}
                </span>

                {/* Tag or Attribute changes */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {item.tag && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                      <Tag className="w-3 h-3" />
                      <span>{item.tag}</span>
                    </span>
                  )}

                  {item.effect && (
                    <>
                      {item.effect.wealth ? (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.effect.wealth > 0 ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'}`}>
                          财富 {item.effect.wealth > 0 ? `+${item.effect.wealth}` : item.effect.wealth}
                        </span>
                      ) : null}
                      {item.effect.health ? (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.effect.health > 0 ? 'bg-rose-100 text-rose-800' : 'bg-rose-50 text-rose-700'}`}>
                          健康 {item.effect.health > 0 ? `+${item.effect.health}` : item.effect.health}
                        </span>
                      ) : null}
                      {item.effect.knowledge ? (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.effect.knowledge > 0 ? 'bg-blue-100 text-blue-800' : 'bg-blue-50 text-blue-700'}`}>
                          认知 {item.effect.knowledge > 0 ? `+${item.effect.knowledge}` : item.effect.knowledge}
                        </span>
                      ) : null}
                      {item.effect.sanity ? (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.effect.sanity > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>
                          心力 {item.effect.sanity > 0 ? `+${item.effect.sanity}` : item.effect.sanity}
                        </span>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
