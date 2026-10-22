import React from 'react';
import { eventCashChange, minimumCash, formatMoney, formatMoneyChange } from '../services/finances';
import { canSelectOption, checkCondition } from '../services/lifeEngine';
import { Flame, Lock } from 'lucide-react';

const outcomePreview = outcomes => {
  const total = outcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
  return outcomes.map(outcome => `${Number((outcome.weight / total * 100).toPrecision(6))}%：${outcome.resultText}`).join('；');
};

export default function ChoiceCard({ pendingChoice, character, onSelectOption }) {
  if (!pendingChoice) return null;

  const { choice } = pendingChoice;
  const { title, description, sourceCase, options } = choice;

  return (
    <div className="bg-white border-2 border-red-700/80 rounded-2xl shadow-xl overflow-hidden p-5 sm:p-7 my-4 animate-fade-in">
      {/* Header Tag */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold tracking-wide">
          <Flame className="w-3.5 h-3.5 text-red-600" />
          <span>{choice.id === 'action_risk' ? '大胆一搏' : pendingChoice.mode === 'action' ? '主动求变' : '人生重大抉择'} · {character.age} 岁</span>
        </span>

        {sourceCase && (
          <span className="text-[11px] text-stone-500 font-serif italic max-w-xs truncate hidden sm:inline">
            {sourceCase}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 mb-2 leading-snug">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-stone-700 font-serif leading-relaxed mb-5 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
        {description}
      </p>

      {/* Options */}
      <div className="space-y-3">
        {options.filter(opt => checkCondition(opt.condition, character)).map((opt, idx) => {
          // 检查门槛要求
          const reqs = opt.requirements || {};
          const canSelect = canSelectOption(opt, character);
          let unmetReason = '';

          if (reqs.knowledge && character.knowledge < reqs.knowledge) {
            unmetReason = `需认知 ≥ ${reqs.knowledge} (当前: ${character.knowledge})`;
          } else if (minimumCash(opt, character.age) > character.finances.cash) {
            unmetReason = `需可用余额 ${formatMoney(minimumCash(opt, character.age))}`;
          }

          return (
            <button
              key={idx}
              disabled={!canSelect}
              onClick={() => canSelect && onSelectOption(opt)}
              className={`w-full text-left focus-visible:outline-2 focus-visible:outline-red-700 p-4 rounded-xl border transition-all text-sm relative group cursor-pointer ${
                canSelect
                  ? 'border-stone-300 hover:border-red-600 hover:bg-red-50/50 bg-white hover:shadow-md'
                  : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed opacity-75'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="font-medium text-stone-900 group-hover:text-red-700 leading-snug">
                  {opt.text}
                </div>

                {!canSelect ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                    <Lock className="w-3 h-3" />
                    <span>{unmetReason}</span>
                  </span>
                ) : (
                  opt.tag && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 group-hover:bg-red-100 group-hover:text-red-800 shrink-0 transition">
                      +{opt.tag}
                    </span>
                  )
                )}
              </div>

              {opt.description && <p className="mt-2 text-xs leading-5 text-stone-600">{opt.description}</p>}
              {opt.detail && <p className="mt-2 text-xs leading-5 text-stone-700">{opt.detail}</p>}
              {(opt.outcomes || opt.followUp?.outcomes) && <p className="mt-2 text-xs leading-5 text-stone-600">{opt.followUp?.outcomes ? '次年结果：' : ''}{outcomePreview(opt.outcomes || opt.followUp.outcomes)}</p>}
              {/* Effects Preview if available */}
              {!opt.cancel && (
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-stone-500 font-mono">
                  {eventCashChange(opt, character.age) !== 0 ? (
                    <span className={eventCashChange(opt, character.age) > 0 ? 'text-amber-700' : 'text-red-700'}>
                      余额 {formatMoneyChange(eventCashChange(opt, character.age))}
                    </span>
                  ) : null}
                  {opt.effect?.health ? (
                    <span className={opt.effect?.health > 0 ? 'text-rose-700' : 'text-rose-600'}>
                      健康 {opt.effect?.health > 0 ? `+${opt.effect?.health}` : opt.effect?.health}
                    </span>
                  ) : null}
                  {opt.effect?.knowledge ? (
                    <span className={opt.effect?.knowledge > 0 ? 'text-blue-700' : 'text-blue-600'}>
                      认知 {opt.effect?.knowledge > 0 ? `+${opt.effect?.knowledge}` : opt.effect?.knowledge}
                    </span>
                  ) : null}
                  {opt.effect?.sanity ? (
                    <span className={opt.effect?.sanity > 0 ? 'text-emerald-700' : 'text-stone-500'}>
                      心力 {opt.effect?.sanity > 0 ? `+${opt.effect?.sanity}` : opt.effect?.sanity}
                    </span>
                  ) : null}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
