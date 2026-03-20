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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-[#16181c] border border-[#2f3336] rounded-2xl shadow-2xl w-[280px] animate-fade-in overflow-hidden">
            {/* Year Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f3336]">
              <button
                onClick={() => setViewYear(y => y - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all text-[#71767b] hover:text-[#eff3f4] active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[16px] font-black text-[#eff3f4] tracking-tight">{viewYear}</span>
              <button
                onClick={() => setViewYear(y => y + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all text-[#71767b] hover:text-[#eff3f4] active:scale-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Month Grid */}
            <div className="grid grid-cols-3 gap-2 p-4">
              {MONTHS.map((month, i) => {
                const isSelected = i === currentMonth && viewYear === currentYear;
                const isToday = i === todayMonth && viewYear === todayYear;

                return (
                  <button
                    key={month}
                    onClick={() => handleSelect(i)}
                    className={`py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                      isSelected
                        ? 'bg-[#1d9bf0] text-white shadow-[0_0_16px_rgba(29,155,240,0.35)]'
                        : isToday
                          ? 'bg-[#1d9bf0]/10 text-[#1d9bf0] border border-[#1d9bf0]/30'
                          : 'text-[#eff3f4] hover:bg-white/10'
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
