import React, { useRef, useEffect } from 'react';
import { Transcription, LocalContextLink, ResourceLink, Video, MagazineTopic, ReportContent } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import ResourcePanel from './SearchResults';
import ContextSourcesPanel from './ContextSourcesPanel';
import { getYouTubeEmbedUrl } from '../utils/resourceUtils';

interface TranscriptionDisplayProps {
  transcriptions: Transcription[];
  interactionMode: 'live' | 'chat';
  onPlayPauseTTS: (id: string) => void;
  onStopTTS: () => void;
  playingTTSId: string | null;
  isTTSPaused: boolean;
  onPlayVideo: (url: string) => void;
  onLoadLocalContext: (link: LocalContextLink) => void;
  onAddVideoToLibrary: (resource: ResourceLink) => void;
  onAddResourceToArchive: (resource: ResourceLink) => void;
  videos: Video[];
  onOpenDeepDive?: (resources: MagazineTopic['deepDiveResources']) => void;
  reportFontSize: number;
  reportFontColorClass: string;
  onFontSizeChange: (direction: 'increase' | 'decrease') => void;
  onCycleFontColor: () => void;
}

const ReportDisplay: React.FC<{ content: ReportContent; fontSize: number; fontColorClass: string; }> = ({ content, fontSize, fontColorClass }) => (
    <div className={`magazine-report ${fontColorClass}`} style={{ fontSize: `${fontSize}px` }}>
        <h1>{content.title}</h1>
        
        {content.imageUrl && (
            <img src={content.imageUrl} alt={content.title} className="main-image" />
        )}
        
        <p className="main-summary">{content.summary}</p>
        
        <div className="space-y-12">
            {content.sections.map((section, index) => {
                const embedUrl = section.videoUrl ? getYouTubeEmbedUrl(section.videoUrl) : null;
                const podcastUrl = section.podcastUrl;
                const imageUrl = section.imageUrl;
                const hasMedia = !!embedUrl || !!podcastUrl || !!imageUrl;
                const layoutClass = index % 2 === 0 ? 'layout-image-left' : 'layout-image-right';

                return (
                    <div key={index} className={`magazine-section ${hasMedia ? layoutClass : ''}`}>
                        <div className="magazine-section-text">
                            <h2>{section.heading}</h2>
                            <MarkdownRenderer content={section.content} searchTerm="" />
                        </div>
                        {hasMedia && (
                            <div className="magazine-section-media">
                                {imageUrl && (
                                     <img src={imageUrl} alt={section.heading} />
                                )}
                                {embedUrl && (
                                    <div className="magazine-video-embed-container">
                                        <iframe
                                            src={embedUrl!}
                                            title={section.heading}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                )}
                                {podcastUrl && (
                                    <div className="magazine-podcast-player">
                                        <audio controls src={podcastUrl} className="w-full">
                                            Seu navegador não suporta o elemento de áudio.
                                        </audio>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);


const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ 
  transcriptions, 
  interactionMode, 
  onPlayPauseTTS, 
  onStopTTS, 
  playingTTSId,
  isTTSPaused,
  onPlayVideo,
  onLoadLocalContext,
  onAddVideoToLibrary,
  onAddResourceToArchive,
  videos,
  onOpenDeepDive,
  reportFontSize,
  reportFontColorClass,
  onFontSizeChange,
  onCycleFontColor
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions]);

  const ControlButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
    <button onClick={onClick} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors" title={title}>
      {children}
    </button>
  );

  if (interactionMode === 'live') {
     // Live mode now has a dedicated view, this component is for chat history.
     // It can show post-live session transcripts if desired.
     return null;
  }
  
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
      {transcriptions.map((t) => {
        if (t.speaker === 'assistant') {
          const hasWebResources = t.resourceLinks && t.resourceLinks.length > 0;
          const hasLocalResources = t.localContextLinks && t.localContextLinks.length > 0;

          return (
            <div key={t.id} className="flex items-start gap-4 justify-start animate-slide-in-up">
              <i className="fas fa-brain text-2xl text-blue-400 mt-2 flex-shrink-0"></i>
              <div className="assistant-response-container">
                <div className="assistant-main-content">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm">Assistente</span>
                     <div className="flex items-center space-x-1">
                        <ControlButton onClick={() => onPlayPauseTTS(t.id)} title={playingTTSId === t.id && !isTTSPaused ? 'Pausar' : 'Ouvir'}>
                            <i className={`fas ${playingTTSId === t.id && !isTTSPaused ? 'fa-pause' : 'fa-play'}`}></i>
                        </ControlButton>
                        <ControlButton onClick={onStopTTS} title="Parar"><i className="fas fa-stop"></i></ControlButton>
                        
                        {t.reportContent && (
                          <>
                            <div className="w-px h-5 bg-gray-600/50 mx-1"></div>
                            <ControlButton onClick={() => onFontSizeChange('decrease')} title="Diminuir Fonte">
                                <i className="fas fa-search-minus"></i>
                            </ControlButton>
                            <ControlButton onClick={() => onFontSizeChange('increase')} title="Aumentar Fonte">
                                <i className="fas fa-search-plus"></i>
                            </ControlButton>
                            <ControlButton onClick={onCycleFontColor} title="Mudar Cor da Fonte">
                                <i className="fas fa-palette"></i>
                            </ControlButton>
                          </>
                        )}
                    </div>
                  </div>
                  {t.image && (
                     <div className="mt-2 mb-2">
                       <img src={t.image.data} alt={t.image.name} className="max-w-xs max-h-48 rounded-lg border border-gray-600" />
                     </div>
                   )}
                   
                   {t.reportContent ? (
                       <ReportDisplay 
                          content={t.reportContent} 
                          fontSize={reportFontSize}
                          fontColorClass={reportFontColorClass}
                        />
                   ) : t.structuredContent && onOpenDeepDive ? ( // Modo Revista Antigo
                      <div className="prose prose-invert max-w-none">
                        <MarkdownRenderer content={t.structuredContent.mainSummary} searchTerm="" />
                        <div className="space-y-4 mt-4">
                          {t.structuredContent.topics.map(topic => (
                            <div key={topic.topicNumber} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                              <h3 className="font-bold text-lg text-blue-300 mb-2">{`${topic.topicNumber}. ${topic.title}`}</h3>
                              <MarkdownRenderer content={topic.summary} searchTerm="" />
                              <div className="mt-3 text-right">
                                <button
                                  onClick={() => onOpenDeepDive(topic.deepDiveResources)}
                                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
                                >
                                  <i className="fas fa-search-plus mr-2"></i>Saiba Mais
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <MarkdownRenderer content={t.text} searchTerm="" />
                    )}

                </div>
                {hasLocalResources && <ContextSourcesPanel links={t.localContextLinks!} onLoad={onLoadLocalContext} />}
                {hasWebResources && <ResourcePanel links={t.resourceLinks!} onPlayVideo={onPlayVideo} onAddVideoToLibrary={onAddVideoToLibrary} onAddToArchive={onAddResourceToArchive} videos={videos} />}
              </div>
            </div>
          );
        }

        // User and System messages
        return (
          <div key={t.id} className={`flex items-end gap-3 ${t.speaker === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-up`}>
            {t.speaker === 'system' && <i className="fas fa-info-circle text-xl text-yellow-400 mb-2"></i>}
            <div className={`transcription-bubble ${t.speaker}`}>
               <div className="flex justify-between items-center mb-1">
                 <span className="font-bold text-sm">
                     {t.speaker === 'user' ? 'Você' : 'Sistema'}
                 </span>
                 <span className="text-xs text-gray-400/80 ml-3">
                    {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
               </div>
               {t.toolCall && (
                  <div className="mt-1 p-2 bg-gray-800/50 rounded-md">
                      <p className="text-xs italic text-gray-400 flex items-center">
                          <i className="fas fa-cogs mr-2 animate-spin"></i>
                          Usando ferramenta: <strong>{t.toolCall.name}</strong>
                      </p>
                      <p className="text-xs font-mono text-gray-500 mt-1">Busca: "{JSON.stringify(t.toolCall.args.query)}"</p>
                  </div>
                )}
               {t.image && (
                 <div className="mt-2 mb-2">
                   <img src={t.image.data} alt={t.image.name} className="max-w-xs max-h-48 rounded-lg border border-gray-600" />
                 </div>
               )}
               <MarkdownRenderer content={t.text} searchTerm="" />
            </div>
            {t.speaker === 'user' && <i className="fas fa-user-circle text-xl text-gray-400 mb-2"></i>}
          </div>
        );
      })}
    </div>
  );
};

export default TranscriptionDisplay;
