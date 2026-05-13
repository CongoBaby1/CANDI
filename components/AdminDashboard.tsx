
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Trash2, 
  RefreshCcw, LogOut, Search, Plus, User, Check, Edit2, Save, X, Star, Activity, TrendingUp, Download
} from 'lucide-react';
import { Service, Consultation, Grower, Cultivator, SystemLog, ServiceCategory } from '../types';
import { db } from '../services/databaseService';
import { INITIAL_SERVICES } from '../constants';

interface AdminDashboardProps {
  onExit: () => void;
  consultations: Consultation[];
  growers: Grower[];
  cultivators: Cultivator[];
  services: Service[];
  logs: SystemLog[];
  setConsultations: React.Dispatch<React.SetStateAction<Consultation[]>>;
  setGrowers: React.Dispatch<React.SetStateAction<Grower[]>>;
  updateLocalTeam: (team: Cultivator[]) => void;
  updateLocalServices: (services: Service[]) => void;
  refreshData: () => Promise<void>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onExit, consultations, growers, cultivators, services, logs, 
  setConsultations, setGrowers, updateLocalTeam, updateLocalServices, refreshData
}) => {
  const [activeTab, setActiveTab] = useState('services');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [newService, setNewService] = useState<Partial<Service>>({ category: ServiceCategory.CONSULTATION, name: '', price: '' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: '', email: '' });

  const currentServicesToDisplay = useMemo(() => {
    const filtered = services.length > 0 ? services : INITIAL_SERVICES;
    return filtered.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [services, searchQuery]);

  const filteredConsultations = useMemo(() => consultations.filter(b => 
    b.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.recommended_action.toLowerCase().includes(searchQuery.toLowerCase())
  ), [consultations, searchQuery]);

  const filteredGrowers = useMemo(() => growers.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.contact.toLowerCase().includes(searchQuery.toLowerCase())
  ), [growers, searchQuery]);

  const handleSaveService = async () => {
    if (!newService.name || !newService.price) return;
    setIsProcessing(true);
    const serviceToSave: Service = {
      id: editingService ? editingService.id : `svc-${Math.random().toString(36).substr(2, 9)}`,
      category: newService.category as ServiceCategory,
      name: newService.name,
      price: newService.price
    };
    try {
      await db.saveService(serviceToSave);
      await refreshData();
      setIsServiceModalOpen(false);
      setEditingService(null);
    } catch (err) { console.error(err); } finally { setIsProcessing(false); }
  };

  const handleDeleteService = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm("Delete this service?")) return;
    setIsProcessing(true);
    try {
      await db.deleteService(id);
      if (services.length === 0) {
        updateLocalServices(INITIAL_SERVICES.filter(s => s.id !== id));
      } else {
        await refreshData();
      }
    } catch (err) { console.error(err); } finally { setIsProcessing(false); }
  };

  const openAddService = (cat?: ServiceCategory) => {
    setEditingService(null);
    setNewService({ category: cat || ServiceCategory.CONSULTATION, name: '', price: '' });
    setIsServiceModalOpen(true);
  };

  const openEditService = (s: Service) => {
    setEditingService(s);
    setNewService({ category: s.category, name: s.name, price: s.price });
    setIsServiceModalOpen(true);
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) return;
    setIsProcessing(true);
    const tech: Cultivator = {
      id: `cultivator-${Math.random().toString(36).substr(2, 9)}`,
      name: newMember.name, role: newMember.role || "Consultant", email: newMember.email,
      is_active: true
    };
    try { 
      await db.saveCultivator(tech); 
      await refreshData(); 
      setIsAddModalOpen(false); 
    } catch (error) { console.error(error); } finally { setIsProcessing(false); }
  };

  const handleExportData = () => {
    const keys = ['gh_growers', 'gh_consultations', 'gh_cultivators', 'gh_services', 'gg_gardens', 'gg_plants'];
    const exportObj: Record<string, any> = {};
    keys.forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        exportObj[k] = raw ? JSON.parse(raw) : [];
      } catch {
        exportObj[k] = [];
      }
    });
    const date = new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `green-genie-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm("Delete cultivator record?")) return;
    setIsProcessing(true);
    try { await db.deleteCultivator(id); await refreshData(); } catch (error) { console.error(error); } finally { setIsProcessing(false); }
  };

  return (
    <div className="flex h-screen bg-[#f8faf9] overflow-hidden text-slate-900 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-emerald-100 flex flex-col shrink-0">
        <div className="p-8">
          <span className="text-xl font-black tracking-tighter text-slate-900 mono uppercase font-mono">THE <span className="text-emerald-700">GREEN GENIE</span></span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'services', label: 'Protocol Portfolio', icon: Star },
            { id: 'consultations', label: 'Consultations', icon: Calendar },
            { id: 'growers', label: 'Grower Network', icon: TrendingUp },
            { id: 'cultivators', label: 'Team', icon: Users },
            { id: 'logs', label: 'Secure Logs', icon: Activity },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all mono font-mono ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-emerald-50">
          <button onClick={onExit} className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-emerald-700 transition-all mono font-mono">
            <LogOut size={16} /> Terminate
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-10 py-6 bg-white border-b border-emerald-100 flex justify-between items-center shrink-0">
          <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tighter mono font-mono">{activeTab}</h1>
          <div className="flex items-center gap-3">
            <button onClick={handleExportData} title="Export all data as JSON backup" className="flex items-center gap-2 px-4 py-2.5 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-50 transition mono font-mono">
              <Download size={15} /> Export
            </button>
            <button onClick={() => refreshData()} className="p-2.5 text-slate-400 hover:text-slate-900 transition-all">
              <RefreshCcw size={18} className={isProcessing ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => activeTab === 'services' ? openAddService() : setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-800 transition mono font-mono">
              <Plus size={16} /> Add Entry
            </button>
          </div>
        </header>

        {/* SEARCH & FILTERS */}
        <div className="px-10 py-4 bg-white border-b border-emerald-50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Search protocol index..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-emerald-500/10 transition-all text-xs font-bold mono font-mono" />
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-10">
          {activeTab === 'services' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentServicesToDisplay.map(s => (
                <div key={s.id} className="p-6 bg-white rounded-2xl border border-emerald-100 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-emerald-50 text-[9px] font-black uppercase tracking-widest text-emerald-600 rounded-lg mono font-mono">{s.category}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditService(s)} className="p-2 text-slate-400 hover:text-emerald-700"><Edit2 size={16} /></button>
                      <button onClick={(e) => handleDeleteService(s.id, e)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1 tracking-tight">{s.name}</h3>
                  <p className="text-emerald-700 font-bold text-sm mono font-mono uppercase">{s.price}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'consultations' && (
             <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
               <table className="w-full text-left">
                 <thead className="bg-[#f8faf9] border-b border-emerald-100 text-[10px] uppercase text-slate-400 font-black tracking-widest mono font-mono">
                   <tr>
                     <th className="px-8 py-4">Grower</th>
                     <th className="px-8 py-4">Env Status</th>
                     <th className="px-8 py-4">Action</th>
                     <th className="px-8 py-4">Stamp</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-emerald-50">
                   {filteredConsultations.map(b => (
                     <tr key={b.id} className="hover:bg-emerald-50/30 transition-colors">
                       <td className="px-8 py-4 text-sm font-bold text-slate-900">{b.client_name}</td>
                       <td className="px-8 py-4 text-xs text-emerald-700 font-bold mono font-mono">{b.temperature}°C / {b.humidity}%</td>
                       <td className="px-8 py-4 text-xs text-slate-600 font-medium italic">{b.recommended_action}</td>
                       <td className="px-8 py-4 text-[10px] text-slate-400 mono font-mono">{new Date(b.created_at).toLocaleDateString()}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          )}

          {activeTab === 'cultivators' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cultivators.map(member => (
                <div key={member.id} className="bg-white p-8 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                    <User size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">{member.name}</h3>
                  <p className="text-[10px] font-black uppercase text-emerald-600 mb-1 mono font-mono">{member.role}</p>
                  <p className="text-xs text-slate-400 mb-6">{member.email}</p>
                  <button onClick={() => handleDeleteMember(member.id)} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest mono font-mono">Archive Record</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/40 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 animate-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-8 uppercase tracking-tighter mono font-mono">{editingService ? 'Calibrate' : 'New'} Protocol</h2>
            <div className="space-y-6">
              <input type="text" placeholder="Service Name" className="w-full p-4 bg-slate-50 border border-emerald-50 rounded-xl outline-none font-bold text-sm" value={newService.name} onChange={(e) => setNewService({...newService, name: e.target.value})} />
              <input type="text" placeholder="Price Data" className="w-full p-4 bg-slate-50 border border-emerald-50 rounded-xl outline-none font-bold text-sm" value={newService.price} onChange={(e) => setNewService({...newService, price: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={() => setIsServiceModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest mono font-mono">Abort</button>
              <button onClick={handleSaveService} className="flex-1 py-4 bg-emerald-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest mono font-mono">Sync</button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/40 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10">
            <h2 className="text-xl font-bold mb-8 uppercase tracking-tighter mono font-mono">New Personnel</h2>
            <div className="space-y-6">
              <input type="text" placeholder="Name" className="w-full p-4 bg-slate-50 border border-emerald-50 rounded-xl outline-none font-bold text-sm" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} />
              <input type="text" placeholder="Specialization" className="w-full p-4 bg-slate-50 border border-emerald-50 rounded-xl outline-none font-bold text-sm" value={newMember.role} onChange={(e) => setNewMember({...newMember, role: e.target.value})} />
              <input type="email" placeholder="Secure Email" className="w-full p-4 bg-slate-50 border border-emerald-50 rounded-xl outline-none font-bold text-sm" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest mono font-mono">Abort</button>
              <button onClick={handleAddMember} className="flex-1 py-4 bg-emerald-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest mono font-mono">Initialize</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
