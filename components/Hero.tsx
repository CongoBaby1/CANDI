
import React from 'react';
import { Sparkles } from 'lucide-react';
import { HERO_IMAGE } from '../constants';

interface HeroProps {
  onScrollTo: (id: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onScrollTo }) => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center px-6 md:px-16 overflow-hidden pt-20">
      <div className="absolute inset-0 z-0">
        <img src={HERO_IMAGE} alt="Premium Nail Studio" className="absolute inset-0 w-full h-full object-cover" />
        {/* Lighter overlay (30% instead of 60%) for better brightness */}
        <div className="absolute inset-0 bg-slate-950/30 z-10 backdrop-blur-[1px]"></div>
        {/* Reduced gradient opacity to let the image shine through more clearly */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-transparent to-slate-950/40 z-10"></div>
      </div>

      <div className="max-w-7xl mx-auto text-center z-20 relative">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-pink-500/10 border border-white/20 text-pink-200 text-[10px] font-bold uppercase tracking-[0.4em] mb-12 backdrop-blur-md">
          <Sparkles size={14} className="animate-pulse" /> Bridgeton's Premier Nail Saloon
        </div>

        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif tracking-tighter text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.5)] leading-[0.85]">
            Candi Nails <span className="text-pink-400 italic font-medium">& Spa</span>
          </h1>
          <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-serif italic tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] pb-4">
            Indulge in Luxury
          </h2>
          <p className="text-xl md:text-2xl text-white max-w-2xl mx-auto leading-relaxed font-semibold italic font-serif mt-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Love your nails. Pamper your hands, feet, and soul at <span className="whitespace-nowrap">Candi Nails & Spa</span>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
