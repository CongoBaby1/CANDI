
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, FileText, Database, Plus, Trash2, 
  RefreshCcw, LogOut, Search, Download, UploadCloud, User, CheckCircle2, X, Clock, Edit2, Info, Sparkles, Cloud, AlertCircle, Terminal, Copy, Check, ChevronRight, Activity, Settings, BarChart3, ShieldCheck, Mail, CalendarDays, ExternalLink, MoreVertical, Save
} from 'lucide-react';
import { Service, Booking, Lead, Technician, SystemLog, WeekAvailability, ServiceCategory, DayAvailability } from '../types';
import { db, isConfigured } from '../services/databaseService';
import { INITIAL_SERVICES } from '../constants';

interface AdminDashboardProps {
  onExit: () => void;
  bookings: Booking[];
  leads: Lead[];
  team: Technician[];
  services: Service[];
  logs: SystemLog[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  updateLocalTeam: (team: Technician[]) => void;
  updateLocalServices: (services: Service[]) => void;
  refreshData: () => Promise<void>;
}

const DEFAULT_AVAILABILITY: WeekAvailability = {
  monday: { isOpen: true, start: "07:00", end: "21:00" },
  tuesday: { isOpen: true, start: "07:00", end: "21:00" },
  wednesday: { isOpen: true, start: "07:00", end: "21:00" },
  thursday: { isOpen: true, start: "07:00", end: "21:00" },
  friday: { isOpen: true, start: "07:00", end: "21:00" },
  saturday: { isOpen: true, start: "07:00", end: "21:00" },
  sunday: { isOpen: false, start: "09:00", end: "17:00" },
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onExit, bookings, leads, team, services, logs, 
  setBookings, setLeads, updateLocalTeam, updateLocalServices, refreshData
}) => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingMember, setEditingMember] = useState<Technician | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', calendar_email: '' });

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      alert("Name and email are required.");
      return;
    }
    
    setIsProcessing(true);
    const tech: Technician = {
      id: `tech-${Math.random().toString(36).substr(2, 9)}`,
      name: newMember.name,
      email: newMember.email,
      calendar_email: newMember.calendar_email || newMember.email,
      is_synced: true,
      availability: DEFAULT_AVAILABILITY
    };
    
    try {
      await db.saveTeamMember(tech);
      await refreshData();
      setNewMember({ name: '', email: '', calendar_email: '' });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Failed to add member:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMember = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm("Confirm deletion of this technician? This action cannot be undone.")) return;
    
    setIsProcessing(true);
    try {
      await db.deleteTeamMember(id);
      await refreshData();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("System error during deletion. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAvailability = async () => {
    if (!editingMember) return;
    setIsProcessing(true);
    try {
      await db.saveTeamMember(editingMember);
      await refreshData();
      setEditingMember(null);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTitle = () => {
    switch(activeTab) {
      case 'bookings': return 'Bookings';
      case 'leads': return 'Leads';
      case 'team': return 'Team & Calendars';
      case 'services': return 'Services';
      case 'setup': return 'System Setup';
      default: return activeTab;
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafd] overflow-hidden">
      <aside className="w-64 bg-[#111827] text-white flex flex-col shrink-0">
        <div className="p-8"><span className="text-xl font-bold font-serif italic">Candi Nails <span className="text-pink-500">& Spa</span></span></div>
        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'bookings', label: 'Bookings', icon: Calendar },
            { id: 'leads', label: 'Leads', icon: Users },
            { id: 'team', label: 'Team', icon: CalendarDays },
            { id: 'services', label: 'Services', icon: FileText },
            { id: 'setup', label: 'Setup', icon: Settings },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>
        <button onClick={onExit} className="m-4 flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-pink-400 transition"><LogOut size={16} /> Logout</button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-12 py-10 bg-[#1e293b] text-white flex justify-between items-end shrink-0">
          <div>
            <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.25em] mb-1">Management Console</p>
            <h1 className="text-5xl font-bold font-serif">{getTitle()}</h1>
          </div>
          {activeTab === 'team' && (
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-pink-900/20">
              <Plus size={16} /> Add Team Member
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-12 space-y-8 bg-slate-50/50">
          {activeTab === 'team' && (
            <div className="space-y-10">
              <div className="p-6 bg-pink-50/50 border border-pink-100 rounded-[2rem] flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-pink-500 shadow-sm border border-pink-100"><RefreshCcw size={20} className="animate-spin-slow" /></div>
                <div><h4 className="text-[10px] font-black text-pink-600 uppercase tracking-[0.2em]">Shop Sync Active</h4><p className="text-xs font-medium text-pink-400">All technician calendars are currently synchronized.</p></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {team.map(member => (
                  <div key={member.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 text-center flex flex-col items-center group relative">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 bg-pink-50 rounded-[2.5rem] flex items-center justify-center text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-all duration-500"><User size={40} /></div>
                      <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center text-white"><Check size={14} strokeWidth={4} /></div>
                    </div>
                    <h3 className="text-3xl font-bold font-serif text-slate-800 mb-2">{member.name}</h3>
                    <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1">{member.email}</p>
                    <p className="text-[10px] font-bold text-pink-400 tracking-widest uppercase mb-8 flex items-center gap-2"><Calendar size={12} /> {member.calendar_email}</p>
                    
                    <div className="flex gap-2 w-full mt-auto">
                      <button 
                        onClick={() => setEditingMember(member)} 
                        className="flex-1 bg-[#111827] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all"
                      >
                        Calendar
                      </button>
                      <button 
                        onClick={(e) => handleDeleteMember(member.id, e)} 
                        disabled={isProcessing}
                        className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500" size={20} />
                <input type="text" placeholder="Search leads..." className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-pink-500/5 shadow-sm font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase text-slate-400 font-black tracking-widest">
                    <tr><th className="px-8 py-6">Lead Name</th><th className="px-8 py-6">Contact</th><th className="px-8 py-6">Service</th><th className="px-8 py-6">Source</th><th className="px-8 py-6">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredLeads.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50 transition">
                        <td className="px-8 py-6 font-bold text-slate-800">{l.name}</td>
                        <td className="px-8 py-6 text-sm text-slate-500">{l.email || l.phone}</td>
                        <td className="px-8 py-6 text-sm text-slate-500">{l.service}</td>
                        <td className="px-8 py-6"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{l.source}</span></td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-400 uppercase tracking-widest">{l.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase text-slate-400 font-black tracking-widest">
                  <tr><th className="px-8 py-6">Client</th><th className="px-8 py-6">Service</th><th className="px-8 py-6">Date/Time</th><th className="px-8 py-6">Tech</th><th className="px-8 py-6">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="px-8 py-6 font-bold text-slate-800">{b.first_name}</td>
                      <td className="px-8 py-6 text-sm text-slate-500 font-bold uppercase tracking-wide">{b.service}</td>
                      <td className="px-8 py-6 text-sm text-slate-500 font-medium">{b.date} • {b.time}</td>
                      <td className="px-8 py-6 text-sm text-slate-500 font-bold italic">{b.tech}</td>
                      <td className="px-8 py-6"><span className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100/50">{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Availability Editor Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111827]/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold font-serif text-slate-800">Edit Availability</h2>
                <p className="text-sm font-bold text-pink-500 uppercase tracking-widest mt-1">{editingMember.name}'s Weekly Calendar</p>
              </div>
              <button onClick={() => setEditingMember(null)} className="p-4 hover:bg-slate-100 rounded-2xl transition"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-4">
              {Object.keys(editingMember.availability).map((day) => {
                const dayAvail = (editingMember.availability as any)[day] as DayAvailability;
                return (
                  <div key={day} className={`flex items-center gap-6 p-6 rounded-3xl border transition-all ${dayAvail.isOpen ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    <div className="w-32">
                      <span className="text-sm font-black text-slate-800 uppercase tracking-widest">{day}</span>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <div className={`w-12 h-6 rounded-full relative transition-colors ${dayAvail.isOpen ? 'bg-green-500' : 'bg-slate-300'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={dayAvail.isOpen} 
                          onChange={(e) => {
                            const updated = { ...editingMember };
                            (updated.availability as any)[day].isOpen = e.target.checked;
                            setEditingMember(updated);
                          }}
                        />
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${dayAvail.isOpen ? 'left-7' : 'left-1'}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{dayAvail.isOpen ? 'Open' : 'Closed'}</span>
                    </label>

                    {dayAvail.isOpen && (
                      <div className="flex-1 flex items-center justify-end gap-4 animate-in fade-in slide-in-from-right-2">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Start</p>
                          <input 
                            type="time" 
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-pink-500"
                            value={dayAvail.start}
                            onChange={(e) => {
                              const updated = { ...editingMember };
                              (updated.availability as any)[day].start = e.target.value;
                              setEditingMember(updated);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">End</p>
                          <input 
                            type="time" 
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-pink-500"
                            value={dayAvail.end}
                            onChange={(e) => {
                              const updated = { ...editingMember };
                              (updated.availability as any)[day].end = e.target.value;
                              setEditingMember(updated);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
              <button onClick={() => setEditingMember(null)} className="px-8 py-4 text-sm font-bold text-slate-500 hover:text-slate-800 transition uppercase tracking-widest">Discard Changes</button>
              <button onClick={handleSaveAvailability} disabled={isProcessing} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-black transition shadow-xl disabled:opacity-50">
                {isProcessing ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
                Save Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111827]/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden p-10 space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold font-serif text-slate-800">New Staff</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-pink-500/10 transition font-bold" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Email</label>
                <input type="email" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-pink-500/10 transition font-bold" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Google Calendar Email (Optional)</label>
                <input type="email" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-pink-500/10 transition font-bold" value={newMember.calendar_email} onChange={(e) => setNewMember({...newMember, calendar_email: e.target.value})} />
              </div>
            </div>
            <button onClick={handleAddMember} disabled={isProcessing} className="w-full bg-pink-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] hover:bg-pink-700 transition shadow-xl shadow-pink-200 disabled:opacity-50">
              {isProcessing ? "Creating Account..." : "Add Technician"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
