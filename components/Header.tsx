
import React from 'react';

const Header: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-start items-center px-4 md:px-16 py-6 md:py-10 pointer-events-none">
      <div className="flex items-center gap-2 cursor-pointer pointer-events-auto group">
        <span className="text-xl md:text-3xl font-black tracking-tighter text-white mono uppercase font-mono drop-shadow-lg transition-transform group-hover:scale-105">
          THE <span className="text-emerald-400">GREEN GENIE</span>
        </span>
      </div>
    </nav>
  );
};

export default Header;
