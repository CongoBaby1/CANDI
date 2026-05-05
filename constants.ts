
import { ServiceCategory, Service } from './types';

export const BUSINESS_INFO = {
  name: "The Green Genie",
  address: "Digital Protocol Hub | Pharmaceutical Grade",
  phone: "1-800-GROW-VPD",
  hours: {
    mon_sat: "24/7 Monitoring",
    sun: "Autonomous Mode"
  },
  adminPhrase: "Green Genie Protocol 2026 Schedule III"
};

export const INITIAL_SERVICES: Service[] = [
  { id: 's1', category: ServiceCategory.CONSULTATION, name: 'VPD Analysis & Calibration', price: 'Technical Audit' },
  { id: 's2', category: ServiceCategory.CONSULTATION, name: 'Nursery Protocol Setup', price: 'Scale Audit' },
  { id: 's3', category: ServiceCategory.NURSERY, name: 'Genetics Stabilization', price: 'Lab Service' },
  { id: 's4', category: ServiceCategory.NURSERY, name: 'Pathogen Detection Scan', price: 'Diagnostic' },
  { id: 's5', category: ServiceCategory.ENVIRONMENT, name: 'LED Spectrum Optimization', price: 'Calibration' },
  { id: 's6', category: ServiceCategory.ENVIRONMENT, name: 'HVAC-D Precision Tuning', price: 'Optimization' },
  { id: 's7', category: ServiceCategory.CURING, name: 'Cryopathic Curing Protocol', price: 'Terpene Lock' },
  { id: 's8', category: ServiceCategory.CURING, name: 'Moisture Activity Mapping', price: 'Stability' }
];

export const HERO_IMAGE = "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=2000";
