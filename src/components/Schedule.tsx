import React from 'react';
import { Task, Routine } from '../types';
import { Check, Plus, Clock, LayoutGrid, Trash2 } from 'lucide-react';

interface ScheduleProps {
  tasks: Task[];
  routines: Routine[];
  onToggleTask: (id: number) => void;
  onToggleRoutine: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onDeleteRoutine: (id: number) => void;
  onAddTask: () => void;
  onAddRoutine: () => void;
}

export const Schedule: React.FC<ScheduleProps> = ({ tasks, routines, onToggleTask, onToggleRoutine, onDeleteTask, onDeleteRoutine, onAddTask, onAddRoutine }) => {
  const tagColors: Record<string, string> = { 
    work: 'bg-[#1d9bf0]/10 text-x-blue border-x-blue/20', 
    personal: 'bg-[#00ba7c]/10 text-[#00ba7c] border-[#00ba7c]/20', 
    health: 'bg-[#f91880]/10 text-[#f91880] border-[#f91880]/20', 
    routine: 'bg-[#7856ff]/10 text-[#7856ff] border-[#7856ff]/20' 
  };

  return (
    <div className="max-w-[600px] mx-auto border-x border-[#2f3336] min-h-screen bg-black">
      
      {/* Search/Filter style Header for Tasks */}
      <div className="p-4 border-b border-[#2f3336] flex items-center justify-between sticky top-[53px] bg-black/80 backdrop-blur-md z-20">
        <h2 className="text-[19px] font-black text-[#eff3f4] flex items-center gap-2">
          <Clock className="w-5 h-5 text-x-blue" />
          Today's Tasks
        </h2>
        <button onClick={onAddTask} className="bg-x-blue text-white font-bold px-4 py-1.5 rounded-full text-[14px] hover:opacity-90 transition-opacity">
          New Task
        </button>
      </div>

      <div className="divide-y divide-[#2f3336]">
        {tasks.sort((a, b) => a.time.localeCompare(b.time)).map(task => (
          <div key={task.id} className="p-4 flex gap-4 hover:bg-white/[0.02] transition-colors group">
            <span className="text-[14px] font-bold text-[#71767b] w-12 shrink-0 pt-1.5">{task.time}</span>
            
            <button 
              onClick={() => onToggleTask(task.id)}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all mt-0.5
                ${task.done ? 'bg-[#00ba7c] border-[#00ba7c] text-white' : 'border-[#536471] hover:border-x-blue bg-transparent'}`}
            >
              {task.done && <Check className="w-4 h-4" strokeWidth={3} />}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-[17px] font-bold tracking-tight transition-colors ${task.done ? 'line-through text-[#71767b]' : 'text-[#eff3f4]'}`}>
                  {task.name}
                </p>
                <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded border ${tagColors[task.tag] || tagColors.routine}`}>
                  {task.tag}
                </span>
              </div>
            </div>

            <button 
              onClick={() => { if(confirm('Delete this task?')) onDeleteTask(task.id); }}
              className="text-[#71767b] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Routine Section */}
       <div className="p-4 border-y border-[#2f3336] flex items-center justify-between sticky top-[106px] bg-black/80 backdrop-blur-md z-20 mt-4">
        <h2 className="text-[19px] font-black text-[#eff3f4] flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-[#7856ff]" />
          Daily Routines
        </h2>
        <button onClick={onAddRoutine} className="border border-[#536471] text-[#eff3f4] font-bold px-4 py-1.5 rounded-full text-[14px] hover:bg-white/10 transition-colors">
          Add Routine
        </button>
      </div>

      <div className="divide-y divide-[#2f3336]">
        {routines.map(routine => (
          <div key={routine.id} className="p-4 flex gap-4 hover:bg-white/[0.02] transition-colors group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[22px] bg-[#2f3336]/40 border border-[#2f3336] shrink-0">
              {routine.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-[17px] font-bold ${routine.done ? 'text-[#71767b] line-through' : 'text-[#eff3f4]'}`}>{routine.name}</h3>
                  <p className="text-[13px] text-[#71767b] font-medium">{routine.time}</p>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => { if(confirm('Delete this routine?')) onDeleteRoutine(routine.id); }}
                    className="text-[#71767b] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onToggleRoutine(routine.id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all
                      ${routine.done ? 'bg-[#00ba7c] border-[#00ba7c] text-white' : 'border-[#536471] hover:border-x-blue bg-transparent'}`}
                  >
                    {routine.done && <Check className="w-4 h-4" strokeWidth={3} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
