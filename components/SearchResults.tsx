import React, { useState } from 'react';
import { ResourceLink, Video } from '../types';

interface TagClusterProps {
    tags: string[];
}

const TagCluster: React.FC<TagClusterProps> = ({ tags }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!tags || tags.length === 0) {
        return null;
    }

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation(); // Previne que o link pai seja acionado
        setIsExpanded(prev => !prev);
    };

    const visibleTags = isExpanded ? tags : tags.slice(0, 1);
    const hasMoreTags = tags.length > 1;

    return (
        <div className="tag-cluster-container" onClick={(e) => e.stopPropagation()}>
            {visibleTags.map((tag, index) => (
                <span key={index} className="tag-pill">
                    {tag}
                </span>
            ))}
            {hasMoreTags && !isExpanded && (
                <button onClick={handleToggle} className="tag-pill tag-more-btn" title="Mostrar mais tags">
                    <i className="fas fa-angle-double-right"></i>
                </button>
            )}
            {isExpanded && (
                 <button onClick={handleToggle} className="tag-pill tag-less-btn" title="Recolher tags">
                    <i className="fas fa-angle-double-left"></i>
                </button>
            )}
        </div>
    );
};


interface ResourcePanelProps {
  links: ResourceLink[];
  onPlayVideo: (url: string) => void;
  onAddVideoToLibrary: (resource: ResourceLink) => void;
  onAddToArchive: (resource: ResourceLink) => void;
  videos: Video[];
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ links, onPlayVideo, onAddVideoToLibrary, onAddToArchive, videos }) => {
  if (!links || links.length === 0) {
    return null;
  }

  const isYouTubeLink = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

  const handleClick = (e: React.MouseEvent, link: ResourceLink) => {
      // Don't trigger on clicks on buttons or links inside
      if ((e.target as HTMLElement).closest('button, a, .tag-cluster-container')) {
        return;
      }
      if (isYouTubeLink(link.uri)) {
          e.preventDefault();
          onPlayVideo(link.uri);
      } else {
          window.open(link.uri, '_blank', 'noopener,noreferrer');
      }
  };

  return (
    <div className="resource-panel">
      <h3 className="resource-panel-title">
        <i className="fas fa-link mr-2"></i>
        Recursos
      </h3>
      <div className="resource-list">
        {links.map((link, index) => {
            const videoInLibrary = videos.find(v => v.videoUrl === link.uri);
            const isAdded = !!videoInLibrary;
            const isBeingAdded = videoInLibrary?.isProcessing === true;
            let hostname = '';
            try {
                hostname = new URL(link.uri).hostname.replace('www.', '');
            } catch (e) {
                hostname = link.uri;
            }

            return (
              <div key={`${link.uri}-${index}`} className="resource-item">
                <div 
                  className="resource-link"
                >
                  <div className="cursor-pointer" onClick={(e) => handleClick(e, link)}>
                    {link.thumbnailUrl ? (
                      <img src={link.thumbnailUrl} alt={`Thumbnail for ${link.title}`} className="resource-thumbnail" />
                    ) : (
                      <div className="resource-thumbnail-placeholder">
                        <i className="fas fa-link text-gray-500 text-2xl"></i>
                      </div>
                    )}
                  </div>
                  
                  <div className="resource-info">
                    <span className="resource-title" onClick={(e) => handleClick(e, link)} title={link.title}>{link.title}</span>
                    {link.summary && <p className="text-xs text-gray-400 mt-1 line-clamp-3 flex-grow">{link.summary}</p>}
                    <div className="mt-auto pt-2">
                        {link.tags && link.tags.length > 0 && <TagCluster tags={link.tags} />}
                    </div>
                  </div>

                  <div className="resource-actions">
                    <span className="resource-uri flex-grow" title={link.uri}>{hostname}</span>
                    <div className="flex items-center space-x-1 shrink-0">
                      {link.isLoading ? (
                        <i className="fas fa-spinner fa-spin text-yellow-400" title="Analisando fonte..."></i>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); onAddToArchive(link); }}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-purple-600 hover:bg-purple-500 text-white"
                            title="Adicionar ao Arquivo Literário"
                          >
                            <i className="fas fa-book-atlas text-xs"></i>
                          </button>
                          {isYouTubeLink(link.uri) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onAddVideoToLibrary(link); }}
                              disabled={isAdded || isBeingAdded}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors text-sm ${
                                isAdded && !isBeingAdded
                                  ? 'bg-green-600 text-white cursor-default'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-500 disabled:cursor-wait'
                              }`}
                              title={
                                  isBeingAdded ? "Adicionando..." 
                                  : isAdded ? "Adicionado à Videoteca" 
                                  : "Adicionar à Videoteca"
                              }
                            >
                              {isBeingAdded ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${isAdded ? 'fa-check' : 'fa-plus'} text-xs`}></i>}
                            </button>
                          )}
                          <a
                            href={link.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-gray-600 hover:bg-gray-500 text-white"
                            title="Abrir em nova aba"
                          >
                              <i className="fas fa-external-link-alt text-xs"></i>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
        })}
      </div>
    </div>
  );
};

export default ResourcePanel;