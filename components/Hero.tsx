
import React from 'react';
import { Sparkles } from 'lucide-react';
import { HERO_IMAGE } from '../constants';
import { ChevronRight, Zap } from 'lucide-react';

interface HeroProps {
  onScrollTo: (id: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onScrollTo }) => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center px-6 md:px-16 overflow-hidden pt-20 bg-emerald-950">
      <div className="absolute inset-0 z-0">
        <img src={HERO_IMAGE} alt="Precision Cultivation" className="absolute inset-0 w-full h-full object-cover grayscale-[0.4]" />
        <div className="absolute inset-0 bg-emerald-950/60 z-10 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-emerald-950/40 z-10"></div>
      </div>

      <div className="max-w-7xl mx-auto text-center z-20 relative">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-bold uppercase tracking-[0.4em] mb-12 backdrop-blur-md mono font-mono">
          <Zap size={14} className="animate-pulse" /> A.I. Environmental System Active
        </div>

        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl lg:text-9xl tracking-tighter text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.5)] leading-[0.85] font-bold">
            Cultivating <span className="text-emerald-400 italic">Precision.</span>
          </h1>
          <h2 className="text-emerald-100 text-3xl md:text-4xl lg:text-5xl tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] pb-4 font-mono uppercase font-bold">
            The 2026 Protocol
          </h2>
          <p className="text-xl md:text-2xl text-emerald-100/60 max-w-2xl mx-auto leading-relaxed font-medium mt-4">
            World-class AI consultant specializing in pharmaceutical-grade standards and terpene preservation.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 pt-10 justify-center">
            <button 
              onClick={() => onScrollTo('services')}
              className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all duration-300 shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-3"
            >
              Start Analysis <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
