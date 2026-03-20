import React from 'react';
import { LogOut, Loader2 } from 'lucide-react';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, onLogout, isLoggingOut }) => {
  return (
    <div className="border-b border-[#2f3336] bg-black sticky top-0 z-40">
      <div className="max-w-[1200px] mx-auto flex h-[53px] items-center">
        {/* Scrollable Tabs Wrapper */}
        <div className="flex-1 flex h-full overflow-x-auto scrollbar-hide no-scrollbar">
          <div className="flex h-full min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className="w-[115px] md:w-[170px] relative flex items-center justify-center hover:bg-white/5 active:bg-white/10 transition-colors shrink-0"
              >
                <div className="flex flex-col items-center justify-center h-full relative">
                  <span className={`text-[13px] md:text-[15px] transition-all font-black whitespace-nowrap ${activeTab === tab ? 'text-[#e7e9ea]' : 'text-[#71767b]'
                    }`}>
                    {tab}
                  </span>
                  {activeTab === tab && (
                    <div className="absolute bottom-0 h-[4px] w-full max-w-[40px] md:max-w-[56px] bg-[#1d9bf0] rounded-t-full shadow-[0_0_10px_rgba(29,155,240,0.4)]" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Fixed Sign Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="px-5 h-full flex items-center justify-center text-[#71767b] hover:text-red-500 hover:bg-red-500/10 transition-all border-l border-[#2f3336] disabled:opacity-50 shrink-0 bg-black"
            title="Sign Out"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 md:w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 md:w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
