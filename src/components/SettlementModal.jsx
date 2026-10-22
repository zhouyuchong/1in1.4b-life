import { formatMoney } from '../services/finances';
import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Award, Share2, RotateCcw, Heart, Coins, Brain, Smile, Download, Check } from 'lucide-react';
import { evaluateLifeSummary } from '../services/lifeEngine';

export default function SettlementModal({ character, onRestart }) {
  const cardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const summary = evaluateLifeSummary(character);
  const { city, householdType, familyClass, tags, deathReason } = character;

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f7f6f0'
      });
      const link = document.createElement('a');
      link.download = `十四亿分之一_生于此地_${character.city.name}_${character.age}岁.png`;
      link.href = dataUrl;
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export image', err);
      alert('生成海报失败，请截图保存');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-stone-200">
        {/* Printable Card Area */}
        <div ref={cardRef} className="p-6 sm:p-8 bg-[#fbf9f4] text-stone-900">
          {/* Top Label */}
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 mb-5">
            <div className="flex items-center gap-1.5 text-xs text-red-800 font-serif font-bold tracking-widest">
              <span>十四亿分之一</span>
              <span className="text-stone-300">·</span>
              <span className="font-serif font-normal text-stone-600">《生于此地》</span>
              <span className="text-stone-300">/</span>
              <span className="font-sans font-normal text-stone-400">1 IN 1.4 BILLION</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
              享年 {summary.age} 岁
            </span>
          </div>

          {/* Life Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1 text-xs text-stone-500 mb-1">
              <Award className="w-4 h-4 text-amber-600" />
              <span>人生终局称号</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              {summary.title}
            </h2>
            <p className="text-xs text-stone-500 mt-1 italic font-serif">
              {deathReason || '走完了平凡而独特的一生'}
            </p>
          </div>

          {/* Origin Pill Box */}
          <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-white border border-stone-200/80 mb-5">
            <div>
              <span className="text-stone-400">降生之地：</span>
              <span className="font-medium text-stone-800">{city.province} · {city.name}</span>
            </div>
            <div>
              <span className="text-stone-400">户籍性质：</span>
              <span className="font-medium text-stone-800">{householdType}</span>
            </div>
            <div>
              <span className="text-stone-400">原生家庭：</span>
              <span className="font-medium text-stone-800">{familyClass}</span>
            </div>
            <div>
              <span className="text-stone-400">高考难度：</span>
              <span className="font-medium text-stone-800">{city.gaokaoDifficulty}</span>
            </div>
          </div>

          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="text-xs text-amber-900">人生财务账本 · 模拟金额</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">净资产 {formatMoney(character.finances.cash + character.finances.propertyValue - character.finances.mortgageDebt - (character.finances.onlineDebt || 0) - (character.finances.familyDebt || 0))}</p>
            <p className="mt-2 text-xs text-stone-700">可用余额 {formatMoney(character.finances.cash)} · 剩余房贷 {formatMoney(character.finances.mortgageDebt)}</p>
            <p className="mt-1 text-xs text-stone-700">网贷欠款 {formatMoney(character.finances.onlineDebt || 0)} · 家人借款 {formatMoney(character.finances.familyDebt || 0)}</p>
          </div>
          {/* Percentile Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="text-[11px] text-amber-800 font-medium mb-1">财富排位</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-900">
                前 {100 - summary.wealthPercentile}%
              </div>
              <div className="text-[10px] text-amber-700/80 mt-0.5">游戏估算分布</div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
              <div className="text-[11px] text-blue-800 font-medium mb-1">认知学历</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-blue-900">
                前 {100 - summary.eduPercentile}%
              </div>
              <div className="text-[10px] text-blue-700/80 mt-0.5">同龄人口梯队</div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
              <div className="text-[11px] text-rose-800 font-medium mb-1">寿命超越</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-rose-900">
                {summary.longevityPercentile}%
              </div>
              <div className="text-[10px] text-rose-700/80 mt-0.5">基准78.6岁</div>
            </div>
          </div>

          {/* Tags Cloud */}
          <div className="mb-6">
            <div className="text-xs text-stone-400 mb-2">人生经历印记：</div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-700 shadow-2xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Epilogue Reflection */}
          <div className="p-3.5 rounded-xl bg-stone-100/80 border border-stone-200/80 text-xs font-serif leading-relaxed text-stone-600 italic">
            “摘下无知之幕，每一张在时代浪潮中奔波的面孔，每一次在柴米油盐里的坚守，都是这片土地上最鲜活真实的存在。”
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            onClick={handleDownloadImage}
            disabled={isGenerating}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-800 font-medium text-sm border border-stone-300 shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>已保存到相册</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-stone-600" />
                <span>{isGenerating ? '生成海报中...' : '保存分享海报'}</span>
              </>
            )}
          </button>

          <button
            onClick={onRestart}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 active:bg-red-900 text-white font-medium text-sm shadow-md shadow-red-700/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重新投胎</span>
          </button>
        </div>
      </div>
    </div>
  );
}
