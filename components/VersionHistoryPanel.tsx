import React from 'react';
import { DocumentVersion } from '../types';

interface VersionHistoryPanelProps {
  isOpen: boolean;
  history: DocumentVersion[];
  onRevert: (versionId: string) => void;
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ isOpen, history, onRevert }) => {
  if (!isOpen) {
    return null;
  }

  const sortedHistory = [...history].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

  return (
    <div className="w-64 flex-shrink-0 border-r border-gray-700 flex flex-col bg-gray-800 animate-fade-in">
      <div className="p-3 border-b border-gray-700/70">
        <h3 className="font-semibold text-gray-200 text-sm flex items-center">
          <i className="fas fa-history mr-2 text-blue-400"></i>
          Histórico de Versões
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {sortedHistory.length === 0 ? (
          <div className="text-center text-gray-500 text-xs p-4">
            <p>Nenhuma versão salva ainda.</p>
            <p className="mt-1">Clique em 'Salvar' para criar a primeira versão.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sortedHistory.map((version, index) => (
              <li key={version.id} className="group p-2 rounded-md hover:bg-gray-700/50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-gray-300">
                      {index === 0 ? 'Versão Atual' : `Salvo em`}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(version.savedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <button 
                    onClick={() => onRevert(version.id)}
                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    title="Reverter para esta versão"
                    disabled={index === 0} // Disable revert for the current version
                  >
                    Reverter
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VersionHistoryPanel;