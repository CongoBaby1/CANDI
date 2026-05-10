
import React from 'react';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

interface LegalProps {
  type: 'privacy' | 'terms';
  onBack: () => void;
}

const Legal: React.FC<LegalProps> = ({ type, onBack }) => {
  const isPrivacy = type === 'privacy';

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f8faf9]">
      <nav className="sticky top-0 w-full z-50 glass border-b border-emerald-100/50 flex items-center px-6 md:px-16 py-5">
        <button onClick={onBack} className="flex items-center gap-2 text-emerald-700 font-bold hover:text-emerald-800 transition group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[11px] uppercase tracking-[0.2em] mono">Return to Hub</span>
        </button>
      </nav>
      
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="p-4 bg-emerald-50 rounded-3xl text-emerald-600 mb-6">
            {isPrivacy ? <Shield size={40} /> : <FileText size={40} />}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 tracking-tighter">
            {isPrivacy ? "Privacy Protocol" : "Operating Terms"}
          </h1>
          <p className="text-slate-400 font-medium uppercase tracking-[0.3em] text-[9px] mt-4 mono font-mono">Revision: 2026.01.24</p>
        </div>

        <div className="bg-white p-8 md:p-16 rounded-[2.5rem] border border-emerald-100/50 space-y-12 text-slate-600 leading-relaxed font-medium shadow-sm">
          {isPrivacy ? (
            <>
              <p>The Greenhouse prioritizes data integrity and security within the pharmaceutical cannabis sector. This policy details our handling of cultivation data and user telemetry.</p>
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">1. Data Capture</h2>
                <p>We analyze environmental telemetry (VPD, Temperature, RH) for precision calibration. Bio-security protocols ensure your operational data remains isolated and encrypted.</p>
              </section>
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">2. AI Encryption</h2>
                <p>Voice and text inputs processed by "The Greenhouse" consultant are encrypted at-rest. We do not transmit proprietary facility data to unauthorized third parties.</p>
              </section>
            </>
          ) : (
            <>
              <p>These Operating Terms govern the use of The Greenhouse AI systems and consulting protocols. By initializing the system, you agree to these standards.</p>
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">1. Consultation Accuracy</h2>
                <p>Calibration data depends on accurate sensor input. Users are responsible for providing precise LST and room-level metrics to ensure VPD accuracy within the 2026 Schedule III framework.</p>
              </section>
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">2. System Integrity</h2>
                <p>Initialization of the AI agent constitutes acceptance of real-time environmental processing. The Greenhouse is a technical advisory system; final facility decisions remain with the operator.</p>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Legal;
