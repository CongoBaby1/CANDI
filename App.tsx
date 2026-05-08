
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import AIAgent from './components/AIAgent';
import CannabisUniversity from './components/CannabisUniversity';
import LessonPage from './components/LessonPage';
import { Cultivator, SystemLog } from './types';
import { db } from './services/databaseService';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [cultivators, setCultivators] = useState<Cultivator[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const location = useLocation();

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const refreshData = async () => {
    try {
      const [t, logsData] = await Promise.all([
        db.getCultivators(),
        db.getLogs()
      ]);
      setCultivators(t || []);
      setLogs(logsData || []);
    } catch (err) {
      console.warn("Nexus Sync: Falling back to local state.");
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        await refreshData();
      } catch (err) {
        console.error("OS Boot Exception:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  const addLog = async (action: string, details: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const newLog: SystemLog = {
      id: `log-${Math.random().toString(36).substring(2, 9)}`,
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

  const handleConsultation = async (data: any) => {
    try {
      const result = await db.executeConsultationTransaction({
        ...data,
        source: "GREEN_GENIE_CONSULTATION"
      });
      await refreshData();
      await addLog("Protocol Synced", `Consultation recorded for ${result.grower.name}`, "success");
    } catch (err) {
      await addLog("Sync Aborted", "Data integrity check failed.", "error");
    }
  };

  const handleAdminAuth = (phrase: string) => {
    console.log("System override protocol:", phrase);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#064e3b] text-white">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-6" />
        <div className="text-center space-y-4">
          <p className="text-emerald-400/60 font-black uppercase tracking-[0.3em] text-[10px] mono">Initializing Green Genie Environment...</p>
          <div className="pt-4 border-t border-emerald-500/20">
            <p className="text-emerald-500 font-bold uppercase tracking-widest text-[9px]">Age Restricted System</p>
            <p className="text-white/40 text-[11px] font-medium mt-1">You must be 21+ to use this site</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      {/* Optimized background container for mobile fitting */}
      <div className="fixed inset-0 z-[-1] w-full h-[100dvh] bg-[#064e3b]">
        <img 
          src="https://i.imgur.com/uFwOlEL.png" 
          alt="The Green Genie Background"
          className="w-full h-full object-cover object-center sm:object-[center_30%]"
          referrerPolicy="no-referrer"
        />
        {/* Overlay for readability on pages with content */}
        {location.pathname !== '/' && (
          <div className="absolute inset-0 bg-[#064e3b]/45 backdrop-blur-md" />
        )}
      </div>

      <Header />
      
      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<div className="h-screen" />} />
          <Route path="/cannabis-university" element={<CannabisUniversity />} />
          <Route path="/cannabis-university/lesson/:id" element={<LessonPage />} />
        </Routes>
      </main>

      <AIAgent 
        onConsultation={handleConsultation}
        onAdminAuth={handleAdminAuth}
        cultivators={cultivators}
      />
    </div>
  );
};

export default App;
