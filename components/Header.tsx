
import React from 'react';

const Header: React.FC = () => {
  return (
    <nav className="fixed bottom-4 md:bottom-8 w-full z-40 flex justify-center items-center pointer-events-none">
      <div className="flex items-center gap-2 cursor-pointer pointer-events-auto bg-emerald-950/40 backdrop-blur-md px-6 py-3 rounded-full border border-emerald-500/20 shadow-2xl">
        <span className="text-xl md:text-2xl font-black tracking-tighter text-white mono uppercase font-mono drop-shadow-md">
          THE <span className="text-emerald-400">GREEN GENIE</span>
        </span>
      </div>
    </nav>
  );
};

export default Header;
