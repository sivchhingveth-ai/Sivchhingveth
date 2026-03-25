import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateStr } from '../utils/dateUtils';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const [y, m, d] = value ? value.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];
  const [viewDate, setViewDate] = useState(new Date(y, (m || 1) - 1, d || 1));

  // Sync viewDate when value changes
  useEffect(() => {
    if (value) {
      const [vy, vm, vd] = value.split('-').map(Number);
      setViewDate(new Date(vy, vm - 1, vd));
    }
  }, [value]);



  const handleSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = formatDateStr(newDate);
    onChange(dateStr);
    setIsOpen(false);
  };

  const shiftMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Start week on Monday

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: adjustedFirstDay }, () => null);

  const formatDisplay = () => {
    if (!value) return "Select Date";
    const [vy, vm, vd] = value.split('-').map(Number);
    const date = new Date(vy, vm - 1, vd);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left ${className}`}
      >
        <span className={value ? 'text-[#eff3f4]' : 'text-[#71767b]'}>{formatDisplay()}</span>
        <CalendarIcon className="w-4 h-4 text-[#71767b]" />
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-[#16181c] border border-[#2f3336] p-4 rounded-2xl shadow-2xl w-[280px] animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); shiftMonth(-1); }}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[#71767b] hover:text-[#eff3f4] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[14px] font-bold text-[#eff3f4]">
                {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); shiftMonth(1); }}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[#71767b] hover:text-[#eff3f4] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 mb-2">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                <div key={d} className="text-center text-[10px] font-black text-[#71767b] uppercase tracking-widest">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {blanksArray.map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {daysArray.map(day => {
                const currentDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = currentDateStr === value;
                const isToday = currentDateStr === formatDateStr(new Date());

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={(e) => { e.preventDefault(); handleSelect(day); }}
                    className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-[13px] font-medium transition-all ${
                      isSelected
                        ? 'bg-[#1d9bf0] text-white font-bold shadow-[0_0_12px_rgba(29,155,240,0.4)]'
                        : isToday
                          ? 'bg-white/10 text-[#1d9bf0] font-bold'
                          : 'text-[#eff3f4] hover:bg-white/10'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
