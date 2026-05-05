
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AIAgent from './components/AIAgent';
import { Cultivator, SystemLog } from './types';
import { db } from './services/databaseService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [cultivators, setCultivators] = useState<Cultivator[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f0f4f2]">
        <Loader2 className="w-12 h-12 text-emerald-700 animate-spin mb-4" />
        <p className="text-emerald-900/40 font-bold uppercase tracking-widest text-[10px] mono">Initializing Green Genie Environment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      {/* Optimized background container for mobile fitting */}
      <div className="fixed inset-0 z-[-1] w-full h-[100dvh] bg-[#064e3b]">
        <img 
          src="https://i.imgur.com/PB3h0m5.png" 
          alt="The Green Genie Background"
          className="w-full h-full object-cover object-center md:object-[center_30%]"
          referrerPolicy="no-referrer"
        />
      </div>
      <Header />
      <main className="min-h-screen">
        {/* Visual landing page with background image and AI agent only */}
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
