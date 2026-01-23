
import React from 'react';

interface HeaderProps {
  onScrollTo: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onScrollTo }) => {
  const handleNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    onScrollTo(id);
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-pink-100/50 flex justify-between items-center px-6 md:px-16 py-5">
      <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => handleNavClick(e, 'hero')}>
        <span className="text-3xl font-bold tracking-tight text-slate-900 font-serif">
          Candi Nails <span className="text-pink-600 italic">& Spa</span>
        </span>
      </div>
      
      <div className="hidden lg:flex gap-10 text-[15px] font-extrabold uppercase tracking-[0.1em] text-slate-950">
        <a 
          href="#services" 
          onClick={(e) => handleNavClick(e, 'services')} 
          className="hover:text-pink-600 transition-colors pb-1 border-b-2 border-transparent hover:border-pink-600"
        >
          Our Services
        </a>
        <a 
          href="#our-story" 
          onClick={(e) => handleNavClick(e, 'our-story')} 
          className="hover:text-pink-600 transition-colors pb-1 border-b-2 border-transparent hover:border-pink-600"
        >
          Our Story
        </a>
        <a 
          href="#location" 
          onClick={(e) => handleNavClick(e, 'location')} 
          className="hover:text-pink-600 transition-colors pb-1 border-b-2 border-transparent hover:border-pink-600"
        >
          Visit Us
        </a>
      </div>
      
      <div className="w-[140px] hidden lg:block"></div>
    </nav>
  );
};

export default Header;
