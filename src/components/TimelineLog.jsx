import React from 'react';
import { Tag } from 'lucide-react';
import { formatMoney, formatMoneyChange } from '../services/finances';

function Changes({ item }) {
  return <div className="flex flex-wrap items-center gap-2 mt-2 text-xs tabular-nums">
    {item.tag && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-red-800"><Tag className="w-3 h-3" />{item.tag}</span>}
    {item.cashChange !== undefined && item.cashChange !== 0 && <span className={item.cashChange > 0 ? 'font-medium text-emerald-800' : 'font-medium text-red-800'}>余额 {formatMoneyChange(item.cashChange)}</span>}
    {['health', 'knowledge', 'sanity'].map((key, i) => item.effect?.[key] ? <span key={key} className="text-stone-600">{['健康', '认知', '心力'][i]} {item.effect[key] > 0 ? '+' : ''}{item.effect[key]}</span> : null)}
  </div>;
}
export default function TimelineLog({ history }) {
  if (!history?.length) return null;
  const years = [];
  for (const item of history) {
    let year = years.at(-1);
    if (!year || year.age !== item.age) {
      year = { age: item.age, events: [], cashAfter: item.cashAfter };
      years.push(year);
    }
    year.events.push(...(item.events || [item]));
  }
  return <div className="space-y-4">
    {years.map((year, index) => <section key={year.age} aria-label={`${year.age}岁的人生记录`} className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-4 py-3 bg-stone-50">
        <h3 className="flex items-center gap-2 font-serif font-bold"><span className={`rounded px-2 py-1 text-sm ${index === 0 ? 'bg-red-700 text-white' : 'bg-stone-200 text-stone-800'}`}>{year.age} 岁</span><span className="text-xs font-normal text-stone-600">{year.events.filter(event => !event.ledger).length} 段经历</span></h3>
        {year.cashAfter !== undefined && <span className="text-xs text-stone-700 tabular-nums">当时余额 {formatMoney(year.cashAfter)}</span>}
      </div>
      <div className="divide-y divide-stone-100 px-4">
        {year.events.map((event, i) => <div key={i} className="py-4">
          {event.ledger ? <details className="rounded-xl bg-amber-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-amber-950">年度收支 <span className="ml-2 tabular-nums">{formatMoneyChange(event.cashChange)}</span></summary>
            <dl className="mt-3 space-y-2 text-xs text-stone-700">
              {event.ledger.map((row, r) => <div key={r} className="flex justify-between gap-3"><dt>{row.label}</dt><dd className="shrink-0 tabular-nums">{formatMoneyChange(row.amount)}</dd></div>)}
            </dl>
          </details> : <>
            {event.isMajor && <span className="mb-2 inline-block text-xs font-medium text-red-800">人生节点</span>}
            <p className="font-serif text-sm sm:text-base leading-relaxed text-stone-800">{event.text}</p>
            <Changes item={event} />
          </>}
        </div>)}
      </div>
    </section>)}
  </div>;
}
