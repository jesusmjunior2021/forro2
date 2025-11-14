import React from 'react';
import { SynthesisState, Document, Video } from '../types';

interface SynthesisHubPanelProps {
  state: SynthesisState;
  onClose: () => void;
  documents: Document[];
  videos: Video[];
  onToggleSource: (id: string) => void;
  onSynthesize: () => void;
  onClear: () => void;
}

const SourceItem: React.FC<{
  id: string;
  title: string;
  type: 'video' | 'document';
  isSelected: boolean;
  onToggle: (id:string) => void;
}> = ({ id, title, type, isSelected, onToggle }) => (
    <div 
        className={`p-2 rounded-lg flex items-center cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/50 ring-2 ring-blue-500' : 'bg-gray-700/70 hover:bg-gray-600/70'}`}
        onClick={() => onToggle(id)}
    >
        <div className="flex-shrink-0 w-8 text-center">
            <i className={`fas ${type === 'document' ? 'fa-file-alt' : 'fa-play-circle'} text-lg ${type === 'document' ? 'text-yellow-300' : 'text-red-400'}`}></i>
        </div>
        <div className="flex-grow min-w-0">
            <p className="text-sm font-semibold text-gray-200 truncate" title={title}>{title}</p>
        </div>
        <div className="flex-shrink-0 w-8 flex justify-end">
            <input
                type="checkbox"
                checked={isSelected}
                readOnly
                className="w-5 h-5 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500"
            />
        </div>
    </div>
);

const ResultDisplay: React.FC<{ state: SynthesisState }> = ({ state }) => {
    const { isLoading, error, result } = state;

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
          <i className="fas fa-spinner fa-spin text-4xl mb-4 text-blue-400"></i>
          <p className="font-semibold">Sintetizando insights...</p>
          <p className="text-sm">Analisando fontes e conectando ideias.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-8">
          <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
          <p className="font-semibold">Ocorreu um Erro</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      );
    }
    
    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                <i className="fas fa-lightbulb text-5xl mb-4"></i>
                <p className="text-lg">Pronto para Conectar as Ideias</p>
                <p className="mt-1">Selecione pelo menos duas fontes e clique em "Sintetizar Insights" para começar.</p>
            </div>
        )
    }
    
    const ResultSection: React.FC<{title: string; icon: string; children: React.ReactNode}> = ({ title, icon, children }) => (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-bold text-gray-200 mb-3 flex items-center">
                <i className={`fas ${icon} mr-3 text-blue-400`}></i>{title}
            </h4>
            {children}
        </div>
    );

    return (
        <div className="space-y-6 p-4 animate-fade-in">
            <ResultSection title="Temas Chave" icon="fa-tags">
                <div className="flex flex-wrap gap-2">
                    {result.keyThemes.map((theme, i) => (
                        <span key={i} className="px-2.5 py-1 text-sm font-semibold bg-blue-900/70 text-blue-200 rounded-full">{theme}</span>
                    ))}
                </div>
            </ResultSection>

            <ResultSection title="Conexões Inovadoras" icon="fa-bolt">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{result.novelConnections}</p>
            </ResultSection>

            <ResultSection title="Contradições e Divergências" icon="fa-not-equal">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{result.contradictions}</p>
            </ResultSection>

            <ResultSection title="Próximos Passos Acionáveis" icon="fa-shoe-prints">
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                    {result.actionableNextSteps.map((step, i) => <li key={i}>{step}</li>)}
                </ul>
            </ResultSection>
        </div>
    )
};


const SynthesisHubPanel: React.FC<SynthesisHubPanelProps> = ({ state, onClose, documents, videos, onToggleSource, onSynthesize, onClear }) => {
  const { isOpen, selectedIds, isLoading } = state;

  return (
    <div className={`slate-panel w-full max-w-5xl ${isOpen ? 'open' : ''} flex flex-col`}>
      <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
          <i className="fas fa-lightbulb mr-3 text-blue-400"></i>
          Hub de Síntese
        </h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <i className="fas fa-times"></i>
        </button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Source Selection Section */}
        <div className="w-full md:w-1/3 p-4 flex flex-col border-b md:border-r md:border-b-0 border-gray-700/50 bg-gray-800/20">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <div>
                    <h4 className="font-bold text-gray-300 mb-2">Documentos</h4>
                    {documents.length > 0 ? (
                        <div className="space-y-2">
                        {documents.map(doc => <SourceItem key={doc.id} id={doc.id} title={doc.title} type="document" isSelected={selectedIds.includes(doc.id)} onToggle={onToggleSource} />)}
                        </div>
                    ) : <p className="text-xs text-gray-500">Nenhum documento na biblioteca.</p>}
                </div>
                 <div>
                    <h4 className="font-bold text-gray-300 mb-2">Vídeos</h4>
                    {videos.length > 0 ? (
                         <div className="space-y-2">
                            {videos.map(vid => <SourceItem key={vid.id} id={vid.id} title={vid.title} type="video" isSelected={selectedIds.includes(vid.id)} onToggle={onToggleSource} />)}
                         </div>
                    ) : <p className="text-xs text-gray-500">Nenhum vídeo na videoteca.</p>}
                </div>
            </div>
            <div className="shrink-0 pt-4 mt-4 border-t border-gray-700/50 space-y-2">
                <button
                    onClick={onSynthesize}
                    disabled={selectedIds.length < 2 || isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Analisando...</> : <><i className="fas fa-cogs mr-2"></i>Sintetizar Insights ({selectedIds.length})</>}
                </button>
                <button
                    onClick={onClear}
                    disabled={selectedIds.length === 0 || isLoading}
                    className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    Limpar Seleção
                </button>
            </div>
        </div>

        {/* Output Section */}
        <div className="w-full md:w-2/3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <ResultDisplay state={state} />
        </div>
      </div>
    </div>
  );
};

export default SynthesisHubPanel;