
export enum ServiceCategory {
  CONSULTATION = 'Consultation',
  NURSERY = 'The Nursery',
  ENVIRONMENT = 'Environment',
  CURING = 'Curing & Drying'
}

export interface Service {
  id: string;
  category: ServiceCategory;
  name: string;
  price: string;
}

export interface Consultation {
  id: string;
  grower_id: string; 
  client_name: string;
  contact: string;
  stage: string;
  temperature: string;
  humidity: string;
  recommended_action: string;
  status: 'active' | 'archived' | 'flagged';
  is_ai_confirmed: boolean; 
  created_at: string;
}

export interface Grower {
  id: string;
  name: string;
  contact: string;
  status: 'New' | 'Consulting' | 'On-Protocol' | 'Closed';
  source: string;
  created_at: string;
}

export interface Cultivator {
  id: string;
  name: string;
  role: string;
  email: string;
  is_active: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
