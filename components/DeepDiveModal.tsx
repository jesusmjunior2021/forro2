import React from 'react';
import { MagazineResource, ResourceLink } from '../types';

interface DeepDiveModalProps {
  resources: MagazineResource[];
  onClose: () => void;
  onPlayVideo: (url: string) => void;
  onSaveToVideoteca: (resource: ResourceLink) => void;
  onSaveToArchive: (resource: ResourceLink) => void;
}

const ResourceCard: React.FC<Omit<DeepDiveModalProps, 'resources' | 'onClose'> & { resource: MagazineResource }> = ({
  resource, onPlayVideo, onSaveToVideoteca, onSaveToArchive
}) => {
  const isYouTube = resource.type === 'video' && resource.url.includes('youtube.com');

  const handlePrimaryAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isYouTube) {
      onPlayVideo(resource.url);
    } else {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Adapter para a função onSaveTo, que espera ResourceLink
  const resourceAsLink: ResourceLink = {
      uri: resource.url,
      title: resource.title,
      summary: resource.summary,
      thumbnailUrl: resource.thumbnailUrl
  };

  const getIcon = () => {
    switch(resource.type) {
      case 'video': return 'fab fa-youtube text-red-400';
      case 'pdf': return 'fas fa-file-pdf text-red-400';
      case 'image': return 'fas fa-image text-green-400';
      case 'article':
      default: return 'fas fa-newspaper text-blue-400';
    }
  }

  return (
    <div className="bg-gray-800/60 rounded-lg border border-gray-700/50 flex flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1">
      {resource.thumbnailUrl && (
        <div onClick={handlePrimaryAction} className="relative aspect-video bg-gray-700 cursor-pointer group">
          <img src={resource.thumbnailUrl} alt={resource.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <i className={`fas ${isYouTube ? 'fa-play' : 'fa-external-link-alt'} text-white text-3xl`}></i>
          </div>
        </div>
      )}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center text-xs text-gray-400 mb-2">
            <i className={`${getIcon()} mr-2`}></i>
            <span className="font-semibold capitalize">{resource.type}</span>
        </div>
        <h4 onClick={handlePrimaryAction} className="font-bold text-gray-100 mb-2 cursor-pointer hover:text-blue-300 transition-colors" title={resource.title}>
          {resource.title}
        </h4>
        <p className="text-sm text-gray-400 flex-grow line-clamp-4">{resource.summary}</p>
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-gray-700/50">
          {isYouTube && (
             <button onClick={() => onSaveToVideoteca(resourceAsLink)} className="flex-1 px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center" title="Salvar na Videoteca">
                <i className="fas fa-plus mr-1.5"></i> Videoteca
            </button>
          )}
           <button onClick={() => onSaveToArchive(resourceAsLink)} className="flex-1 px-2 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 rounded-md flex items-center justify-center" title="Salvar no Arquivo Literário">
                <i className="fas fa-book-atlas mr-1.5"></i> Arquivo
            </button>
           <a href={resource.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1.5 text-xs bg-gray-600 hover:bg-gray-500 rounded-md" title="Abrir em Nova Aba">
                <i className="fas fa-external-link-alt"></i>
            </a>
        </div>
      </div>
    </div>
  );
};


const DeepDiveModal: React.FC<DeepDiveModalProps> = ({ resources, onClose, onPlayVideo, onSaveToVideoteca, onSaveToArchive }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-5xl m-4 border border-blue-600/30 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-gray-700/50 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-blue-300 flex items-center">
            <i className="fas fa-search-plus mr-3"></i>
            Aprofundamento
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </header>
        <main className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((res, index) => (
                <ResourceCard 
                    key={`${res.url}-${index}`} 
                    resource={res}
                    onPlayVideo={onPlayVideo}
                    onSaveToVideoteca={onSaveToVideoteca}
                    onSaveToArchive={onSaveToArchive}
                />
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center text-center h-full text-gray-500">
                <i className="fas fa-box-open text-4xl mb-4"></i>
                <p>Nenhum recurso adicional encontrado para este tópico.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DeepDiveModal;