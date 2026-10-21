import React from 'react';
import { Compass } from 'lucide-react';
import { getLifeActions } from '../services/lifeActions';

export default function LifeActions({ character, disabled, onAction }) {
  const actions = getLifeActions(character);
  if (character.age < 16 || character.isGameOver) return null;
  return (
    <section className="my-5 rounded-2xl border border-stone-300 bg-white p-4 sm:p-5" aria-labelledby="actions-title">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 id="actions-title" className="flex items-center gap-2 font-serif font-bold text-stone-900"><Compass className="w-4 h-4 text-red-700" />主动求变</h2>
        <p className="text-xs text-stone-600">{character.lastActionAge === character.age ? '今年已行动，下一年可再做新决定' : '每年可行动一次，决定由你发起'}</p>
      </div>
      {actions.length ? <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {actions.map(action => <button key={action.id} disabled={disabled} onClick={() => onAction(action.id)} className="min-h-14 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-left hover:border-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700 disabled:opacity-50 transition">
          <span className="block text-sm font-medium text-stone-900">{action.label}</span>
          <span className="block mt-1 text-xs text-stone-600">{action.description}</span>
        </button>)}
      </div> : <p className="text-sm text-stone-600">{character.pendingChoice ? '先完成当前抉择，再决定要不要主动改变。' : '每个改变都需要时间，先看看这一年的选择如何发展。'}</p>}
    </section>
  );
}
