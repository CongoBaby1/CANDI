
import React from 'react';
import { ServiceCategory, Service } from '../types';

interface ServicesProps {
  services: Service[];
}

const Services: React.FC<ServicesProps> = ({ services }) => {
  const categories = [
    { name: ServiceCategory.MANICURE, desc: "Elegant care for your hands." },
    { name: ServiceCategory.PEDICURE, desc: "Luxury treatment for your feet." },
    { name: ServiceCategory.ENHANCEMENT, desc: "Professional length and strength." },
    { name: ServiceCategory.WAXING, desc: "Smooth, flawless skin results." }
  ];

  return (
    <section id="services" className="py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-6 md:px-16">
        <div className="max-w-2xl mb-20 text-center md:text-left">
          <span className="text-pink-400 font-bold uppercase tracking-[0.3em] text-[10px]">The Signature Collection</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6 font-serif">Services & Pricing</h2>
          <p className="text-slate-600 font-medium text-lg italic font-serif">A curated selection of artisanal treatments for your lasting beauty.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {categories.map((cat) => (
            <div key={cat.name} className="service-group flex flex-col group">
              <div className="mb-10 relative">
                <h3 className="text-3xl font-bold text-slate-900 font-serif mb-2">{cat.name}</h3>
                <p className="text-xs text-pink-600 font-bold uppercase tracking-widest">{cat.desc}</p>
                <div className="absolute -bottom-4 left-0 w-12 h-1 bg-pink-100 group-hover:w-full transition-all duration-500"></div>
              </div>
              <div className="flex-1 space-y-7">
                {services
                  .filter(s => s.category === cat.name)
                  .map(s => (
                    <div key={s.id} className="group/item cursor-default">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-semibold text-slate-900 group-hover/item:text-pink-500 transition-colors">{s.name}</span>
                        <div className="flex-1 border-b border-pink-50 mx-4 mb-1"></div>
                        <span className="text-pink-600 font-bold">{s.price}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
