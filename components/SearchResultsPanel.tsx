import React, { useState } from 'react';
import { ResourceLink } from '../types';
import SearchResultDetailModal from './SearchResultDetailModal';


const tagColors = [
    'bg-blue-800/70 text-blue-200',
    'bg-green-800/70 text-green-200',
    'bg-purple-800/70 text-purple-200',
    'bg-red-800/70 text-red-200',
    'bg-yellow-800/70 text-yellow-200',
];

const SearchResultItem: React.FC<{ link: ResourceLink; onSelect: () => void; }> = ({ link, onSelect }) => {
    if (link.isLoading) {
        return (
            <div className="p-3 rounded-lg bg-gray-700 animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-full mb-3"></div>
                <div className="h-3 bg-gray-600 rounded w-1/2"></div>
            </div>
        );
    }

    return (
        <button
            onClick={onSelect}
            className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600/80 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
            <h4 className="font-bold text-sm text-blue-300 truncate" title={link.title || 'Sem Título'}>{link.title || 'Link Externo'}</h4>
            <p className="text-gray-500 text-xs mb-2 truncate" title={link.uri}>{link.uri}</p>
            {link.summary && <p className="text-xs text-gray-300 mb-2 line-clamp-2">{link.summary}</p>}
            {link.tags && link.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {link.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className={`px-2 py-0.5 text-[10px] rounded-full ${tagColors[i % tagColors.length]}`}>{tag}</span>
                    ))}
                </div>
            )}
        </button>
    );
};

interface SearchResultsPanelProps {
  links: ResourceLink[];
  isOpen: boolean;
  onClose: () => void;
}

const SearchResultsPanel: React.FC<SearchResultsPanelProps> = ({ links, isOpen, onClose }) => {
  const [selectedLink, setSelectedLink] = useState<ResourceLink | null>(null);

  return (
    <>
      <div className={`slate-panel w-80 ${isOpen ? 'open' : ''} flex flex-col`}>
        <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
          <h3 className="text-lg font-semibold text-gray-200 flex items-center">
            <i className="fas fa-link mr-3"></i>
            Fontes da Web
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </header>
        <div className="p-4 flex flex-col flex-1 overflow-hidden">
          {links.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <i className="fas fa-globe text-4xl text-gray-600 mb-4"></i>
                <p className="text-sm text-gray-500">Fontes da web aparecerão aqui quando a IA buscar informações online.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {links.map((link, index) => (
                    <SearchResultItem key={index} link={link} onSelect={() => setSelectedLink(link)} />
                ))}
            </div>
          )}
        </div>
      </div>
       
        {selectedLink && (
            <SearchResultDetailModal 
                link={selectedLink}
                onClose={() => setSelectedLink(null)}
            />
        )}
    </>
  );
};

export default SearchResultsPanel;
