
import { createClient } from '@supabase/supabase-js';
import { Booking, Lead, Technician, SystemLog, Service } from '../types';

/**
 * SUPABASE CLOUD DATABASE SERVICE
 */
const PROJECT_URL = "https://wzylwlhplcrdehtbmioy.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eWx3bGhwbGNyZGVodGJtaW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODQyMTgsImV4cCI6MjA4NDY2MDIxOH0.Sa-7FaZ4IiGXwsOU4o8azyNj2lxFazlmknejNggkfdA";

export const isConfigured = () => {
  const url = (window as any)._SUPABASE_URL || PROJECT_URL;
  const key = (window as any)._SUPABASE_ANON_KEY || ANON_KEY;
  return url.length > 10 && key.length > 10 && !url.includes('your-project-url');
};

export const getSupabaseClient = () => {
  const url = (window as any)._SUPABASE_URL || PROJECT_URL;
  const key = (window as any)._SUPABASE_ANON_KEY || ANON_KEY;
  
  if (!url || !key || url.includes('your-project-url')) return null;
  return createClient(url, key);
};

const handleError = (error: any, context: string) => {
  console.error(`[Supabase Error - ${context}]:`, error.message);
  if (error.code === '42P01') return []; 
  throw error;
};

export const db = {
  getStats: async () => {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const [s, t, b, l] = await Promise.all([
        client.from('services').select('*', { count: 'exact', head: true }),
        client.from('technicians').select('*', { count: 'exact', head: true }),
        client.from('bookings').select('*', { count: 'exact', head: true }),
        client.from('leads').select('*', { count: 'exact', head: true })
      ]);
      return { services: s.count || 0, team: t.count || 0, bookings: b.count || 0, leads: l.count || 0 };
    } catch (e) { return null; }
  },

  getLeads: async (): Promise<Lead[]> => {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
      const { data, error } = await client.from('leads').select('*').order('created_at', { ascending: false });
      if (error) return handleError(error, 'leads');
      return data || [];
    } catch (e) { return []; }
  },

  getBookings: async (): Promise<Booking[]> => {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
      const { data, error } = await client.from('bookings').select('*').order('created_at', { ascending: false });
      if (error) return handleError(error, 'bookings');
      return data || [];
    } catch (e) { return []; }
  },

  getTeam: async (): Promise<Technician[]> => {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
      const { data, error } = await client.from('technicians').select('*');
      if (error) return handleError(error, 'technicians');
      return data || [];
    } catch (e) { return []; }
  },

  saveTeamMember: async (member: Technician) => {
    const client = getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('technicians').upsert(member);
    if (error) return handleError(error, 'technicians');
  },

  deleteTeamMember: async (id: string) => {
    const client = getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('technicians').delete().eq('id', id);
    if (error) return handleError(error, 'technicians');
  },

  seedTeam: async (members: Technician[]) => {
    const client = getSupabaseClient();
    if (!client) throw new Error("Database not connected.");
    const { error } = await client.from('technicians').upsert(members);
    if (error) return handleError(error, 'technicians');
  },

  getServices: async (): Promise<Service[]> => {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
      const { data, error } = await client.from('services').select('*');
      if (error) return handleError(error, 'services');
      return data || [];
    } catch (e) { return []; }
  },

  saveService: async (service: Service) => {
    const client = getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('services').upsert(service);
    if (error) return handleError(error, 'services');
  },

  seedServices: async (services: Service[]) => {
    const client = getSupabaseClient();
    if (!client) throw new Error("Database not connected.");
    const { error } = await client.from('services').upsert(services);
    if (error) return handleError(error, 'services');
  },

  getLogs: async (): Promise<SystemLog[]> => {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
      const { data, error } = await client.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(50);
      if (error) return handleError(error, 'system_logs');
      return data || [];
    } catch (e) { return []; }
  },

  addLog: async (log: SystemLog) => {
    const client = getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('system_logs').insert(log);
    if (error) return handleError(error, 'system_logs');
  },

  executeBookingTransaction: async (data: any): Promise<{ booking: Booking, lead: Lead, isNewLead: boolean }> => {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase is not configured.");
    
    // Normalize field names from AI tool output
    const firstName = data.first_name || data.firstName;
    
    const { data: existingLeads, error: findError } = await client
      .from('leads')
      .select('*')
      .or(`email.ilike.${data.email},phone.eq.${data.phone}`)
      .limit(1);

    if (findError) throw findError;

    let finalLead: Lead;
    let isNewLead = false;

    if (existingLeads && existingLeads.length > 0) {
      const existing = existingLeads[0];
      finalLead = { ...existing, name: firstName || existing.name, service: data.service, status: 'Booked' };
      await client.from('leads').update(finalLead).eq('id', existing.id);
    } else {
      isNewLead = true;
      finalLead = {
        id: `lead-${Math.random().toString(36).substr(2, 9)}`,
        name: firstName, phone: data.phone, email: data.email,
        service: data.service, notes: `Booked via AI`, source: data.source || "WEBSITE",
        status: 'Booked', type: "DIRECT INQUIRY", created_at: new Date().toISOString()
      };
      await client.from('leads').insert(finalLead);
    }

    const newBooking: Booking = {
      id: `book-${Math.random().toString(36).substr(2, 9)}`,
      lead_id: finalLead.id, first_name: firstName, phone: data.phone,
      email: data.email, service: data.service, date: data.date, time: data.time,
      tech: data.tech, status: 'confirmed', is_ai_confirmed: data.is_ai_confirmed || false,
      created_at: new Date().toISOString()
    };

    await client.from('bookings').insert(newBooking);
    return { booking: newBooking, lead: finalLead, isNewLead };
  }
};
