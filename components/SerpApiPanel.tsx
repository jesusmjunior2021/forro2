import React, { useState } from 'react';
import { SerpApiState, SerpCardResult, ResourceLink } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface SerpApiPanelProps {
  isOpen: boolean;
  onClose: () => void;
  state: SerpApiState;
  serpApiStatus: 'idle' | 'checking' | 'valid' | 'invalid';
  onPerformSearch: (query: string) => void;
  onOpenSettings: () => void;
}


const ResultCard: React.FC<{ result: SerpCardResult }> = ({ result }) => (
    <div className="serp-result-card animate-fade-in">
        <h3>{result.title}</h3>
        <p className="summary">{result.summary}</p>
        <div className="space-y-2">
            <h4 className="font-semibold text-gray-300 border-b border-gray-600 pb-1 mb-2">Fontes Principais</h4>
            {result.resources.map((res, i) => (
                <a key={i} href={res.uri} target="_blank" rel="noopener noreferrer" className="resource-list-item">
                    <i className="fas fa-link text-gray-500 mr-3"></i>
                    <span className="text-sm text-blue-400 hover:underline truncate">{res.title}</span>
                </a>
            ))}
        </div>
    </div>
);


const SerpApiPanel: React.FC<SerpApiPanelProps> = ({ isOpen, onClose, state, serpApiStatus, onPerformSearch, onOpenSettings }) => {
  const [query, setQuery] = useState('');
  const { isLoading, error, cardResult } = state;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onPerformSearch(query);
    }
  };
  
  const renderContent = () => {
    if (serpApiStatus !== 'valid') {
        return (
            <div className="flex flex-col items-center justify-center text-center h-full text-gray-400 p-4">
                <i className="fas fa-search-dollar text-5xl text-yellow-500 mb-4"></i>
                <h2 className="text-xl font-bold text-white">Conecte a SERP API</h2>
                <p className="mt-2 max-w-sm">Para usar a Pesquisa Profunda, por favor, adicione uma chave de API válida no painel de configurações.</p>
                <button onClick={onOpenSettings} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold">
                    Ir para Configurações
                </button>
            </div>
        );
    }
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
                <i className="fas fa-spinner fa-spin text-4xl mb-4 text-blue-400"></i>
                <p className="font-semibold">Realizando pesquisa profunda...</p>
                <p className="text-sm">Buscando na web e sintetizando com a IA.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-red-400 p-8">
                <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p className="font-semibold">Ocorreu um Erro</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        );
    }

    if (cardResult) {
        return (
            <div className="p-4 md:p-6">
                <ResultCard result={cardResult} />
            </div>
        );
    }

     return (
        <div className="flex flex-col items-center justify-center text-center h-full text-gray-500 p-8">
            <i className="fas fa-search-dollar text-5xl mb-4"></i>
            <p className="text-lg">Pronto para a Pesquisa Profunda</p>
            <p className="mt-1">Os resultados da sua busca aparecerão aqui em formato de revista.</p>
        </div>
    )
  };

  return (
    <div className={`slate-panel w-full max-w-5xl ${isOpen ? 'open' : ''} flex flex-col`}>
      <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
          <i className="fas fa-search-dollar mr-3 text-blue-400"></i>
          SERP API - Pesquisa Profunda
        </h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <i className="fas fa-times"></i>
        </button>
      </header>

       {serpApiStatus === 'valid' && (
         <div className="p-4 shrink-0 border-b border-gray-700/50 bg-gray-800/20">
            <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Faça uma pesquisa profunda..."
                className="flex-grow bg-gray-900/80 border border-gray-600 rounded-md text-sm px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
            />
            <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-wait"
                disabled={isLoading || !query.trim()}
            >
                {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
            </button>
            </form>
        </div>
       )}

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {renderContent()}
      </div>
    </div>
  );
};

export default SerpApiPanel;