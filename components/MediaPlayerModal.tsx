import React, { useEffect } from 'react';

interface MediaPlayerModalProps {
  videoUrl: string | null;
  onClose: () => void;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    let videoId = null;
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    if (match) {
        videoId = match[1];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
};

const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({ videoUrl, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!videoUrl) return null;

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <div className="media-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="media-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-2 bg-gray-800 flex justify-end">
            <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center"
                title="Fechar Player"
                aria-label="Fechar player de vídeo"
            >
                <i className="fas fa-times text-xl"></i>
            </button>
        </div>
        <div className="flex-1 bg-black flex items-center justify-center">
            {embedUrl ? (
                <div className="media-modal-video-container">
                    <iframe
                        src={embedUrl}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube video player"
                    ></iframe>
                </div>
            ) : (
                <div className="text-center text-red-400">
                    <p>URL do vídeo inválida ou não suportada.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MediaPlayerModal;