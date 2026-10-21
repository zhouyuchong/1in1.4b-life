import React from 'react';
import { Sparkles, Compass, MapPin, BookOpen, HeartPulse } from 'lucide-react';

export default function WelcomeScreen({ onStart }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8f6f0] text-stone-900">
      <div className="max-w-xl w-full bg-white/80 backdrop-blur border border-stone-200/90 rounded-2xl shadow-xl p-6 sm:p-10 text-center relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

        {/* Tag & Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-medium tracking-wide mb-4">
          <Sparkles className="w-3.5 h-3.5 text-red-600" />
          <span>1 in 1.4 Billion</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 mb-1.5">
          十四亿分之一
        </h1>
        <div className="text-base sm:text-lg font-serif text-red-800 font-semibold mb-3 tracking-wide">
          《生于此地》 <span className="text-xs sm:text-sm font-sans font-normal text-stone-500 tracking-normal">(Born Here)</span>
        </div>
        <p className="text-sm sm:text-base text-stone-600 font-serif leading-relaxed mb-8 max-w-md mx-auto">
          “站在无知之幕后，看看你将如何度过这一生。”
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-3 text-left mb-8">
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70">
            <div className="flex items-center gap-2 text-stone-800 font-medium text-xs sm:text-sm mb-1">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>340+ 地级市加权</span>
            </div>
            <p className="text-xs text-stone-500 leading-normal">
              严格依据统计年鉴与人口普查出生率加权抽取出生地与城乡户籍。
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70">
            <div className="flex items-center gap-2 text-stone-800 font-medium text-xs sm:text-sm mb-1">
              <Compass className="w-4 h-4 text-amber-600" />
              <span>真实社会热点抉择</span>
            </div>
            <p className="text-xs text-stone-500 leading-normal">
              幼小衔接、中考分流、张雪峰式志愿、六个钱包上车房贷、35岁危机。
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70">
            <div className="flex items-center gap-2 text-stone-800 font-medium text-xs sm:text-sm mb-1">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>每年多段人生经历</span>
            </div>
            <p className="text-xs text-stone-500 leading-normal">
              每年经历多件事情，16岁起还能主动进修、求职和调整生活。
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70">
            <div className="flex items-center gap-2 text-stone-800 font-medium text-xs sm:text-sm mb-1">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <span>看得见的人生账本</span>
            </div>
            <p className="text-xs text-stone-500 leading-normal">
              余额、住房与贷款以金额呈现，年度收支逐项记录，结局可保存分享。
            </p>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          className="w-full py-3.5 px-6 rounded-xl bg-red-700 hover:bg-red-800 active:bg-red-900 text-white font-medium text-base shadow-lg shadow-red-700/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>掀开无知之幕 · 开始投胎</span>
        </button>

        <p className="text-xs text-stone-400 mt-4">
          数据基于公开权威统计资料 · 纯客户端轻量极速运行
        </p>
      </div>
    </div>
  );
}
