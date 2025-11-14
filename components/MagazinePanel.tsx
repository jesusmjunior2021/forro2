import React, { useState, useMemo, useEffect } from 'react';
import { Transcription, ReportContent, TTSState } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { getYouTubeEmbedUrl } from '../utils/resourceUtils';

const FONT_COLOR_CLASSES = ['text-gray-200', 'text-white', 'text-yellow-200', 'text-cyan-200', 'text-lime-200'];

const ReportDisplay: React.FC<{ content: ReportContent; fontSize: number; fontColorClass: string; }> = ({ content, fontSize, fontColorClass }) => (
    <div className={`magazine-report ${fontColorClass}`} style={{ fontSize: `${fontSize}px` }}>
        <h1>{content.title}</h1>
        {content.imageUrl && <img src={content.imageUrl} alt={content.title} className="main-image" />}
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

const MagazineArticleCard: React.FC<{
    article: Transcription;
    onCopyToClipboard: (content: ReportContent, transcriptionId: string) => void;
    onCopyTagsToClipboard: (tags: string[], transcriptionId: string) => void;
    onPlayPauseTTS: (id: string) => void;
    onStopTTS: () => void;
    ttsState: TTSState;
    justCopiedId: string | null;
    justCopiedTagsId: string | null;
}> = ({ article, onCopyToClipboard, onCopyTagsToClipboard, onPlayPauseTTS, onStopTTS, ttsState, justCopiedId, justCopiedTagsId }) => {
    const [fontSize, setFontSize] = useState(17);
    const [fontColorIndex, setFontColorIndex] = useState(0);

    const reportContent = article.reportContent;
    if (!reportContent) return null;

    const isJustCopied = justCopiedId === article.id;
    const areTagsJustCopied = justCopiedTagsId === article.id;
    const tags = reportContent.tags;

    const ControlButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
        <button onClick={onClick} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors" title={title}>
            {children}
        </button>
    );

    return (
        <div className="assistant-main-content my-4">
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-400">Salvo em: {new Date(article.timestamp).toLocaleDateString()}</p>
                 <div className="flex items-center space-x-1">
                    <ControlButton onClick={() => onPlayPauseTTS(article.id)} title={ttsState.playingId === article.id && !ttsState.isPaused ? 'Pausar' : 'Ouvir'}>
                        <i className={`fas ${ttsState.playingId === article.id && !ttsState.isPaused ? 'fa-pause' : 'fa-play'}`}></i>
                    </ControlButton>
                    <ControlButton onClick={onStopTTS} title="Parar"><i className="fas fa-stop"></i></ControlButton>
                    <ControlButton onClick={() => onCopyToClipboard(reportContent, article.id)} title={isJustCopied ? "Copiado!" : "Copiar Conteúdo"}>
                        <i className={`fas transition-all ${isJustCopied ? 'fa-check text-green-400' : 'fa-copy'}`}></i>
                    </ControlButton>
                    <div className="w-px h-5 bg-gray-600/50 mx-1"></div>
                    <ControlButton onClick={() => setFontSize(s => Math.max(12, s - 1))} title="Diminuir Fonte"><i className="fas fa-search-minus"></i></ControlButton>
                    <ControlButton onClick={() => setFontSize(s => Math.min(32, s + 1))} title="Aumentar Fonte"><i className="fas fa-search-plus"></i></ControlButton>
                    <ControlButton onClick={() => setFontColorIndex(i => (i + 1) % FONT_COLOR_CLASSES.length)} title="Mudar Cor da Fonte"><i className="fas fa-palette"></i></ControlButton>
                </div>
            </div>

            {tags && tags.length > 0 && (
                <div className="my-3 flex items-center gap-2 border-t border-b border-gray-700/50 py-2">
                    <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2.5 py-1 text-xs font-semibold bg-gray-600 text-gray-200 rounded-full">{tag}</span>
                        ))}
                    </div>
                    <button 
                        onClick={() => onCopyTagsToClipboard(tags, article.id)}
                        title={areTagsJustCopied ? "Tags Copiadas!" : "Copiar Tags"}
                        className="ml-auto w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <i className={`fas transition-all ${areTagsJustCopied ? 'fa-check text-green-400' : 'fa-tags'}`}></i>
                    </button>
                </div>
            )}
            
            <ReportDisplay content={reportContent} fontSize={fontSize} fontColorClass={FONT_COLOR_CLASSES[fontColorIndex]} />
        </div>
    );
};

interface MagazinePanelProps {
    isOpen: boolean;
    onClose: () => void;
    articles: Transcription[];
    onCopyToClipboard: (content: ReportContent, transcriptionId: string) => void;
    onCopyTagsToClipboard: (tags: string[], transcriptionId: string) => void;
    onPlayPauseTTS: (id: string) => void;
    onStopTTS: () => void;
    ttsState: TTSState;
    justCopiedId: string | null;
    justCopiedTagsId: string | null;
}

