
import { Consultation, Grower, Cultivator, SystemLog, Service } from '../types';

/**
 * LOCAL STORAGE DATABASE SERVICE
 * Replaces Supabase for local-first persistence.
 */

const STORAGE_KEYS = {
  GROWERS: 'gh_growers',
  CONSULTATIONS: 'gh_consultations',
  CULTIVATORS: 'gh_cultivators',
  SERVICES: 'gh_services',
  LOGS: 'gh_logs'
};

const getLocal = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
};

const setLocal = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Local Storage Error [${key}]:`, e);
  }
};

export const db = {
  getStats: async () => {
    const s = getLocal<Service[]>(STORAGE_KEYS.SERVICES, []);
    const c = getLocal<Cultivator[]>(STORAGE_KEYS.CULTIVATORS, []);
    const b = getLocal<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, []);
    const g = getLocal<Grower[]>(STORAGE_KEYS.GROWERS, []);
    return { 
      services: s.length, 
      team: c.length, 
      consultations: b.length, 
      growers: g.length 
    };
  },

  getGrowers: async (): Promise<Grower[]> => {
    return getLocal<Grower[]>(STORAGE_KEYS.GROWERS, []);
  },

  getConsultations: async (): Promise<Consultation[]> => {
    const data = getLocal<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, []);
    return data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  deleteConsultation: async (id: string) => {
    const data = getLocal<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, []);
    setLocal(STORAGE_KEYS.CONSULTATIONS, data.filter(i => i.id !== id));
  },

  getCultivators: async (): Promise<Cultivator[]> => {
    return getLocal<Cultivator[]>(STORAGE_KEYS.CULTIVATORS, []);
  },

  saveCultivator: async (member: Cultivator) => {
    const data = getLocal<Cultivator[]>(STORAGE_KEYS.CULTIVATORS, []);
    const index = data.findIndex(i => i.id === member.id);
    if (index > -1) data[index] = member;
    else data.push(member);
    setLocal(STORAGE_KEYS.CULTIVATORS, data);
  },

  deleteCultivator: async (id: string) => {
    const data = getLocal<Cultivator[]>(STORAGE_KEYS.CULTIVATORS, []);
    setLocal(STORAGE_KEYS.CULTIVATORS, data.filter(i => i.id !== id));
  },

  getServices: async (): Promise<Service[]> => {
    return getLocal<Service[]>(STORAGE_KEYS.SERVICES, []);
  },

  saveService: async (service: Service) => {
    const data = getLocal<Service[]>(STORAGE_KEYS.SERVICES, []);
    const index = data.findIndex(i => i.id === service.id);
    if (index > -1) data[index] = service;
    else data.push(service);
    setLocal(STORAGE_KEYS.SERVICES, data);
  },

  deleteService: async (id: string) => {
    const data = getLocal<Service[]>(STORAGE_KEYS.SERVICES, []);
    setLocal(STORAGE_KEYS.SERVICES, data.filter(i => i.id !== id));
  },

  getLogs: async (): Promise<SystemLog[]> => {
    const data = getLocal<SystemLog[]>(STORAGE_KEYS.LOGS, []);
    return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);
  },

  addLog: async (log: SystemLog) => {
    const data = getLocal<SystemLog[]>(STORAGE_KEYS.LOGS, []);
    data.unshift(log);
    setLocal(STORAGE_KEYS.LOGS, data.slice(0, 100));
  },

  executeConsultationTransaction: async (data: any): Promise<{ consultation: Consultation, grower: Grower, isNewGrower: boolean }> => {
    const growers = getLocal<Grower[]>(STORAGE_KEYS.GROWERS, []);
    const consultations = getLocal<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, []);
    
    let grower = growers.find(g => g.contact === data.contact);
    let isNewGrower = false;

    if (grower) {
      grower.name = data.client_name || grower.name;
      grower.status = 'On-Protocol';
    } else {
      isNewGrower = true;
      grower = {
        id: `grower-${Math.random().toString(36).substr(2, 9)}`,
        name: data.client_name,
        contact: data.contact,
        status: 'On-Protocol',
        source: data.source || "AI_AGENT",
        created_at: new Date().toISOString()
      };
      growers.push(grower);
    }

    const newConsultation: Consultation = {
      id: `consult-${Math.random().toString(36).substr(2, 9)}`,
      grower_id: grower.id,
      client_name: data.client_name,
      contact: data.contact,
      stage: data.stage,
      temperature: data.temperature,
      humidity: data.humidity,
      recommended_action: data.recommended_action,
      status: 'active',
      is_ai_confirmed: true,
      created_at: new Date().toISOString()
    };

    consultations.push(newConsultation);
    
    setLocal(STORAGE_KEYS.GROWERS, growers);
    setLocal(STORAGE_KEYS.CONSULTATIONS, consultations);

    return { consultation: newConsultation, grower, isNewGrower };
  }
};
