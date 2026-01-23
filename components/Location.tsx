
import React from 'react';
import { MapPin, Clock, Phone } from 'lucide-react';
import { BUSINESS_INFO } from '../constants';

const Location: React.FC = () => {
  return (
    <section id="location" className="py-32 px-6 md:px-16 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div className="space-y-16">
          <div>
            <span className="text-pink-400 font-bold uppercase tracking-[0.3em] text-[10px]">Location</span>
            <h2 className="text-4xl md:text-6xl font-bold mt-4 mb-8 font-serif text-slate-800">Your Private Retreat</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="w-14 h-14 bg-pink-50 rounded-3xl flex items-center justify-center text-pink-400 shadow-xl shadow-pink-100/20 border border-pink-100/30">
                  <MapPin size={28} />
                </div>
                <h4 className="font-bold text-slate-800 text-lg font-serif italic">Our Studio</h4>
                <p className="text-slate-600 leading-relaxed font-medium">{BUSINESS_INFO.address}</p>
              </div>
              <div className="space-y-4">
                <div className="w-14 h-14 bg-pink-50 rounded-3xl flex items-center justify-center text-pink-400 shadow-xl shadow-pink-100/20 border border-pink-100/30">
                  <Clock size={28} />
                </div>
                <h4 className="font-bold text-slate-800 text-lg font-serif italic">Operating Hours</h4>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Mon - Sat: {BUSINESS_INFO.hours.mon_sat}<br />
                  Sun: {BUSINESS_INFO.hours.sun}
                </p>
              </div>
            </div>
          </div>

          <div className="p-10 bg-pink-500 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-pink-100 relative overflow-hidden group/cta">
            <div className="space-y-2 text-center md:text-left z-10">
              <p className="text-pink-100 font-bold text-xs uppercase tracking-[0.3em]">Ready for Bliss?</p>
              <h3 className="text-3xl font-bold font-serif italic">Book your session</h3>
            </div>
            <a href={`tel:${BUSINESS_INFO.phone}`} className="px-10 py-5 bg-white text-pink-500 rounded-2xl font-bold hover:bg-pink-50 transition-all flex items-center gap-3 shadow-lg z-10 whitespace-nowrap">
              <Phone size={20} className="text-pink-500" /> {BUSINESS_INFO.phone}
            </a>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover/cta:scale-150 transition-transform duration-700"></div>
          </div>
        </div>

        <div className="relative w-full max-w-xl mx-auto lg:mx-0">
          <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(219,39,119,0.15)] h-[600px] border-[16px] border-white bg-slate-50">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3080.3705943924376!2d-75.2155!3d39.432!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c7487222f30999%3A0x6b3b55a0e5b99f24!2s25%20Cornwell%20Dr%2C%20Bridgeton%2C%20NJ%2008302!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy"
            ></iframe>
          </div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-pink-200/20 blur-[100px] rounded-full"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-pink-100/30 blur-[100px] rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default Location;