const MagazinePanel: React.FC<MagazinePanelProps> = ({ isOpen, onClose, articles, onCopyToClipboard, onCopyTagsToClipboard, onPlayPauseTTS, onStopTTS, ttsState, justCopiedId, justCopiedTagsId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'page'>('card');
    const [currentPage, setCurrentPage] = useState(0);

    const filteredArticles = useMemo(() => {
        const sortedArticles = [...articles].sort((a, b) => b.timestamp - a.timestamp);
        if (!searchTerm.trim()) return sortedArticles;
        
        const lowerTerm = searchTerm.toLowerCase();
        return sortedArticles.filter(article => {
            const report = article.reportContent;
            if (!report) return false;
            return (
                report.title.toLowerCase().includes(lowerTerm) ||
                report.summary.toLowerCase().includes(lowerTerm) ||
                report.sections.some(s => s.content.toLowerCase().includes(lowerTerm) || s.heading.toLowerCase().includes(lowerTerm)) ||
                report.tags?.some(t => t.toLowerCase().includes(lowerTerm))
            );
        });
    }, [articles, searchTerm]);

    // Redefine a página atual quando os filtros mudam
    useEffect(() => {
        setCurrentPage(0);
    }, [filteredArticles]);
    
    // Navegação por teclado para o modo de página
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || viewMode !== 'page') return;
            if (e.key === 'ArrowRight') {
                setCurrentPage(p => Math.min(p + 1, filteredArticles.length - 1));
            } else if (e.key === 'ArrowLeft') {
                setCurrentPage(p => Math.max(0, p - 1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, viewMode, filteredArticles.length]);

    const goToPage = (pageIndex: number) => {
        setCurrentPage(Math.max(0, Math.min(pageIndex, filteredArticles.length - 1)));
    };

    const renderCardView = () => (
        filteredArticles.map(article => (
            <MagazineArticleCard 
                key={article.id} 
                article={article} 
                onCopyToClipboard={onCopyToClipboard}
                onCopyTagsToClipboard={onCopyTagsToClipboard}
                onPlayPauseTTS={onPlayPauseTTS} 
                onStopTTS={onStopTTS} 
                ttsState={ttsState}
                justCopiedId={justCopiedId}
                justCopiedTagsId={justCopiedTagsId}
            />
        ))
    );

    const renderPageView = () => {
        const article = filteredArticles[currentPage];
        if (!article) return renderEmptyState();

        return (
            <div className="flex flex-col h-full">
                <div className="flex-grow">
                    <MagazineArticleCard 
                        article={article} 
                        onCopyToClipboard={onCopyToClipboard} 
                        onCopyTagsToClipboard={onCopyTagsToClipboard}
                        onPlayPauseTTS={onPlayPauseTTS} 
                        onStopTTS={onStopTTS} 
                        ttsState={ttsState} 
                        justCopiedId={justCopiedId}
                        justCopiedTagsId={justCopiedTagsId}
                    />
                </div>
                <div className="flex-shrink-0 flex items-center justify-center p-2 space-x-4 sticky bottom-0 bg-gray-800/80 backdrop-blur-sm">
                    <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <span className="text-sm font-semibold text-gray-400">Página {currentPage + 1} de {filteredArticles.length}</span>
                    <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= filteredArticles.length - 1} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">
                        <i className="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        );
    };

    const renderEmptyState = () => (
        <div className="text-center py-16 px-6 flex flex-col items-center justify-center h-full">
            <i className="fas fa-folder-open text-4xl text-gray-500 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-400">
                {articles.length === 0 ? "Sua revista está vazia" : "Nenhuma reportagem encontrada"}
            </h3>
            <p className="text-gray-500 mt-1 text-sm">
                 {articles.length === 0 ? "Salve reportagens do chat para vê-las aqui." : "Tente um termo de busca diferente."}
            </p>
        </div>
    );
    
    return (
        <div className={`slate-panel w-full max-w-6xl ${isOpen ? 'open' : ''} flex flex-col`}>
            <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                    <i className="fas fa-book-journal-whills mr-3"></i> Revista Eletrônica
                </h3>
                 <div className="flex items-center space-x-4">
                    <div className="relative w-64">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                        <input type="text" placeholder="Buscar na revista..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-900/80 border border-gray-600 rounded-md text-sm pl-9 pr-3 py-2" />
                    </div>
                    <div className="bg-gray-700 p-1 rounded-lg flex items-center space-x-1">
                        <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`} title="Modo Cartão">
                            <i className="fas fa-th-large"></i>
                        </button>
                        <button onClick={() => setViewMode('page')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'page' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`} title="Modo Leitura">
                            <i className="fas fa-book-open"></i>
                        </button>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors"><i className="fas fa-times"></i></button>
                 </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4">
                {filteredArticles.length === 0 
                    ? renderEmptyState() 
                    : viewMode === 'card' ? renderCardView() : renderPageView()
                }
            </main>
        </div>
    );
};

export default MagazinePanel;
