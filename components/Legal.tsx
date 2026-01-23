
import React from 'react';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

interface LegalProps {
  type: 'privacy' | 'terms';
  onBack: () => void;
}

const Legal: React.FC<LegalProps> = ({ type, onBack }) => {
  const isPrivacy = type === 'privacy';

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      <nav className="sticky top-0 w-full z-50 glass border-b border-pink-100/50 flex items-center px-6 md:px-16 py-5">
        <button onClick={onBack} className="flex items-center gap-2 text-pink-600 font-bold hover:text-pink-700 transition group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[11px] uppercase tracking-[0.2em]">Back to Home</span>
        </button>
      </nav>
      
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="p-4 bg-pink-50 rounded-3xl text-pink-500 mb-6">
            {isPrivacy ? <Shield size={40} /> : <FileText size={40} />}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold font-serif text-slate-800 tracking-tight">
            {isPrivacy ? "Privacy Policy" : "Terms & Conditions"}
          </h1>
          <p className="text-slate-400 font-medium uppercase tracking-[0.3em] text-[9px] mt-4">Last Updated: January 2026</p>
        </div>

        <div className="glass p-8 md:p-16 rounded-[4rem] border border-pink-100/50 space-y-12 text-slate-600 leading-relaxed font-medium">
          {isPrivacy ? (
            <>
              <p>Candi Nails & Spa is committed to protecting your privacy. This policy explains how we collect and safeguard your information.</p>
              <section className="space-y-4">
                <h2 className="text-3xl font-bold font-serif text-slate-800">1. Information Collection</h2>
                <p>We collect name, phone number, and email for bookings. Voice data processed by our AI agent is used temporarily to fulfill your requests.</p>
              </section>
              <section className="space-y-4">
                <h2 className="text-3xl font-bold font-serif text-slate-800">2. Security</h2>
                <p>We use top-tier encryption to protect your data in our systems. We do not sell or trade your information to third parties.</p>
              </section>
            </>
          ) : (
            <>
              <p>These Terms & Conditions govern the use of our website and booking services. By using our site, you agree to these Terms.</p>
              <section className="space-y-4">
                <h2 className="text-3xl font-bold font-serif text-slate-800">1. Appointments</h2>
                <p>Please provide accurate info. 24h notice is required for cancellations. Late arrivals may result in shortened service time.</p>
              </section>
              <section className="space-y-4">
                <h2 className="text-3xl font-bold font-serif text-slate-800">2. AI Assistant</h2>
                <p>Our agent is designed to assist with scheduling. By using it, you acknowledge processing of voice and text inputs.</p>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Legal;
