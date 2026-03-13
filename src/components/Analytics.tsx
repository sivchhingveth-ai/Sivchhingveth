import React, { useState } from 'react';
import { Habit, Task } from '../types';
import { TrendingUp, BarChart3, PieChart, Activity, Calendar, Clock, CheckCircle2, ListTodo } from 'lucide-react';

interface AnalyticsProps {
  habits: Habit[];
  tasks: Task[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ habits, tasks }) => {
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Real calculations
  const totalCompletedHabits = habits.filter(h => h.doneToday).length;
  const habitCompletionPct = habits.length > 0 ? Math.round((totalCompletedHabits / habits.length) * 100) : 0;
  
  const completedTasks = tasks.filter(t => t.done).length;
  const taskCompletionPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Mock data for charts (would be indexed by date/time in a real app)
  const weeklyData = [
    { day: 'Mon', count: 4, label: '4 tasks' },
    { day: 'Tue', count: 7, label: '7 tasks' },
    { day: 'Wed', count: 5, label: '5 tasks' },
    { day: 'Thu', count: 8, label: '8 tasks' },
    { day: 'Fri', count: 6, label: '6 tasks' },
    { day: 'Sat', count: 9, label: '9 tasks' },
    { day: 'Sun', count: 3, label: '3 tasks' },
  ];

  const dailyHourlyData = [
    { hour: '6am', val: 10, label: 'Morning Prep' },
    { hour: '9am', val: 45, label: 'Deep Work' },
    { hour: '12pm', val: 30, label: 'Break' },
    { hour: '3pm', val: 60, label: 'Meetings' },
    { hour: '6pm', val: 85, label: 'Exercise' },
    { hour: '9pm', val: 40, label: 'Reflection' },
    { hour: '12am', val: 15, label: 'Sleep' },
  ];

  const monthlyTrend = [
    { label: 'W1', val: 65, hint: 'High Output' },
    { label: 'W2', val: 40, hint: 'Moderate' },
    { label: 'W3', val: 80, hint: 'Peak Perf' },
    { label: 'W4', val: 55, hint: 'Consistent' },
  ];

  const maxVal = view === 'daily' ? 100 : view === 'weekly' ? 10 : 100;
  const currentData = view === 'daily' ? dailyHourlyData : view === 'weekly' ? weeklyData : monthlyTrend;

  return (
    <div className="max-w-[600px] mx-auto border-x border-[#2f3336] min-h-screen bg-black">
      
      {/* Header & Segments */}
      <div className="sticky top-[53px] bg-black/80 backdrop-blur-md z-20 border-b border-[#2f3336]">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-[19px] font-black text-[#eff3f4]">Performance Analysis</h2>
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

      <div className="p-6 space-y-6">
        
        {/* Productivity Summary Card */}
        <div className="bg-white/[0.02] border border-[#2f3336] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-x-blue" />
              <span className="text-[16px] font-black text-[#eff3f4]">Productivity Heatmap</span>
            </div>
            <span className="text-[12px] font-bold text-[#71767b] uppercase tracking-widest">{view} focus</span>
          </div>

          <div className="h-[180px] flex items-end justify-between gap-2.5">
            {currentData.map((d: any, i) => {
              const val = 'val' in d ? d.val : d.count;
              const height = (val / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group gap-3 h-full justify-end">
                   <div className="relative w-full flex flex-col items-center justify-end h-full">
                      <div className="absolute -top-10 px-2.5 py-1.5 bg-white text-black text-[10px] font-black rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 mb-2 pointer-events-none whitespace-nowrap z-30">
                        {d.label || d.hint || `${val}%`}
                      </div>
                      <div 
                        className={`w-full max-w-[40px] rounded-t-lg transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                          view === 'daily' ? 'bg-x-blue' : view === 'weekly' ? 'bg-[#00ba7c]' : 'bg-[#7856ff]'
                        } group-hover:brightness-125 group-hover:shadow-[0_0_15px_rgba(29,155,240,0.3)]`} 
                        style={{ height: `${Math.max(8, height)}%` }}
                      ></div>
                   </div>
                   <span className="text-[10px] font-black text-[#71767b] uppercase tracking-tighter">
                     {'day' in d ? d.day : 'hour' in d ? d.hour : d.label}
                   </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deep Analysis Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-[#2f3336] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-[#00ba7c]" />
              <span className="text-[12px] font-black text-[#71767b] uppercase">Habit Success</span>
            </div>
            <p className="text-4xl font-black text-[#eff3f4]">{habitCompletionPct}<span className="text-xl text-[#71767b]">%</span></p>
            <div className="flex items-center gap-1.5 mt-2">
               <div className="w-full h-1 bg-[#2f3336] rounded-full overflow-hidden">
                 <div className="h-full bg-[#00ba7c]" style={{ width: `${habitCompletionPct}%` }} />
               </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-[#2f3336] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <ListTodo className="w-4 h-4 text-x-blue" />
              <span className="text-[12px] font-black text-[#71767b] uppercase">Task Focus</span>
            </div>
            <p className="text-4xl font-black text-[#eff3f4]">{taskCompletionPct}<span className="text-xl text-[#71767b]">%</span></p>
            <div className="flex items-center gap-1.5 mt-2">
               <div className="w-full h-1 bg-[#2f3336] rounded-full overflow-hidden">
                 <div className="h-full bg-x-blue" style={{ width: `${taskCompletionPct}%` }} />
               </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Summary */}
        <div className="bg-white/[0.02] border border-[#2f3336] rounded-2xl overflow-hidden">
           <div className="p-5 border-b border-[#2f3336] flex items-center justify-between bg-white/[0.01]">
             <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-x-blue" />
                <span className="text-[15px] font-black text-[#eff3f4]">Workload Summary</span>
             </div>
             <Calendar className="w-4 h-4 text-[#71767b]" />
           </div>
           
           <div className="p-5 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-x-blue/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-x-blue" />
                  </div>
                  <div>
                    <p className="text-[14px] font-black text-[#eff3f4]">Estimated Effort</p>
                    <p className="text-[12px] text-[#71767b]">Based on task distribution</p>
                  </div>
                </div>
                <p className="text-xl font-black text-[#eff3f4]">6.5<span className="text-[13px] text-[#71767b]">h/day</span></p>
              </div>

              <div className="space-y-4">
                 <p className="text-[12px] font-black text-[#71767b] uppercase tracking-widest">Efficiency by Category</p>
                 {[
                   { label: 'Deep Work', value: 85, color: '#1d9bf0', icon: '⚡' },
                   { label: 'Health & Wellness', value: 70, color: '#f91880', icon: '🥗' },
                   { label: 'Personal Growth', value: 45, color: '#00ba7c', icon: '🌱' },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-4">
                     <span className="text-lg w-6">{item.icon}</span>
                     <div className="flex-1 space-y-1.5">
                       <div className="flex justify-between items-center text-[13px] font-black">
                         <span className="text-[#eff3f4]">{item.label}</span>
                         <span className="text-x-blue">{item.value}%</span>
                       </div>
                       <div className="w-full h-1.5 bg-[#2f3336] rounded-full overflow-hidden">
                         <div className="h-full transition-all duration-1000" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="p-4 bg-white/[0.03] text-center border-t border-[#2f3336]">
             <p className="text-[12px] font-bold text-[#71767b]">
               Analysis updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · <span className="text-x-blue cursor-pointer hover:underline">Download Report</span>
             </p>
           </div>
        </div>

      </div>

    </div>
  );
};
