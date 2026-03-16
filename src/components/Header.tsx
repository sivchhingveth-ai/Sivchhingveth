import React from 'react';

interface HeaderProps {
  title: string;
  date: string;
  quote: string;
}

export const Header: React.FC<Omit<HeaderProps, 'date'>> = ({ title, quote }) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-[#e7e9ea] tracking-tight leading-tight">{title}</h1>
          <p className="text-[12px] md:text-[13px] text-[#71767b] font-medium">
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <div className="hidden md:block">
          <p className="text-[13px] text-[#71767b] italic font-medium">"{quote}"</p>
        </div>
      </div>
    </header>
  );
};
