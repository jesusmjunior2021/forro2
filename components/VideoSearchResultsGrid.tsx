import React from 'react';
import { Video } from '../types';

const VideoCard: React.FC<{ video: Video; onSelect: () => void; }> = ({ video, onSelect }) => (
    <div className="resource-card cursor-pointer" onClick={onSelect}>
        <div className="resource-card-thumbnail">
            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
            <div className="resource-card-overlay"><i className="fas fa-play text-white text-3xl"></i></div>
        </div>
        <div className="p-3">
            <h4 className="font-bold text-sm text-gray-100 line-clamp-2" title={video.title}>{video.title}</h4>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{video.summary}</p>
        </div>
    </div>
);


interface VideoSearchResultsGridProps {
    videos: Video[];
    onClear: () => void;
    onPlayVideo: (videoUrl: string) => void;
}

const VideoSearchResultsGrid: React.FC<VideoSearchResultsGridProps> = ({ videos, onClear, onPlayVideo }) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
            <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                    <i className="fab fa-youtube mr-3 text-red-500"></i>
                    Resultados da Busca de Vídeos
                </h3>
                <button 
                    onClick={onClear} 
                    className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex items-center"
                >
                    <i className="fas fa-times mr-2"></i>
                    Limpar Resultados
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
                {videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {videos.map(video => (
                        <VideoCard key={video.id} video={video} onSelect={() => onPlayVideo(video.videoUrl)} />
                    ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full text-gray-500">
                    <i className="fas fa-video-slash text-4xl mb-4"></i>
                    <p>Nenhum vídeo encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoSearchResultsGrid;