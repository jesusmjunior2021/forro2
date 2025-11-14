import React, { useState } from 'react';
import { GroundedSearchState } from '../types';

interface VertexSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  searchState: GroundedSearchState;
  onPerformSearch: (query: string) => void;
}

const VertexSearchPanel: React.FC<VertexSearchPanelProps> = ({ isOpen, onClose, searchState, onPerformSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !searchState.isLoading) {
      onPerformSearch(query);
    }
  };

  return (
    <div className={`slate-panel w-full max-w-2xl ${isOpen ? 'open' : ''} flex flex-col`}>
      <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
          <i className="fas fa-search-plus mr-3 text-blue-400"></i>
          Pesquisa IA com Fontes (Vertex AI)
        </h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <i className="fas fa-times"></i>
        </button>
      </header>

      <div className="p-4 shrink-0 border-b border-gray-700/50">
        <form onSubmit={handleSearch} className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pergunte qualquer coisa..."
            className="flex-grow bg-gray-900/80 border border-gray-600 rounded-md text-sm px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={searchState.isLoading}
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-wait"
            disabled={searchState.isLoading || !query.trim()}
          >
            {searchState.isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {searchState.isLoading && (
          <div className="flex flex-col items-center justify-center text-center h-full text-gray-400">
            <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
            <p>Buscando e sintetizando informações...</p>
          </div>
        )}
        {searchState.error && (
          <div className="flex flex-col items-center justify-center text-center h-full text-red-400">
            <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
            <p className="font-semibold">Erro na Pesquisa</p>
            <p className="text-sm mt-1">{searchState.error}</p>
          </div>
        )}
        {searchState.result && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h4 className="text-lg font-bold text-gray-200 mb-2">Resposta</h4>
              <div className="prose prose-invert prose-sm max-w-none bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <p className="text-gray-300 whitespace-pre-wrap">{searchState.result.summary}</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-200 mb-2">Fontes</h4>
              <div className="space-y-2">
                {searchState.result.sources.map((source, index) => (
                  <a
                    key={index}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg bg-gray-700/70 hover:bg-gray-600/70 transition-colors"
                  >
                    <p className="font-semibold text-blue-300 text-sm truncate">{source.title}</p>
                    <p className="text-xs text-gray-500 truncate mt-1">{source.uri}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
        {!searchState.isLoading && !searchState.error && !searchState.result && (
          <div className="flex flex-col items-center justify-center text-center h-full text-gray-500">
            <i className="fas fa-search-plus text-5xl mb-4"></i>
            <p className="text-lg">Pronto para pesquisar</p>
            <p className="mt-1">As respostas serão baseadas em informações da web e incluirão fontes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VertexSearchPanel;