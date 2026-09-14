import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Brain, Radio, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const SLIDES = [
  { icon: Lock, titleKey: 'onboarding.s1_title', bodyKey: 'onboarding.s1_body' },
  { icon: Brain, titleKey: 'onboarding.s2_title', bodyKey: 'onboarding.s2_body' },
  { icon: Radio, titleKey: 'onboarding.s3_title', bodyKey: 'onboarding.s3_body' },
] as const;

export default function Onboarding() {
  const { t } = useTranslation();
  const { setOnboardingDone } = useAppStore();
  const [idx, setIdx] = useState(0);

  const slide = SLIDES[idx];
  const Icon = slide.icon;
  const last = idx === SLIDES.length - 1;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-surface-dark via-[#0F172A] to-[#1E1B4B]">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
            <Icon size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">{t(slide.titleKey)}</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-8">{t(slide.bodyKey)}</p>

          <div className="flex justify-center gap-2 mb-8">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === idx ? 'w-8 bg-primary-500' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => (last ? setOnboardingDone(true) : setIdx(idx + 1))}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {last ? t('onboarding.start') : t('onboarding.next')}
            <ChevronRight size={18} className="rtl:rotate-180" />
          </button>
        </div>
        <div className="text-center mt-6 text-xs text-slate-500 flex items-center justify-center gap-2">
          <Shield size={14} /> {t('app.tagline')}
        </div>
      </div>
    </div>
  );
}
