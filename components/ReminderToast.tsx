import React from 'react';
import { Reminder } from '../types';

interface ReminderToastProps {
  reminder: Reminder;
  onClose: () => void;
}

const ReminderToast: React.FC<ReminderToastProps> = ({ reminder, onClose }) => {
  return (
    <div className="w-80 bg-gray-800 border border-yellow-500 rounded-lg shadow-2xl p-4 z-50 animate-fade-in">
      <div className="flex items-start">
        <div className="flex-shrink-0 text-yellow-400">
          <i className="fas fa-bell fa-lg animate-pulse"></i>
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-semibold text-yellow-200">Lembrete de Compromisso</p>
          <p className="mt-1 text-sm text-gray-300">
            Às {reminder.eventTime}: {reminder.eventTitle}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className="inline-flex text-gray-400 hover:text-white"
          >
            <span className="sr-only">Fechar</span>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderToast;