import React from 'react';
import { ProactiveInsightState } from '../types';

interface ProactiveInsightModalProps {
  state: ProactiveInsightState;
  onClose: () => void;
}

const ProactiveInsightModal: React.FC<ProactiveInsightModalProps> = ({ state, onClose }) => {
  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg m-4 border border-blue-500/50 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-blue-300 flex items-center">
                <i className="fas fa-lightbulb text-yellow-400 mr-3"></i>
                Insight Relevante
              </h2>
              <p className="text-lg font-semibold text-gray-200 mt-2">{state.title}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>
          <p className="text-gray-300 mt-4 text-sm leading-relaxed">{state.summary}</p>
        </div>
        <div className="bg-gray-900/50 p-4 mt-auto border-t border-gray-700 flex justify-end rounded-b-2xl">
          <a
            href={state.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center"
          >
            <i className="fas fa-external-link-alt mr-2"></i>
            Ver Fonte
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProactiveInsightModal;