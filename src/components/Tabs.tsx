import React from 'react';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="border-b border-[#2f3336] bg-black">
      <div className="max-w-[1200px] mx-auto flex h-[53px]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className="flex-1 min-w-0 px-4 relative flex items-center justify-center hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <div className="flex flex-col items-center justify-center h-full relative">
              <span className={`text-[15px] transition-all font-black whitespace-nowrap ${
                activeTab === tab ? 'text-[#e7e9ea]' : 'text-[#71767b]'
              }`}>
                {tab}
              </span>
              {activeTab === tab && (
                <div className="absolute bottom-0 h-[4px] min-w-[56px] bg-[#1d9bf0] rounded-full" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
