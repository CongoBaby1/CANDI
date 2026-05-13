
import React from 'react';
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
          <VPDCalculator />
        </div>
      </div>
    </section>
  );
};

const VPDCalculator: React.FC = () => {
  const [temp, setTemp] = React.useState('');
  const [rh, setRh] = React.useState('');
  const [unit, setUnit] = React.useState<'C' | 'F'>('F');

  const calcVPD = () => {
    const t = parseFloat(temp);
    const r = parseFloat(rh);
    if (isNaN(t) || isNaN(r) || r <= 0 || r > 100) return null;
    const tC = unit === 'F' ? (t - 32) * 5 / 9 : t;
    const leafT = tC - 2;
    const vpSat = (T: number) => 0.61078 * Math.exp((17.27 * T) / (T + 237.3));
    const vpd = vpSat(leafT) - vpSat(tC) * (r / 100);
    return vpd.toFixed(3);
  };

  const vpd = calcVPD();
  const getZone = (v: number) => {
    if (v < 0.4) return { label: 'Too Humid', color: 'text-blue-400' };
    if (v < 0.6) return { label: 'Seedling Zone', color: 'text-cyan-400' };
    if (v < 0.8) return { label: 'Early Veg', color: 'text-emerald-300' };
    if (v < 1.2) return { label: '\u2713 Vegetative', color: 'text-emerald-400' };
    if (v < 1.5) return { label: '\u2713 Flowering', color: 'text-green-400' };
    return { label: 'Too Dry', color: 'text-red-400' };
  };

  const zone = vpd ? getZone(parseFloat(vpd)) : null;

  return (
    <div className="mt-16 inline-block bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl px-8 py-6 text-left w-full max-w-md mx-auto">
      <p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.35em] mono mb-4">⚡ Live VPD Calculator</p>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-white/40 text-[9px] uppercase tracking-widest mono block mb-1">Temp ({unit})</label>
          <input
            type="number"
            value={temp}
            onChange={e => setTemp(e.target.value)}
            placeholder={unit === 'F' ? '75' : '24'}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm font-bold placeholder:text-white/20 focus:outline-none focus:border-emerald-400"
          />
        </div>
        <div className="flex-1">
          <label className="text-white/40 text-[9px] uppercase tracking-widest mono block mb-1">RH %</label>
          <input
            type="number"
            value={rh}
            onChange={e => setRh(e.target.value)}
            placeholder="65"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm font-bold placeholder:text-white/20 focus:outline-none focus:border-emerald-400"
          />
        </div>
        <button
          onClick={() => setUnit(u => u === 'F' ? 'C' : 'F')}
          className="pb-2 text-emerald-400 text-xs font-black mono hover:text-emerald-300 transition"
        >
          °{unit === 'F' ? 'C' : 'F'}
        </button>
      </div>
      {vpd && zone && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-white/50 text-xs mono">Leaf VPD</span>
          <div className="text-right">
            <span className="text-white font-black text-xl mono">{vpd} <span className="text-white/40 text-sm">kPa</span></span>
            <p className={`text-[10px] font-bold uppercase tracking-widest mono ${zone.color}`}>{zone.label}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hero;
