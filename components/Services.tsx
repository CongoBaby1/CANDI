
import React from 'react';
import { ServiceCategory, Service } from '../types';

interface ServicesProps {
  services: Service[];
}

const Services: React.FC<ServicesProps> = ({ services }) => {
  const categories = [
    { name: ServiceCategory.CONSULTATION, desc: "Professional technical audits." },
    { name: ServiceCategory.NURSERY, desc: "Early stage plant stabilization." },
    { name: ServiceCategory.ENVIRONMENT, desc: "Precision hardware calibration." },
    { name: ServiceCategory.CURING, desc: "Post-harvest terpene locks." }
  ];

  return (
    <section id="services" className="py-32 bg-[#f8faf9] relative">
      <div className="max-w-7xl mx-auto px-6 md:px-16">
        <div className="max-w-2xl mb-20">
          <span className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[10px] mono">Technical Portfolio</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 tracking-tight">The 2026 Protocol</h2>
          <p className="text-slate-600 font-medium text-lg leading-relaxed">System-wide optimizations designed for consistent pharmaceutical-grade outcomes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {categories.map((cat) => (
            <div key={cat.name} className="service-group flex flex-col group">
              <div className="mb-10 relative">
                <h3 className="text-xl font-bold text-slate-900 mb-2 whitespace-nowrap uppercase tracking-tighter">{cat.name}</h3>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mono">{cat.desc}</p>
                <div className="absolute -bottom-4 left-0 w-8 h-0.5 bg-emerald-200 group-hover:w-full transition-all duration-700"></div>
              </div>
              <div className="flex-1 space-y-7">
                {services
                  .filter(s => s.category === cat.name)
                  .map(s => (
                    <div key={s.id} className="group/item cursor-default">
                      <div className="flex flex-col mb-1">
                        <span className="font-bold text-slate-900 group-hover/item:text-emerald-600 transition-colors text-sm">{s.name}</span>
                        <span className="text-emerald-700/60 font-medium text-xs mt-1 mono">{s.price}</span>
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
