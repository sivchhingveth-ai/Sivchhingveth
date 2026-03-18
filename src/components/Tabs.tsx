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
    <div className="border-b border-[#2f3336] bg-black">
      <div className="max-w-[1200px] mx-auto flex h-[53px] items-center">
        <div className="flex flex-1 h-full">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="flex-1 min-w-0 px-2 md:px-4 relative flex items-center justify-center hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <div className="flex flex-col items-center justify-center h-full relative">
                <span className={`text-[13px] md:text-[15px] transition-all font-black whitespace-nowrap ${
                  activeTab === tab ? 'text-[#e7e9ea]' : 'text-[#71767b]'
                }`}>
                  {tab}
                </span>
                {activeTab === tab && (
                  <div className="absolute bottom-0 h-[4px] min-w-[40px] md:min-w-[56px] bg-[#1d9bf0] rounded-full" />
                )}
              </div>
            </button>
          ))}
        </div>
        {onLogout && (
          <button 
            onClick={onLogout}
            disabled={isLoggingOut}
            className="px-4 h-full flex items-center justify-center text-[#71767b] hover:text-red-500 hover:bg-red-500/10 transition-all border-l border-[#2f3336] disabled:opacity-50"
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
