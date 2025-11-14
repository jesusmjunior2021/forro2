import React from 'react';
import { ResourceLink } from '../types';

interface SearchResultDetailModalProps {
  link: ResourceLink;
  onClose: () => void;
}

const SearchResultDetailModal: React.FC<SearchResultDetailModalProps> = ({ link, onClose }) => {
  if (!link) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" 
        onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl m-4 border border-gray-700 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-start">
            <div>
                <h2 className="text-xl font-bold text-blue-300">{link.title || 'Fonte da Web'}</h2>
                <p className="text-sm text-gray-500 mt-1 break-all">{link.uri}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors ml-4">
              <i className="fas fa-times text-2xl"></i>
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
            <h3 className="text-md font-semibold text-gray-300 mb-2">Resumo Detalhado</h3>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {link.detailedSummary || link.summary || 'Nenhum resumo disponível.'}
            </p>
        </div>

        <div className="p-4 bg-gray-900/50 mt-auto border-t border-gray-700 flex justify-end">
            <a 
                href={link.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center"
            >
                <i className="fas fa-external-link-alt mr-2"></i>
                Acessar a Fonte Original
            </a>
        </div>
      </div>
    </div>
  );
};

export default SearchResultDetailModal;
