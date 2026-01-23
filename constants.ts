
import { ServiceCategory, Service } from './types';

export const BUSINESS_INFO = {
  name: "Candi Nails & Spa",
  address: "25 Cornwell Dr, Bridgeton, NJ 08302",
  phone: "856-455-8989",
  hours: {
    mon_sat: "7 AM – 9 PM",
    sun: "Closed"
  },
  adminPhrase: "Candi Nails 25 Cornwell Drive"
};

export const INITIAL_SERVICES: Service[] = [
  { id: 'm1', category: ServiceCategory.MANICURE, name: 'Basic Manicure', price: '$20–$25' },
  { id: 'm2', category: ServiceCategory.MANICURE, name: 'Gel Manicure (Shellac)', price: '$30–$40' },
  { id: 'm3', category: ServiceCategory.MANICURE, name: 'Dip Powder (SNS)', price: '$40–$50' },
  { id: 'p1', category: ServiceCategory.PEDICURE, name: 'Regular Pedicure', price: '$30–$40' },
  { id: 'p2', category: ServiceCategory.PEDICURE, name: 'Spa/Deluxe Pedicure', price: '$45–$60' },
  { id: 'p3', category: ServiceCategory.PEDICURE, name: 'Gel Pedicure', price: '$45–$65' },
  { id: 'e1', category: ServiceCategory.ENHANCEMENT, name: 'Acrylic Full Set', price: '$45–$60+' },
  { id: 'e2', category: ServiceCategory.ENHANCEMENT, name: 'Acrylic Refill', price: '$30–$45' },
  { id: 'e3', category: ServiceCategory.ENHANCEMENT, name: 'Gel-X/UV Gel', price: '$55–$75' },
  { id: 'e4', category: ServiceCategory.ENHANCEMENT, name: 'Pink & White French Set', price: '$60–$75' },
  { id: 'w1', category: ServiceCategory.WAXING, name: 'Eyebrow Wax', price: '$10–$15' },
  { id: 'w2', category: ServiceCategory.WAXING, name: 'Lip/Chin Wax', price: '$8–$12' },
  { id: 'w3', category: ServiceCategory.WAXING, name: 'Full Face Wax', price: '$35–$45' }
];

export const HERO_IMAGE = "https://i.imgur.com/PJAqG7y.png";
