import React, { useState } from 'react';
import { Habit, Task } from '../types';
import { TrendingUp, BarChart3, PieChart, Activity, Calendar } from 'lucide-react';

interface AnalyticsProps {
  habits: Habit[];
  tasks: Task[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ habits, tasks }) => {
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Mock data for charts
  const weeklyData = [
    { day: 'Mon', count: 4 },
    { day: 'Tue', count: 7 },
    { day: 'Wed', count: 5 },
    { day: 'Thu', count: 8 },
    { day: 'Fri', count: 6 },
    { day: 'Sat', count: 9 },
    { day: 'Sun', count: 3 },
  ];

  const dailyHourlyData = [
    { hour: '6am', val: 10 },
    { hour: '9am', val: 45 },
    { hour: '12pm', val: 30 },
    { hour: '3pm', val: 60 },
    { hour: '6pm', val: 85 },
    { hour: '9pm', val: 40 },
    { hour: '12am', val: 15 },
  ];

  const monthlyTrend = [
    { label: 'W1', val: 65 },
    { label: 'W2', val: 40 },
    { label: 'W3', val: 80 },
    { label: 'W4', val: 55 },
  ];

  const maxVal = view === 'daily' ? 100 : view === 'weekly' ? 10 : 100;
  const currentData = view === 'daily' ? dailyHourlyData : view === 'weekly' ? weeklyData : monthlyTrend;

  return (
    <div className="max-w-[600px] mx-auto border-x border-[#2f3336] min-h-screen bg-black">
      
      {/* Header & Segments */}
      <div className="sticky top-[53px] bg-black/80 backdrop-blur-md z-20 border-b border-[#2f3336]">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-[19px] font-black text-[#eff3f4]">Analytics</h2>
          <div className="flex bg-[#2f3336]/40 p-1 rounded-full border border-[#2f3336]">
            {(['daily', 'weekly', 'monthly'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1 rounded-full text-[13px] font-bold transition-all ${
                  view === v ? 'bg-white text-black shadow-lg' : 'text-[#71767b] hover:text-[#eff3f4]'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Main Chart Card */}
        <div className="bg-white/[0.02] border border-[#2f3336] rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-8">
            <Activity className="w-5 h-5 text-x-blue" />
            <span className="text-[15px] font-bold text-[#eff3f4]">Activity Density</span>
          </div>

          <div className="h-[200px] flex items-end justify-between gap-3">
            {currentData.map((d: any, i) => {
              const height = ((('val' in d ? d.val : d.count) as number) / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group gap-3 h-full justify-end">
                   <div className="relative w-full flex flex-col items-center justify-end h-full">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 px-2 py-1 bg-white text-black text-[11px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity mb-2 pointer-events-none">
                        {'val' in d ? d.val : d.count}
                      </div>
                      <div 
                        className={`w-full max-w-[32px] rounded-t-sm transition-all duration-500 ease-out ${
                          view === 'daily' ? 'bg-[#1d9bf0]' : view === 'weekly' ? 'bg-[#00ba7c]' : 'bg-[#7856ff]'
                        }`} 
                        style={{ height: `${height}%` }}
                      ></div>
                   </div>
                   <span className="text-[11px] font-bold text-[#71767b] uppercase tracking-tighter">
                     {'day' in d ? d.day : 'hour' in d ? d.hour : d.label}
                   </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-[#2f3336] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[#71767b]" />
              <span className="text-[13px] font-bold text-[#71767b] uppercase">Completion Rate</span>
            </div>
            <p className="text-3xl font-black text-[#eff3f4]">82<span className="text-lg">%</span></p>
            <p className="text-[12px] text-[#00ba7c] font-bold mt-1">↑ 12% boost</p>
          </div>

          <div className="bg-white/[0.02] border border-[#2f3336] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#71767b]" />
              <span className="text-[13px] font-bold text-[#71767b] uppercase">Active Streak</span>
            </div>
            <p className="text-3xl font-black text-[#eff3f4]">14<span className="text-lg"> days</span></p>
            <p className="text-[12px] text-[#71767b] font-bold mt-1">Personal Best: 21</p>
          </div>
        </div>

        {/* Habit Distribution */}
        <div className="mt-6 bg-white/[0.02] border border-[#2f3336] rounded-2xl p-6">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-x-blue" />
                <span className="text-[15px] font-bold text-[#eff3f4]">Tag Allocation</span>
             </div>
             <Calendar className="w-4 h-4 text-[#71767b]" />
           </div>
           
           <div className="space-y-4">
              {[
                { label: 'Work', pct: 45, color: '#1d9bf0' },
                { label: 'Health', pct: 30, color: '#f91880' },
                { label: 'Personal', pct: 25, color: '#00ba7c' },
              ].map((tag, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[13px] font-bold">
                    <span className="text-[#eff3f4]">{tag.label}</span>
                    <span className="text-[#71767b]">{tag.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#2f3336] rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-1000" style={{ width: `${tag.pct}%`, backgroundColor: tag.color }} />
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

    </div>
  );
};
