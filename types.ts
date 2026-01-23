
export enum ServiceCategory {
  MANICURE = 'Manicures',
  PEDICURE = 'Pedicures',
  ENHANCEMENT = 'Nail Enhancements',
  WAXING = 'Waxing'
}

export interface Service {
  id: string;
  category: ServiceCategory;
  name: string;
  price: string;
}

export interface Booking {
  id: string;
  lead_id: string; 
  first_name: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  time: string;
  tech: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'rescheduled';
  is_ai_confirmed: boolean; 
  created_at: string;
  original_booking_id?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  notes: string;
  source: string;
  status: 'New' | 'Interested' | 'Booked' | 'Closed';
  type: string;
  created_at: string;
}

export interface DayAvailability {
  isOpen: boolean;
  start: string;
  end: string;
}

export interface WeekAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  calendar_email: string;
  is_synced: boolean;
  availability: WeekAvailability;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
