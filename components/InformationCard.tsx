import React from 'react';
import { InformationCard } from '../types';

interface InformationCardDisplayProps {
  cards: InformationCard[];
  onDismiss: (id: string) => void;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
    let videoId = null;
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    if (match) {
        videoId = match[1];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};


const Card: React.FC<{ card: InformationCard; onDismiss: (id: string) => void; }> = ({ card, onDismiss }) => {
    const youtubeEmbedUrl = card.type === 'video' && card.url ? getYouTubeEmbedUrl(card.url) : null;

    const renderIcon = () => {
        switch(card.type) {
            case 'video': return <i className="fab fa-youtube text-red-400"></i>;
            case 'pdf': return <i className="fas fa-file-pdf text-red-400"></i>;
            case 'link-collection': return <i className="fas fa-layer-group text-purple-400"></i>;
            case 'image': return <i className="fas fa-image text-green-400"></i>;
            case 'link':
            default: return <i className="fas fa-link text-blue-400"></i>;
        }
    }

    return (
        <div className="info-card w-full max-w-sm rounded-xl overflow-hidden pointer-events-auto">
            {/* Header */}
            <header className="p-3 flex justify-between items-center bg-gray-900/50 border-b border-white/10">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                   {renderIcon()}
                   <span className="font-semibold capitalize">{card.type === 'link-collection' ? 'Coleção' : card.type}</span>
                </div>
                <button onClick={() => onDismiss(card.id)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-colors">
                    <i className="fas fa-times"></i>
                </button>
            </header>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto">
                {card.type === 'video' && youtubeEmbedUrl && (
                    <div className="info-card-video-wrapper">
                        <iframe
                            src={youtubeEmbedUrl}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={card.title}
                        ></iframe>
                    </div>
                )}
                {card.imageUrl && card.type !== 'video' && (
                     <div className="p-2 bg-gray-800">
                        <img src={card.imageUrl} alt={card.title} className="w-full h-auto object-contain max-h-72 rounded-lg" />
                     </div>
                )}
                
                <div className="p-4">
                    <h3 className="font-bold text-lg text-white mb-1.5">{card.title}</h3>
                    {card.description && <p className="text-sm text-gray-300 leading-relaxed mb-3">{card.description}</p>}

                    {card.type === 'link-collection' && card.links && (
                        <div className="space-y-2 mt-2">
                            {card.links.map((link, index) => (
                                <a href={link.url} key={index} target="_blank" rel="noopener noreferrer" className="block p-2 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-colors">
                                    <p className="text-sm font-semibold text-blue-300 truncate">{link.title}</p>
                                    <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                </a>
                            ))}
                        </div>
                    )}

                    {card.tags && card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {card.tags.map((tag, i) => (
                                <span key={i} className="px-2.5 py-1 text-xs font-semibold bg-blue-900/70 text-blue-200 rounded-full">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            {(card.url || card.imageUrl) && card.type !== 'link-collection' && (
                 <footer className="p-3 bg-gray-900/50 border-t border-white/10 flex justify-end">
                    <a href={card.url || card.imageUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center">
                        <i className="fas fa-external-link-alt mr-2"></i>
                        Abrir Fonte
                    </a>
                 </footer>
            )}
        </div>
    );
}

const InformationCardDisplay: React.FC<InformationCardDisplayProps> = ({ cards, onDismiss }) => {
  if (cards.length === 0) return null;

  return (
    <div className="fixed inset-0 z-20 p-4 flex flex-col items-end justify-start space-y-4 pointer-events-none">
        {cards.map(card => (
            <Card key={card.id} card={card} onDismiss={onDismiss} />
        ))}
    </div>
  );
};

export default InformationCardDisplay;