
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Location from './components/Location';
import AIAgent from './components/AIAgent';
import AdminDashboard from './components/AdminDashboard';
import Legal from './components/Legal';
import { INITIAL_SERVICES, BUSINESS_INFO } from './constants';
import { Booking, Lead, Technician, SystemLog, Service } from './types';
import { db, isConfigured } from './services/databaseService';
import { Award, Heart, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'admin' | 'privacy' | 'terms'>('home');
  const [isLoading, setIsLoading] = useState(true);
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [team, setTeam] = useState<Technician[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  const refreshData = async () => {
    if (!isConfigured()) return;
    try {
      const [b, l, t, s, logsData] = await Promise.all([
        db.getBookings(),
        db.getLeads(),
        db.getTeam(),
        db.getServices(),
        db.getLogs()
      ]);
      
      setBookings(b || []);
      setLeads(l || []);
      setTeam(t || []);
      setServices(s || []);
      setLogs(logsData || []);
    } catch (err) {
      console.warn("Cloud connection active but some tables might be missing. Run SQL script in Setup.");
    }
  };

  useEffect(() => {
    const initData = async () => {
      await refreshData();
      setIsLoading(false);
    };
    initData();
  }, []);

  const addLog = async (action: string, details: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const newLog: SystemLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      type
    };
    try {
      await db.addLog(newLog);
      setLogs(prev => [newLog, ...prev]);
    } catch (err) {
      console.error("Log failed:", err);
    }
  };

  const persistBookingAndLead = async (data: any) => {
    try {
      const result = await db.executeBookingTransaction(data);
      await refreshData();
      await addLog("Cloud Sync Success", `Booking synced for ${result.lead.name}`, "success");
    } catch (err) {
      await addLog("Cloud Sync Failed", "Transaction aborted.", "error");
    }
  };

  const handleAdminAuth = (phrase: string) => {
    if (phrase === BUSINESS_INFO.adminPhrase) {
      setView('admin');
      addLog("Admin Login", "Dashboard accessed.", "success");
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Waking up the cloud...</p>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <AdminDashboard 
        onExit={() => setView('home')} 
        bookings={bookings}
        leads={leads}
        team={team}
        services={services}
        logs={logs}
        setBookings={setBookings}
        setLeads={setLeads}
        updateLocalTeam={setTeam}
        updateLocalServices={setServices}
        refreshData={refreshData}
      />
    );
  }

  if (view === 'privacy' || view === 'terms') {
    return <Legal type={view} onBack={() => setView('home')} />;
  }

  const displayServices = services.length > 0 ? services : INITIAL_SERVICES;

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-pink-100 selection:text-pink-900">
      <Header onScrollTo={scrollTo} />
      <main>
        <Hero onScrollTo={scrollTo} />
        <Services services={displayServices} />
        <section id="our-story" className="py-32 bg-slate-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-16">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-pink-400 font-bold uppercase tracking-[0.3em] text-[10px]">The Candi Experience</span>
              <h2 className="text-4xl md:text-6xl font-bold mt-4 mb-6 font-serif text-slate-800">Why Choose Us</h2>
              <p className="text-slate-700 text-lg leading-relaxed font-medium italic font-serif">We believe nail care is more than a service—it's a ritual of self-love and precision.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: "Master Artists", desc: "Highly trained specialists dedicated to nail health.", icon: Sparkles },
                { title: "Award", desc: "Exclusively high-end, non-toxic products.", icon: Award },
                { title: "Serene Escape", desc: "A sanctuary designed for you to recharge.", icon: Heart },
                { title: "Pristine Safety", desc: "Highest standards of hygiene and sterilization.", icon: ShieldCheck }
              ].map((item, idx) => (
                <div key={idx} className="p-10 bg-white rounded-[3.5rem] border border-pink-100/50 shadow-xl shadow-pink-100/5 hover:-translate-y-2 transition-all duration-500 group">
                  <div className="w-16 h-16 bg-pink-50 rounded-3xl flex items-center justify-center text-pink-400 mb-8 group-hover:bg-pink-500 group-hover:text-white transition-all duration-500 shadow-sm">
                    <item.icon size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 font-serif text-slate-800">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <Location />
      </main>
      <footer className="bg-slate-900 text-white py-24 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold tracking-tight font-serif italic">
                Candi Nails <span className="text-pink-500">& Spa</span>
              </span>
            </div>
            <p className="text-slate-400 max-w-xs text-center md:text-left leading-relaxed font-medium">
              Premium nail artistry and luxury waxing services in Bridgeton, NJ.
            </p>
          </div>
          <div className="flex gap-20 text-sm font-medium">
            <div className="space-y-4 flex flex-col">
              <span className="text-pink-500 font-bold uppercase tracking-[0.3em] text-[10px]">Explore</span>
              <button onClick={() => scrollTo('hero')} className="text-slate-300 hover:text-white transition text-left">Home</button>
              <button onClick={() => scrollTo('services')} className="text-slate-300 hover:text-white transition text-left">Services</button>
              <button onClick={() => scrollTo('location')} className="text-slate-300 hover:text-white transition text-left">Location</button>
            </div>
            <div className="space-y-4 flex flex-col">
              <span className="text-pink-500 font-bold uppercase tracking-[0.3em] text-[10px]">Legal</span>
              <button onClick={() => setView('privacy')} className="text-slate-300 hover:text-white transition text-left">Privacy</button>
              <button onClick={() => setView('terms')} className="text-slate-300 hover:text-white transition text-left">Terms</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-slate-800 flex flex-col items-center gap-4 text-center">
          <p className="text-xs text-slate-300 font-bold uppercase tracking-[0.2em]">© 2024 Candi Nails & Spa. All rights reserved.</p>
          <p className="text-xs font-bold text-white/70 tracking-[0.15em] uppercase">
            Powered by <a href="#" className="text-pink-500 hover:text-pink-400 transition-all duration-300 underline underline-offset-8 decoration-pink-500/30 hover:decoration-pink-500">Red Wire Ai</a>
          </p>
        </div>
      </footer>
      <AIAgent 
        onAdminAuth={handleAdminAuth} 
        onNewBooking={persistBookingAndLead}
        onNewLead={(lead) => persistBookingAndLead({...lead, source: "WEBSITE VOICE AGENT"})}
        team={team}
      />
    </div>
  );
};

export default App;
