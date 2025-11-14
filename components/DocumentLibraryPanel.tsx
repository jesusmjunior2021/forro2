import React, { useState } from 'react';
import { Document } from '../types';

interface DocumentLibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  onLoadDocument: (id: string) => void;
  onCreateNewDocument: () => void;
  onDeleteDocument: (id: string) => void;
  onUpdateDocumentTags: (id: string, tags: string[]) => void;
}

// New component for managing tags on an item
const TagManager: React.FC<{
  tags: string[];
  onUpdateTags: (tags: string[]) => void;
}> = ({ tags, onUpdateTags }) => {
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onUpdateTags([...tags, trimmedTag]);
    }
    setNewTag('');
    setIsAdding(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  };

  const visibleTags = isExpanded ? tags : tags.slice(0, 1);
  const hasMoreTags = tags.length > 1;

  return (
    <div className="mt-2 flex items-center flex-wrap gap-2" onClick={e => e.stopPropagation()}>
      {visibleTags.map(tag => (
        <span key={tag} className="flex items-center bg-blue-900/70 text-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full">
          {tag}
          <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 text-blue-300 hover:text-white focus:outline-none">
            <i className="fas fa-times-circle text-[10px]"></i>
          </button>
        </span>
      ))}
      
      {hasMoreTags && !isExpanded && (
        <button onClick={handleToggle} className="bg-gray-600 hover:bg-gray-500 text-gray-300 text-xs font-semibold px-2 py-1 rounded-full" title="Mostrar mais tags">
            <i className="fas fa-angle-double-right"></i>
        </button>
      )}

      {isExpanded && (
         <button onClick={handleToggle} className="bg-gray-600 hover:bg-gray-500 text-gray-300 text-xs font-semibold px-2 py-1 rounded-full" title="Recolher tags">
            <i className="fas fa-angle-double-left"></i>
        </button>
      )}

      {isAdding ? (
        <form onSubmit={handleAddTag}>
            <input
            type="text"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setIsAdding(false); setNewTag(''); } }}
            onBlur={() => { setIsAdding(false); setNewTag(''); }}
            autoFocus
            className="bg-gray-800 border border-blue-500 rounded-full px-2 py-0.5 text-xs w-24 focus:outline-none"
            />
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="bg-gray-600 hover:bg-gray-500 text-gray-300 text-xs font-semibold px-2.5 py-1 rounded-full"
        >
          <i className="fas fa-plus mr-1 text-[10px]"></i> Tag
        </button>
      )}
    </div>
  );
};


const DocumentLibraryPanel: React.FC<DocumentLibraryPanelProps> = ({
  isOpen,
  onClose,
  documents,
  onLoadDocument,
  onCreateNewDocument,
  onDeleteDocument,
  onUpdateDocumentTags,
}) => {
  const [filterTerm, setFilterTerm] = useState('');

  const sortedDocuments = [...documents].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  
  const filteredDocuments = sortedDocuments.filter(doc => {
    const term = filterTerm.toLowerCase();
    if (!term) return true;
    const titleMatch = doc.title.toLowerCase().includes(term);
    const tagMatch = doc.tags?.some(tag => tag.toLowerCase().includes(term));
    return titleMatch || tagMatch;
  });

  const handleDelete = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (window.confirm("Tem certeza de que deseja apagar este documento?")) {
      onDeleteDocument(docId);
    }
  };

  return (
    <div className={`slate-panel w-96 ${isOpen ? 'open' : ''} flex flex-col`}>
      <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
          <i className="fas fa-book-reader mr-3"></i>
          Biblioteca de Documentos
        </h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <i className="fas fa-times"></i>
        </button>
      </header>

      <div className="p-4 flex-1 flex flex-col overflow-y-auto">
        <button
          onClick={onCreateNewDocument}
          className="w-full text-sm bg-blue-800/80 hover:bg-blue-700 text-white py-2.5 px-3 rounded-md transition-colors flex items-center justify-center font-semibold mb-4"
        >
          <i className="fas fa-plus mr-2"></i> Criar Novo Documento
        </button>

        <div className="relative mb-4">
            <input 
                type="text"
                placeholder="Filtrar por título ou tag..."
                value={filterTerm}
                onChange={e => setFilterTerm(e.target.value)}
                className="w-full bg-gray-900/80 border border-gray-600 rounded-md text-sm pl-9 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
        </div>
        
        {filteredDocuments.length === 0 ? (
          <div className="text-center text-gray-500 pt-8">
            <i className="fas fa-folder-open text-3xl mb-3"></i>
            <p className="text-sm">{documents.length === 0 ? "Sua biblioteca está vazia." : "Nenhum documento corresponde ao filtro."}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocuments.map(doc => (
              <div
                key={doc.id}
                className="group bg-gray-700/70 hover:bg-gray-600/70 transition-all duration-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-start">
                    <div 
                        onClick={() => onLoadDocument(doc.id)} 
                        className="flex-grow cursor-pointer pr-4"
                    >
                        <p className="font-semibold text-gray-200 truncate group-hover:text-blue-300 transition-colors">{doc.title}</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Modificado: {new Date(doc.lastModified).toLocaleString('pt-BR')}
                        </p>
                    </div>
                    <button
                        onClick={(e) => handleDelete(e, doc.id)}
                        className="w-8 h-8 rounded-full text-gray-400 hover:bg-red-800/50 hover:text-red-300 flex-shrink-0 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                        title="Apagar Documento"
                    >
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </div>
                <TagManager
                    tags={doc.tags || []}
                    onUpdateTags={(newTags) => onUpdateDocumentTags(doc.id, newTags)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentLibraryPanel;