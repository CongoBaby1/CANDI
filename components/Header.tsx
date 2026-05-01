
import React from 'react';

const Header: React.FC = () => {
  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-16 py-4 md:py-6">
      <div className="flex items-center gap-2 cursor-pointer">
        <span className="text-2xl font-black tracking-tighter text-white mono uppercase font-mono drop-shadow-sm">
          THE <span className="text-emerald-400">GREEN GENIE</span>
        </span>
      </div>
      <div className="w-[140px] hidden lg:block"></div>
    </nav>
  );
};

export default Header;
