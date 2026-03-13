import React from 'react';
import { X as CloseIcon } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
      <div className="relative bg-black w-full max-w-[600px] rounded-2xl shadow-2xl overflow-hidden animate-slide-up border border-[#2f3336] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 h-[53px] flex items-center gap-8 border-b border-[#2f3336]">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <CloseIcon className="w-[20px] h-[20px] text-[#eff3f4]" />
          </button>
          <h2 className="text-xl font-bold text-[#eff3f4]">{title}</h2>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
