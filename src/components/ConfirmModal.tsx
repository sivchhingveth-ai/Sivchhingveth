import React from 'react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6 pt-2">
        <p className="text-[#71767b] text-[17px] leading-normal font-medium px-1">
          {message}
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full py-3 rounded-full text-[15px] font-black transition-all active:scale-[0.98] ${
              isDestructive 
                ? 'bg-[#f4212e] text-white hover:bg-[#d71e28]' 
                : 'bg-[#eff3f4] text-[#0f1419] hover:bg-[#d7dbdc]'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full border border-[#536471] text-[#eff3f4] text-[15px] font-black hover:bg-white/5 transition-all"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
