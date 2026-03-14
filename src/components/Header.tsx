import React from 'react';

interface HeaderProps {
  title: string;
  date: string;
  quote: string;
}

export const Header: React.FC<HeaderProps> = ({ title, date, quote }) => {
  return (
    <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#e7e9ea] tracking-tight">{title}</h1>
          <p className="text-[13px] text-[#71767b] font-medium">{date}</p>
        </div>
        <div className="hidden md:block">
          <p className="text-[13px] text-[#71767b] italic">"{quote}"</p>
        </div>
      </div>
    </header>
  );
};
