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
            className={`w-full py-4 text-[17px] font-black transition-all rounded-2xl ${
              isDestructive 
                ? 'bg-[#f4212e] text-white hover:bg-[#d71e28]' 
                : 'x-button-primary'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 text-[17px] font-bold x-button-glass justify-center"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
