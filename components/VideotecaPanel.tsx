import React, { useState, useMemo } from 'react';
import { Video } from '../types';

interface VideotecaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  videos: Video[];
  onAddVideoByUrl: (url: string) => void;
  onDeleteVideo: (videoId: string) => void;
  isProcessing: boolean;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    let videoId = null;
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    if (match) videoId = match[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
};

const VideoDetailModal: React.FC<{ video: Video | null; onClose: () => void; }> = ({ video, onClose }) => {
  if (!video) return null;

  const embedUrl = getYouTubeEmbedUrl(video.videoUrl);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl m-4 border border-gray-700 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-gray-700 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-semibold text-gray-200 truncate pr-4" title={video.title}>{video.title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors shrink-0">
            <i className="fas fa-times"></i>
          </button>
        </header>

        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-3/5 lg:w-2/3 bg-black">
            {embedUrl ? (
              <iframe
                className="w-full h-full aspect-video"
                src={embedUrl}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.title}
              ></iframe>
            ) : <div className="w-full h-full flex items-center justify-center text-red-400">Preview indisponível.</div>}
          </div>

          <div className="w-full md:w-2/5 lg:w-1/3 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <div>
              <h4 className="font-bold text-blue-300 mb-2">Resumo da IA</h4>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{video.isProcessing ? 'Analisando vídeo...' : video.summary || 'Nenhum resumo disponível.'}</p>
            </div>
            <div>
              <h4 className="font-bold text-blue-300 mb-2">Tópicos Chave</h4>
              <div className="flex flex-wrap gap-2">
                {video.isProcessing ? (
                   <span className="text-xs text-gray-400">Gerando tags...</span>
                ) : (video.tags && video.tags.length > 0) ? (
                  video.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 text-xs font-semibold bg-gray-600 text-gray-200 rounded-full">{tag}</span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">Nenhuma tag encontrada.</span>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};


const VideoCard: React.FC<{ video: Video; onSelect: () => void; onDelete: () => void; }> = ({ video, onSelect, onDelete }) => {
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Tem certeza que deseja excluir o vídeo "${video.title}"?`)) {
            onDelete();
        }
    };

    return (
    <div className="resource-card group" >
      <div className="resource-card-thumbnail">
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
        <div className="resource-card-overlay cursor-pointer" onClick={onSelect}>
            <i className="fas fa-eye text-white text-4xl"></i>
        </div>
        {video.isProcessing && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
            </div>
        )}
        <button 
            onClick={handleDelete}
            className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-700"
            title="Excluir da Videoteca"
        >
            <i className="fas fa-trash-alt text-xs"></i>
        </button>
      </div>
      <div className="p-3 cursor-pointer" onClick={onSelect}>
        <h4 className="font-bold text-sm text-gray-100 line-clamp-2" title={video.title}>{video.title}</h4>
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{video.isProcessing ? 'Sumarizando com IA...' : video.summary}</p>
        <div className="flex flex-wrap gap-1 mt-2 h-5 overflow-hidden">
            {video.tags?.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 text-[10px] bg-blue-900/70 text-blue-200 rounded-full">{tag}</span>
            ))}
        </div>
      </div>
    </div>
  );
};

const VideotecaPanel: React.FC<VideotecaPanelProps> = ({ isOpen, onClose, videos, onAddVideoByUrl, onDeleteVideo, isProcessing }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [urlToAdd, setUrlToAdd] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlToAdd.trim()) {
        onAddVideoByUrl(urlToAdd);
        setUrlToAdd('');
    }
  };

  const filteredVideos = useMemo(() => {
    // Assuming new videos are added to the end, reverse to show newest first
    const sortedVideos = [...videos].reverse();
    if (!searchTerm.trim()) {
      return sortedVideos;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return sortedVideos.filter(video =>
      video.title.toLowerCase().includes(lowercasedTerm) ||
      (video.channel && video.channel.toLowerCase().includes(lowercasedTerm)) ||
      (video.summary && video.summary.toLowerCase().includes(lowercasedTerm)) ||
      (video.tags && video.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm)))
    );
  }, [videos, searchTerm]);

  return (
    <>
      <div className={`slate-panel w-full max-w-4xl ${isOpen ? 'open' : ''} flex flex-col`}>
        <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
          <h3 className="text-lg font-semibold text-gray-200 flex items-center">
            <i className="fas fa-play-circle mr-3"></i>
            Videoteca
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </header>

        <div className="p-4 shrink-0 border-b border-gray-700/50 space-y-2">
           <form onSubmit={handleAddUrl} className="flex items-center space-x-2">
                <input
                    type="text"
                    placeholder="Adicionar vídeo por link do YouTube..."
                    value={urlToAdd}
                    onChange={(e) => setUrlToAdd(e.target.value)}
                    disabled={isProcessing}
                    className="input-glow-border w-full bg-[#1F2937] text-gray-200 placeholder-gray-500 rounded-lg px-4 py-2 text-sm focus:outline-none"
                />
                 <button
                    type="submit"
                    disabled={isProcessing || !urlToAdd.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex-shrink-0 flex items-center justify-center transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed text-sm"
                >
                    {isProcessing ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-plus mr-2"></i>}
                    Analisar
                </button>
            </form>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por título, canal, resumo ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-600 rounded-md text-sm pl-9 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredVideos.map(video => (
                <VideoCard 
                    key={video.id} 
                    video={video} 
                    onSelect={() => setSelectedVideo(video)} 
                    onDelete={() => onDeleteVideo(video.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full text-gray-500">
              <i className="fas fa-video-slash text-4xl mb-4"></i>
              {videos.length > 0 && searchTerm ? (
                <p>Nenhum vídeo encontrado para "{searchTerm}".</p>
              ) : (
                <>
                  <p>Sua videoteca está vazia.</p>
                  <p className="text-xs mt-1">Adicione vídeos a partir das fontes de pesquisa ou cole um link acima.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <VideoDetailModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </>
  );
};

export default VideotecaPanel;