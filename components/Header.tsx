
import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-16 py-6 md:py-10 pointer-events-none">
      <Link to="/" className="flex items-center gap-2 cursor-pointer pointer-events-auto group">
        <span className="text-xl md:text-3xl font-black tracking-tighter text-white uppercase font-mono drop-shadow-lg transition-transform group-hover:scale-105">
          THE <span className="text-emerald-400">GREEN</span> GENIE
        </span>
      </Link>
    </nav>
  );
};

export default Header;
