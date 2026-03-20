import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  children: React.ReactNode;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value.getFullYear());

  const handleOpen = () => {
    setViewYear(value.getFullYear());
    setIsOpen(true);
  };

  const handleSelect = (monthIndex: number) => {
    onChange(new Date(viewYear, monthIndex, 1));
    setIsOpen(false);
  };

  const currentMonth = value.getMonth();
  const currentYear = value.getFullYear();
  const now = new Date();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  return (
    <>
      <div onClick={handleOpen} className="cursor-pointer">
        {children}
      </div>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsOpen(false)} />
          <div className="relative bg-[#000000] border border-[#2f3336] rounded-[28px] shadow-[0_32px_128px_rgba(0,0,0,0.8)] w-[320px] md:w-[360px] animate-slide-up overflow-hidden">
            {/* Year Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#2f3336]">
              <button
                onClick={(e) => { e.stopPropagation(); setViewYear(y => y - 1); }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all text-[#71767b] hover:text-[#eff3f4] active:scale-90"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-[20px] font-black text-[#eff3f4] tracking-tighter">{viewYear}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setViewYear(y => y + 1); }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all text-[#71767b] hover:text-[#eff3f4] active:scale-90"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Month Grid */}
            <div className="grid grid-cols-3 gap-3 p-6">
              {MONTHS.map((month, i) => {
                const isSelected = i === currentMonth && viewYear === currentYear;
                const isToday = i === todayMonth && viewYear === todayYear;

                return (
                  <button
                    key={month}
                    onClick={(e) => { e.stopPropagation(); handleSelect(i); }}
                    className={`py-4 rounded-2xl text-[14px] font-black transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#1d9bf0] text-white shadow-[0_8px_32px_rgba(29,155,240,0.4)] scale-105'
                        : isToday
                          ? 'bg-[#1d9bf0]/10 text-[#1d9bf0] border border-[#1d9bf0]/40'
                          : 'text-[#eff3f4] hover:bg-white/5 hover:scale-105'
                    }`}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
