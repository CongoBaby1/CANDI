
import React from 'react';
import { MapPin, Clock, Phone, Sparkles } from 'lucide-react';
import { BUSINESS_INFO } from '../constants';

const Location: React.FC = () => {
  return (
    <section id="location" className="py-32 px-6 md:px-16 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div className="space-y-16">
          <div>
            <span className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[10px] mono">Access Control</span>
            <h2 className="text-4xl md:text-6xl font-bold mt-4 mb-8 text-slate-800 tracking-tighter">The Digital Hub</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-100/20 border border-emerald-100/30">
                  <MapPin size={28} />
                </div>
                <h4 className="font-bold text-slate-800 text-lg mono font-mono">Operations</h4>
                <p className="text-slate-600 leading-relaxed font-medium">{BUSINESS_INFO.address}</p>
              </div>
              <div className="space-y-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-100/20 border border-emerald-100/30">
                  <Clock size={28} />
                </div>
                <h4 className="font-bold text-slate-800 text-lg mono font-mono">Monitoring Status</h4>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Autonomous: {BUSINESS_INFO.hours.mon_sat}<br />
                  Updates: {BUSINESS_INFO.hours.sun}
                </p>
              </div>
            </div>
          </div>

          <div className="p-10 bg-emerald-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-emerald-100 relative overflow-hidden group/cta">
            <div className="space-y-2 text-center md:text-left z-10">
              <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.3em] mono font-mono">Emergency Calibration?</p>
              <h3 className="text-3xl font-bold tracking-tight">Direct Lab Link</h3>
            </div>
            <a href={`tel:${BUSINESS_INFO.phone}`} className="px-10 py-5 bg-white text-emerald-900 rounded-2xl font-bold hover:bg-emerald-50 transition-all flex items-center gap-3 shadow-lg z-10 whitespace-nowrap mono font-mono">
              <Phone size={20} className="text-emerald-600" /> {BUSINESS_INFO.phone}
            </a>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover/cta:scale-150 transition-transform duration-700"></div>
          </div>
        </div>

        <div className="relative w-full max-w-xl mx-auto lg:mx-0">
          <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl h-[400px] border-[16px] border-white bg-emerald-950 flex flex-col items-center justify-center text-center p-12">
            <Sparkles size={64} className="text-emerald-500 mb-6 animate-pulse" />
            <h4 className="text-white font-bold text-xl mb-4 mono font-mono">Satellite Monitoring Active</h4>
            <p className="text-emerald-100/40 text-sm leading-relaxed">External mapping disabled for security protocol compliance. Direct sensor relay established.</p>
          </div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-200/20 blur-[100px] rounded-full"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-100/30 blur-[100px] rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default Location;
