import React, { useState } from 'react';
import { Video, Document } from '../types';

interface InsightsHubPanelProps {
    videos: Video[];
    documents: Document[];
    isIngesting: boolean;
    onIngestUrl: (url: string) => void;
    onOpenVideoteca: () => void;
    onOpenDocumentLibrary: () => void;
    onSelectVideo: (videoUrl: string) => void;
    onSelectDocument: (docId: string) => void;
}

const SectionHeader: React.FC<{ icon: string, title: string, onSeeAll: () => void }> = ({ icon, title, onSeeAll }) => (
    <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-gray-200 flex items-center">
            <i className={`fas ${icon} mr-3 text-blue-400`}></i>
            {title}
        </h2>
        <button onClick={onSeeAll} className="text-sm text-blue-400 hover:text-blue-300 font-semibold">
            Ver Todos <i className="fas fa-arrow-right ml-1"></i>
        </button>
    </div>
);

const VideoCard: React.FC<{ video: Video; onSelect: () => void }> = ({ video, onSelect }) => (
    <div className="resource-card cursor-pointer" onClick={onSelect}>
        <div className="resource-card-thumbnail">
            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
            <div className="resource-card-overlay"><i className="fas fa-play text-white text-3xl"></i></div>
             {video.isProcessing && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin text-white text-xl"></i>
                </div>
            )}
        </div>
        <div className="p-3">
            <h4 className="font-bold text-sm text-gray-100 line-clamp-2" title={video.title}>{video.title}</h4>
        </div>
    </div>
);

const DocumentCard: React.FC<{ doc: Document; onSelect: () => void }> = ({ doc, onSelect }) => (
    <div 
        onClick={onSelect}
        className="h-full flex flex-col p-4 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 rounded-lg transition-all duration-200 cursor-pointer"
    >
        <div className="flex items-center mb-2">
            <i className="fas fa-file-alt text-blue-300 mr-2"></i>
            <h4 className="font-bold text-sm text-gray-100 line-clamp-1 flex-1">{doc.title}</h4>
        </div>
        <p className="text-xs text-gray-400 flex-grow line-clamp-2">{doc.content.split('---')[1] || doc.content}</p>
        <p className="text-[10px] text-gray-500 mt-2">{new Date(doc.lastModified).toLocaleDateString()}</p>
    </div>
);


const InsightsHubPanel: React.FC<InsightsHubPanelProps> = ({ 
    videos, documents, isIngesting, onIngestUrl, 
    onOpenVideoteca, onOpenDocumentLibrary, onSelectVideo, onSelectDocument
}) => {
    const [url, setUrl] = useState('');
    
    const recentVideos = [...videos].reverse().slice(0, 4);
    const recentDocuments = [...documents].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()).slice(0, 4);

    const handleIngest = () => {
        if(url.trim() && !isIngesting) {
            onIngestUrl(url);
            setUrl('');
        }
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 animate-fade-in">
            {/* Header and URL Ingestion */}
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 text-center">
                <h1 className="text-3xl font-bold text-white">Sua Central de Insights</h1>
                <p className="text-gray-400 mt-2 mb-4 max-w-2xl mx-auto">Capture conhecimento da web, revise seus conteúdos salvos e conecte as ideias. Comece inserindo um link abaixo.</p>
                <div className="max-w-xl mx-auto flex items-center space-x-2">
                     <input
                        type="text"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleIngest()}
                        placeholder="Cole um link para a IA ler, resumir e salvar..."
                        disabled={isIngesting}
                        className="input-glow-border w-full bg-[#1F2937] text-gray-200 placeholder-gray-500 rounded-lg px-4 py-3 text-base focus:outline-none"
                    />
                    <button
                        onClick={handleIngest}
                        disabled={isIngesting || !url.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-16 h-12 flex-shrink-0 flex items-center justify-center transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        title="Processar Link"
                    >
                        {isIngesting ? <i className="fas fa-spinner fa-spin text-xl"></i> : <i className="fas fa-magic text-xl"></i>}
                    </button>
                </div>
            </div>

            {/* Recent Videos */}
            {recentVideos.length > 0 && (
                <div>
                    <SectionHeader icon="fa-play-circle" title="Videoteca Recente" onSeeAll={onOpenVideoteca} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recentVideos.map(video => (
                            <VideoCard key={video.id} video={video} onSelect={() => onSelectVideo(video.videoUrl)} />
                        ))}
                    </div>
                </div>
            )}
            
            {/* Recent Documents */}
             {recentDocuments.length > 0 && (
                <div>
                    <SectionHeader icon="fa-book-reader" title="Documentos Recentes" onSeeAll={onOpenDocumentLibrary} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recentDocuments.map(doc => (
                            <DocumentCard key={doc.id} doc={doc} onSelect={() => onSelectDocument(doc.id)} />
                        ))}
                    </div>
                </div>
            )}

             {recentVideos.length === 0 && recentDocuments.length === 0 && (
                <div className="text-center text-gray-500 pt-10">
                    <i className="fas fa-box-open text-4xl mb-4"></i>
                    <p>Sua central está vazia.</p>
                    <p className="text-sm">Comece a capturar links ou adicionar vídeos para ver seu conhecimento crescer aqui.</p>
                </div>
             )}
        </div>
    );
};

export default InsightsHubPanel;