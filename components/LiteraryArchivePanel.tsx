import React, { useState, useMemo, FormEvent, useEffect } from 'react';
import { ArchivedLink } from '../types';

interface AddEditFormProps {
  linkToEdit?: ArchivedLink | null;
  prefillUrl?: string | null;
  onSave: (linkData: Omit<ArchivedLink, 'id'>, id?: string) => void;
  onClose: () => void;
  onGenerateDescription: (url: string) => Promise<string>;
}

const AddEditForm: React.FC<AddEditFormProps> = ({ linkToEdit, prefillUrl, onSave, onClose, onGenerateDescription }) => {
  const [url, setUrl] = useState(linkToEdit?.url || prefillUrl || '');
  const [title, setTitle] = useState(linkToEdit?.title || '');
  const [description, setDescription] = useState(linkToEdit?.description || '');
  const [tags, setTags] = useState(linkToEdit?.tags.join(', ') || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(linkToEdit?.thumbnailUrl || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!url) return;
    setIsGenerating(true);
    try {
      const generatedDesc = await onGenerateDescription(url);
      setDescription(generatedDesc);
    } catch (error) {
      console.error("Failed to generate description", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;
    
    onSave({
      url,
      title,
      description,
      thumbnailUrl,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: linkToEdit?.createdAt || new Date().toISOString(),
    }, linkToEdit?.id);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl m-4 border border-gray-700 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-blue-300">{linkToEdit ? 'Editar Link' : 'Adicionar ao Arquivo'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><i className="fas fa-times text-2xl"></i></button>
        </header>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">URL</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
            <div className="relative">
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2 pr-28" />
              <button type="button" onClick={handleGenerate} disabled={isGenerating || !url} className="absolute top-2 right-2 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-gray-500">
                {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-magic mr-1"></i> Gerar</>}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Link da Thumbnail (Opcional)</label>
            <input type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Tags (separadas por vírgula)</label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2" />
          </div>
        </form>
        <footer className="p-4 bg-gray-900/50 border-t border-gray-700 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-600 hover:bg-gray-500">Cancelar</button>
            <button type="submit" onClick={handleSubmit} className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 font-semibold">Salvar</button>
        </footer>
      </div>
    </div>
  );
};

interface LiteraryArchivePanelProps {
    isOpen: boolean;
    onClose: () => void;
    library: ArchivedLink[];
    onAddLink: (link: Omit<ArchivedLink, 'id'>) => void;
    onUpdateLink: (id: string, updates: Partial<ArchivedLink>) => void;
    onDeleteLink: (id: string) => void;
    onGenerateDescription: (url: string) => Promise<string>;
    prefillUrl?: { url: string; title: string; summary: string; } | null;
    onClearPrefill: () => void;
}

const LiteraryArchivePanel: React.FC<LiteraryArchivePanelProps> = ({ isOpen, onClose, library, onAddLink, onUpdateLink, onDeleteLink, onGenerateDescription, prefillUrl, onClearPrefill }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [linkToEdit, setLinkToEdit] = useState<ArchivedLink | null>(null);
    const [prefilledData, setPrefilledData] = useState(prefillUrl);

    useEffect(() => {
        if(prefillUrl) {
            setPrefilledData(prefillUrl);
            setLinkToEdit(null);
            setIsFormOpen(true);
        }
    }, [prefillUrl]);

    const handleOpenForm = (link?: ArchivedLink) => {
        setLinkToEdit(link || null);
        setIsFormOpen(true);
    };
    
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setLinkToEdit(null);
        if(prefillUrl) {
            onClearPrefill();
            setPrefilledData(null);
        }
    };

    const handleSave = (linkData: Omit<ArchivedLink, 'id'>, id?: string) => {
        if (id) {
            onUpdateLink(id, linkData);
        } else {
            onAddLink(linkData);
        }
        handleCloseForm();
    };

    const filteredLibrary = useMemo(() => {
        if (!searchTerm.trim()) return library;
        const lowerTerm = searchTerm.toLowerCase();
        return library.filter(link =>
            link.title.toLowerCase().includes(lowerTerm) ||
            link.description.toLowerCase().includes(lowerTerm) ||
            link.tags.some(tag => tag.toLowerCase().includes(lowerTerm))
        );
    }, [library, searchTerm]);

    return (
        <>
        <div className={`slate-panel w-full max-w-3xl ${isOpen ? 'open' : ''} flex flex-col`}>
            <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                    <i className="fas fa-book-atlas mr-3"></i> Arquivo Literário
                </h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors"><i className="fas fa-times"></i></button>
            </header>

            <div className="p-4 border-b border-gray-700/50 flex space-x-2">
                <div className="relative flex-grow">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                    <input type="text" placeholder="Buscar no arquivo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-900/80 border border-gray-600 rounded-md text-sm pl-9 pr-3 py-2"/>
                </div>
                <button onClick={() => handleOpenForm()} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 font-semibold rounded-md flex items-center shrink-0">
                    <i className="fas fa-plus mr-2"></i> Adicionar Link
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredLibrary.length > 0 ? filteredLibrary.map(link => (
                    <div key={link.id} className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/50 flex items-start space-x-4">
                        {link.thumbnailUrl && <img src={link.thumbnailUrl} alt={link.title} className="w-24 h-24 object-cover rounded-md flex-shrink-0 bg-gray-700"/>}
                        <div className="flex-grow min-w-0">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-bold text-lg text-blue-300 hover:underline">{link.title}</a>
                            <p className="text-sm text-gray-300 leading-relaxed my-1 max-h-20 overflow-y-auto">{link.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {link.tags.map(tag => <span key={tag} className="px-2 py-0.5 text-xs bg-gray-600 text-gray-300 rounded-full">{tag}</span>)}
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <button onClick={() => handleOpenForm(link)} className="w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-500 text-white"><i className="fas fa-pencil-alt"></i></button>
                            <button onClick={() => onDeleteLink(link.id)} className="w-8 h-8 rounded-full bg-red-800/70 hover:bg-red-700 text-white"><i className="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-10 px-6">
                        <i className="fas fa-archive text-4xl text-gray-500 mb-4"></i>
                        <h3 className="text-lg font-semibold text-gray-400">Seu arquivo está vazio</h3>
                        <p className="text-gray-500 mt-1 text-sm">Adicione links manualmente ou a partir de resultados de pesquisa.</p>
                    </div>
                )}
            </div>
        </div>
        {isFormOpen && <AddEditForm 
            linkToEdit={linkToEdit} 
            prefillUrl={prefilledData ? JSON.stringify(prefilledData) : undefined}
            onSave={handleSave} 
            onClose={handleCloseForm} 
            onGenerateDescription={onGenerateDescription} 
        />}
        </>
    );
};

export default LiteraryArchivePanel;